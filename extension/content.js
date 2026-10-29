(() => {
  // src/ui/mark.js
  function mascotSvg(size = 40) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M32 7.5c11.6 0 20.4 8.4 21.2 19.6.5 7.4-1.9 13.9-6.1 18.4-3.7 4-9.2 6.2-15.1 6.2s-11.4-2.2-15.1-6.2c-4.2-4.5-6.6-11-6.1-18.4C11.6 15.9 20.4 7.5 32 7.5Z" fill="#AFC6A6" stroke="#87A083" stroke-width="2.2"/>
  <ellipse cx="26.2" cy="27.8" rx="1.9" ry="2.5" fill="#2B342B"/>
  <ellipse cx="37.8" cy="27.8" rx="1.9" ry="2.5" fill="#2B342B"/>
  <path d="M28.6 34.4c1.1 1.4 2.2 2 3.4 2s2.3-.6 3.4-2" stroke="#2B342B" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M21.4 33.2c-1.3-.4-2.5.1-3 1.2M42.6 33.2c1.3-.4 2.5.1 3 1.2" stroke="#2B342B" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
  <g transform="rotate(16 46 34)">
    <rect x="43" y="24" width="5.6" height="16" rx="0.6" fill="#E0A96B" stroke="#B9813F" stroke-width="1.2"/>
    <rect x="43" y="24" width="5.6" height="2.8" fill="#C98C4E"/>
    <path d="M43 40h5.6l-2.8 5.4L43 40Z" fill="#F2E8D4" stroke="#B9813F" stroke-width="1.2"/>
    <path d="M45 44.2 45.8 46l.8-1.8H45Z" fill="#333B33"/>
  </g>
</svg>`;
  }
  function arrowSvg() {
    return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // src/content/toast.js
  var HOST_ID = "jotty-nudge-host";
  function styles() {
    const fontUrl = chrome.runtime.getURL("fonts/PublicSans-Regular.woff2");
    const fontMedium = chrome.runtime.getURL("fonts/PublicSans-Medium.woff2");
    const serifUrl = chrome.runtime.getURL("fonts/InstrumentSerif-Regular.woff2");
    return `
  @font-face { font-family: "Jotty Sans"; src: url("${fontUrl}") format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "Jotty Sans"; src: url("${fontMedium}") format("woff2"); font-weight: 500; font-display: swap; }
  @font-face { font-family: "Jotty Serif"; src: url("${serifUrl}") format("woff2"); font-weight: 400; font-display: swap; }
  :host { all: initial; }
  .toast {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483646;
    width: 352px;
    max-width: calc(100vw - 32px);
    background: #fbf9f4;
    color: #1c231e;
    border: 1px solid #d8d1c3;
    border-radius: 6px;
    box-shadow: 0 18px 40px -26px rgba(20, 26, 21, 0.55);
    font-family: "Jotty Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13.5px;
    line-height: 1.5;
    animation: rise 180ms ease-out;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 22px;
    gap: 10px;
    padding: 13px 12px 12px 13px;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  .mark { padding-top: 2px; }
  .meta {
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #68736a;
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 3px;
  }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #a05f3c; display: inline-block; }
  .dot[data-verdict="adjacent"] { background: #9a7228; }
  .title {
    font-family: "Jotty Serif", Georgia, serif;
    font-size: 19px;
    line-height: 1.2;
    margin: 0 0 4px;
    letter-spacing: -0.005em;
  }
  .reason {
    margin: 0 0 10px;
    color: #3d473f;
    font-size: 12.5px;
  }
  .actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  button {
    font: inherit;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #c2b9a8;
    background: transparent;
    color: #1c231e;
    padding: 5px 9px;
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  button:hover { background: #ece7dc; }
  button:focus-visible { outline: 2px solid #47624b; outline-offset: 2px; }
  .primary {
    background: #1c231e;
    border-color: #1c231e;
    color: #fbf9f4;
    font-weight: 500;
  }
  .primary:hover { background: #33493a; border-color: #33493a; }
  .quiet {
    border-color: transparent;
    color: #68736a;
    padding-left: 4px;
    padding-right: 4px;
  }
  .quiet:hover { background: transparent; color: #1c231e; text-decoration: underline; text-underline-offset: 2px; }
  .close {
    align-self: start;
    border: 0;
    padding: 2px;
    min-height: 22px;
    width: 22px;
    color: #68736a;
    font-size: 16px;
    line-height: 1;
    justify-content: center;
  }
  .close:hover { background: transparent; color: #1c231e; }
  .note { margin: 8px 0 0; font-size: 12px; color: #47624b; }
  .note:empty { display: none; }
  `;
  }
  function createNudge(options = {}) {
    let host = document.getElementById(HOST_ID);
    let root = null;
    let toast = null;
    let hideTimer = null;
    function unmount() {
      clearTimeout(hideTimer);
      host?.remove();
      host = null;
      root = null;
      toast = null;
    }
    function show(judgement, handlers = {}) {
      unmount();
      host = document.createElement("div");
      host.id = HOST_ID;
      host.style.setProperty("all", "initial", "important");
      root = host.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent = styles();
      root.append(style);
      const verdictLabel = judgement.verdict === "adjacent" ? "Related, off task" : "Off task";
      const reason = judgement.reasons && judgement.reasons[0] || "This page is not the assignment.";
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `
      <div class="mark">${mascotSvg(38)}</div>
      <div>
        <div class="meta"><span class="dot" data-verdict="${judgement.verdict}"></span>${verdictLabel} · ${escapeHtml(judgement.host || "")}</div>
        <p class="title">${escapeHtml(judgement.coachLine || "This is not the assignment.")}</p>
        <p class="reason">${escapeHtml(reason)}</p>
        <div class="actions">
          <button type="button" class="primary" data-action="back">Back to task ${arrowSvg()}</button>
          <button type="button" data-action="snooze">Snooze</button>
          <button type="button" class="quiet" data-action="helpful">This helps</button>
        </div>
        <p class="note" data-note></p>
      </div>
      <button type="button" class="close" data-action="close" aria-label="Dismiss nudge">&times;</button>
    `;
      root.append(toast);
      const note = toast.querySelector("[data-note]");
      toast.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        if (action === "close") {
          handlers.onDismiss?.();
          unmount();
        }
        if (action === "back") {
          button.disabled = true;
          await handlers.onBack?.();
          unmount();
        }
        if (action === "snooze") {
          handlers.onSnooze?.();
          note.textContent = `Quiet for ${options.snoozeMinutes || 10} minutes.`;
          setTimeout(unmount, 1400);
        }
        if (action === "helpful") {
          button.disabled = true;
          await handlers.onHelpful?.();
          note.textContent = "Noted. This stays on your device.";
        }
      });
      document.documentElement.append(host);
      hideTimer = setTimeout(() => {
        if (handlers.onTimeout) handlers.onTimeout();
      }, 3e4);
    }
    return { show, hide: unmount, isVisible: () => Boolean(host?.isConnected) };
  }
  function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/content/block.js
  var HOST_ID2 = "jotty-block-host";
  function styles2() {
    const sans = chrome.runtime.getURL("fonts/PublicSans-Regular.woff2");
    const sansMedium = chrome.runtime.getURL("fonts/PublicSans-Medium.woff2");
    const serif = chrome.runtime.getURL("fonts/InstrumentSerif-Regular.woff2");
    return `
  @font-face { font-family: "Jotty Sans"; src: url("${sans}") format("woff2"); font-weight: 400; font-display: swap; }
  @font-face { font-family: "Jotty Sans"; src: url("${sansMedium}") format("woff2"); font-weight: 500; font-display: swap; }
  @font-face { font-family: "Jotty Serif"; src: url("${serif}") format("woff2"); font-weight: 400; font-display: swap; }
  :host { all: initial; }
  .wrap {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #f4f1ea;
    color: #1c231e;
    font-family: "Jotty Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.55;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow-y: auto;
  }
  .card {
    width: min(560px, 100%);
    background: #fbf9f4;
    border: 1px solid #d8d1c3;
    border-radius: 7px;
    padding: 30px 30px 26px;
  }
  .mark { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .mark span {
    font-family: "Jotty Serif", Georgia, serif;
    font-size: 20px;
    letter-spacing: -0.01em;
  }
  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #68736a;
    margin: 0 0 6px;
  }
  h1 {
    font-family: "Jotty Serif", Georgia, serif;
    font-weight: 400;
    font-size: clamp(28px, 5vw, 38px);
    line-height: 1.1;
    letter-spacing: -0.015em;
    margin: 0 0 10px;
  }
  .task {
    border-left: 2px solid #7c9a76;
    padding-left: 12px;
    margin: 16px 0;
    color: #3d473f;
    font-size: 13.5px;
  }
  .task strong { display: block; color: #1c231e; font-weight: 500; }
  .reason { color: #3d473f; margin: 0 0 16px; font-size: 14px; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  button {
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #c2b9a8;
    background: transparent;
    color: #1c231e;
    padding: 9px 14px;
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  button:hover { background: #ece7dc; border-color: #3d473f; }
  button:focus-visible { outline: 2px solid #47624b; outline-offset: 2px; }
  button.primary { background: #1c231e; border-color: #1c231e; color: #fbf9f4; }
  button.primary:hover { background: #33493a; border-color: #33493a; }
  button[disabled] { opacity: 0.55; cursor: not-allowed; }
  button.quiet { border-color: transparent; color: #68736a; padding-left: 4px; padding-right: 4px; }
  button.quiet:hover { background: transparent; text-decoration: underline; text-underline-offset: 2px; color: #1c231e; }
  .foot { margin-top: 18px; font-size: 12px; color: #68736a; }
  .count { font-variant-numeric: tabular-nums; }
  `;
  }
  function createBlocker() {
    let host = null;
    let root = null;
    let previousOverflow = "";
    function close() {
      if (!host) return;
      host.remove();
      host = null;
      root = null;
      document.documentElement.style.overflow = previousOverflow;
      document.documentElement.style.removeProperty("overflow");
    }
    function show(judgement, handlers = {}) {
      close();
      previousOverflow = document.documentElement.style.overflow;
      host = document.createElement("div");
      host.id = HOST_ID2;
      root = host.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent = styles2();
      root.append(style);
      const strict = Boolean(handlers.strict);
      const delay = Math.max(3, Number(handlers.delaySeconds) || 8);
      const hostName = judgement.host || "this site";
      const task = handlers.task || "the assignment";
      const reason = judgement.reasons && judgement.reasons[0] || `${hostName} is not part of “${task}”.`;
      const wrap = document.createElement("div");
      wrap.className = "wrap";
      wrap.setAttribute("role", "dialog");
      wrap.setAttribute("aria-modal", "true");
      wrap.setAttribute("aria-labelledby", "jotty-block-title");
      wrap.innerHTML = `
      <div class="card">
        <div class="mark">${mascotSvg(34)}<span>Jotty</span></div>
        <p class="eyebrow">${strict ? "Strict mode" : "Focus session"} · ${escapeHtml2(hostName)}</p>
        <h1 id="jotty-block-title">This is the doorway.</h1>
        <div class="task"><strong>Your task</strong>${escapeHtml2(task)}</div>
        <p class="reason">${escapeHtml2(reason)}</p>
        <div class="actions">
          <button type="button" class="primary" data-action="back">Back to the assignment ${arrowSvg()}</button>
          ${strict ? `<button type="button" data-action="end">End the session</button>` : `<button type="button" data-action="continue" disabled>Continue in <span class="count">${delay}</span>s</button>`}
        </div>
        <p class="foot">${strict ? "Strict mode has no override. Ending the session is the only way through." : "Continuing is allowed. Jotty logs the choice, nothing else."}</p>
      </div>
    `;
      root.append(wrap);
      document.documentElement.style.overflow = "hidden";
      document.documentElement.append(host);
      const continueButton = wrap.querySelector('[data-action="continue"]');
      const focusables = () => [...wrap.querySelectorAll("button:not([disabled])")];
      const primary = wrap.querySelector('[data-action="back"]');
      primary?.focus();
      wrap.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        if (action === "back") {
          button.disabled = true;
          await handlers.onBack?.();
          close();
        }
        if (action === "continue") {
          handlers.onContinue?.();
          close();
        }
        if (action === "end") {
          button.disabled = true;
          await handlers.onEndSession?.();
          close();
        }
      });
      wrap.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      if (!strict && continueButton) {
        let left = delay;
        const timer = setInterval(() => {
          left -= 1;
          if (!continueButton.isConnected) {
            clearInterval(timer);
            return;
          }
          if (left <= 0) {
            clearInterval(timer);
            continueButton.disabled = false;
            continueButton.textContent = "Continue anyway";
          } else {
            continueButton.innerHTML = `Continue in <span class="count">${left}</span>s`;
          }
        }, 1e3);
      }
    }
    return { show, close, isOpen: () => Boolean(host) };
  }
  function escapeHtml2(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/content/content.js
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
    let snooze = /* @__PURE__ */ new Map();
    let blockedKeys = /* @__PURE__ */ new Set();
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
        'link[itemprop="name"]'
      ];
      for (const selector of selectors) {
        const node = document.querySelector(selector);
        const value = node?.textContent || node?.getAttribute?.("content") || "";
        if (value.trim()) return value.trim().slice(0, 80);
      }
      return "";
    }
    function pageInfo() {
      const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
      return {
        title: cleanTitle(),
        url: location.href,
        channel: channelName(),
        description: description.slice(0, 400)
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
        task: judgement.task
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
        }
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
          snooze.set(host, Date.now() + (Number(settings.nudgeSnoozeMinutes) || 10) * 6e4);
          await logAction("nudge-snoozed");
        },
        onHelpful: async () => {
          await send("feedback:add", {
            kind: "helpful",
            page: pageInfo(),
            verdict: judgement.verdict,
            task: judgement.task
          });
        },
        onDismiss: async () => {
          await logAction("nudge-dismissed");
        },
        onTimeout: () => {
          hideNudge();
        }
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
          page: pageInfo()
        });
      }, 3e4);
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
        blockedKeys = /* @__PURE__ */ new Set();
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
})();
