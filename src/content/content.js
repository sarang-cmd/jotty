/**
 * In-page coach. Runs in the isolated world on http(s) pages.
 *
 * What it reads: document.title, location.href, the description meta tag and,
 * on YouTube, the channel name. That is the entire input to the judge. It does
 * not read page text, typed text, forms, or anything behind a login.
 */

import { createNudge } from "./toast.js";
import { createBlocker } from "./block.js";

if (window.top === window.self && !window.__jottyCoachLoaded) {
  window.__jottyCoachLoaded = true;
  startCoach();
}

function startCoach() {
  const NS = "jotty";
  let session = null;
  let settings = null;
  let judgement = null;
  let currentPageKey = "";
  let lastJudgedKey = "";
  let judgeTimer = null;
  let tickTimer = null;
  let urlWatch = null;
  let snooze = new Map();
  let blockedKeys = new Set();
  const nudge = createNudge({ snoozeMinutes: 10 });
  const blocker = createBlocker();

  function send(type, payload = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ ns: NS, type, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || { ok: false, error: "No response" });
        });
      } catch (error) {
        resolve({ ok: false, error: String(error && error.message) });
      }
    });
  }

  function isYouTube() {
    return /(^|\.)youtube\.com$/.test(location.hostname);
  }

  function cleanTitle() {
    let title = document.title || "";
    if (isYouTube()) title = title.replace(/\s*-\s*YouTube\s*$/, "");
    return title.replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function channelName() {
    if (!isYouTube()) return "";
    const selectors = [
      "ytd-watch-metadata ytd-channel-name a",
      "#owner ytd-channel-name a",
      "ytd-video-owner-renderer ytd-channel-name a",
      'link[itemprop="name"]',
    ];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = node?.textContent || node?.getAttribute?.("content") || "";
      if (value.trim()) return value.trim().slice(0, 80);
    }
    return "";
  }

  function pageInfo() {
    const description =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      "";
    return {
      title: cleanTitle(),
      url: location.href,
      channel: channelName(),
      description: description.slice(0, 400),
    };
  }

  function pageKey() {
    return `${location.href.split("#")[0]}::${cleanTitle()}`;
  }

  function hideNudge() {
    nudge.hide();
  }

  async function backToTask() {
    const response = await send("session:back");
    if (response?.ok && response.url && /^https?:/i.test(response.url)) {
      location.assign(response.url);
      return;
    }
    if (history.length > 1) {
      history.back();
      return;
    }
    await send("focus:open");
  }

  async function logAction(action) {
    if (!judgement) return;
    await send("page:action", {
      action,
      page: pageInfo(),
      verdict: judgement.verdict,
      eventId: judgement.eventId || "",
      task: judgement.task,
    });
  }

  function showBlocker(context) {
    const key = location.href.split("#")[0];
    if (blockedKeys.has(key)) return;
    blockedKeys.add(key);
    hideNudge();
    blocker.show(judgement, {
      strict: context.strict,
      delaySeconds: context.delaySeconds,
      task: judgement.task || session?.task || "",
      onBack: async () => {
        await logAction("blocked-back");
        await backToTask();
      },
      onContinue: async () => {
        await logAction("blocked-continued");
      },
      onEndSession: async () => {
        await send("session:end");
        await logAction("blocked-ended-session");
      },
    });
  }

  function maybeNudge() {
    if (!settings?.nudges) return;
    if (!judgement || judgement.verdict === "on-task" || judgement.verdict === "neutral") return;
    const host = judgement.host || location.hostname;
    const until = snooze.get(host) || 0;
    if (Date.now() < until) return;
    if (nudge.isVisible()) return;
    nudge.show(judgement, {
      onBack: async () => {
        await logAction("nudge-back");
        await backToTask();
      },
      onSnooze: async () => {
        snooze.set(host, Date.now() + (Number(settings.nudgeSnoozeMinutes) || 10) * 60000);
        await logAction("nudge-snoozed");
      },
      onHelpful: async () => {
        await send("feedback:add", {
          kind: "helpful",
          page: pageInfo(),
          verdict: judgement.verdict,
          task: judgement.task,
        });
      },
      onDismiss: async () => {
        await logAction("nudge-dismissed");
      },
      onTimeout: () => {
        hideNudge();
      },
    });
  }

  function startTicking() {
    clearInterval(tickTimer);
    tickTimer = setInterval(async () => {
      if (!session || session.status !== "active") return;
      if (document.visibilityState !== "visible") return;
      if (!judgement || judgement.verdict === "neutral") return;
      await send("habits:tick", {
        seconds: 30,
        verdict: judgement.verdict,
        page: pageInfo(),
      });
    }, 30000);
  }

  async function judge(force = false) {
    const key = pageKey();
    if (!force && key === lastJudgedKey) return;
    lastJudgedKey = key;
    const response = await send("page:judge", { page: pageInfo() });
    if (!response?.ok) return;
    session = response.session;
    settings = response.settings;
    judgement = response.judgement;
    if (response.judgement?.eventId) {
      // stored by the worker so later actions can point back to the event
    }
    startTicking();
    if (response.block?.block) {
      showBlocker(response.block);
      return;
    }
    if (response.nudge) maybeNudge();
    else hideNudge();
  }

  function scheduleJudge(delay = 700) {
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(() => judge(true), delay);
  }

  function watchUrl() {
    let lastHref = location.href;
    urlWatch = setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      blockedKeys = new Set();
      hideNudge();
      blocker.close();
      scheduleJudge(900);
    }, 1200);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (pageKey() !== lastJudgedKey) judge(true);
    }
  });

  window.addEventListener("popstate", () => scheduleJudge(500));

  if (isYouTube()) {
    document.addEventListener("yt-navigate-finish", () => scheduleJudge(800));
    const titleNode = document.querySelector("title");
    if (titleNode) {
      const observer = new MutationObserver(() => scheduleJudge(1200));
      observer.observe(titleNode, { childList: true, characterData: true, subtree: true });
    }
  }

  send("page:hello").then((response) => {
    if (!response?.ok) return;
    session = response.session;
    settings = response.settings;
    if (!session || session.status === "ended") return;
    scheduleJudge(900);
    watchUrl();
  });

  window.addEventListener("pagehide", () => {
    clearInterval(urlWatch);
    clearInterval(tickTimer);
    nudge.hide();
  });
}
