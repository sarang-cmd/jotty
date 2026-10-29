/**
 * MV3 service worker: the only place that reads the YouTube API key, the only
 * place that talks to YouTube, and the writer of the habit log.
 *
 * Page scripts ask for a judgement. They never receive the key, and they never
 * receive the whole habit log.
 */

globalThis.__JOTTY_SERVICE_WORKER__ = true;

import {
  addFeedback,
  addQuota,
  clearAll,
  clearApiKey,
  exportState,
  getApiKey,
  hasApiKey,
  normalizeSettings,
  readQuota,
  readState,
  saveReflection,
  saveSession,
  setApiKey,
  updateState,
  writeState,
} from "../lib/storage.js";
import { judgePage, shouldNudge, softBlockDecision, VERDICT } from "../lib/relevance.js";
import { createSession, pauseSession, resumeSession, endSession } from "../lib/session.js";
import {
  createHabits,
  flaggedEvents,
  markEventAction,
  recordEvent,
  recordSlice,
  pruneHabits,
  summarizeDay,
} from "../lib/habits.js";
import { buildReflection, evaluateReflection } from "../lib/reflection.js";
import { dateKey } from "../lib/text.js";
import { attachVideoDetails, lookupChannel, searchVideos, testKey } from "../lib/youtube-api.js";

const NS = "jotty";
const ALARM_REFLECTION = "jotty-reflection";
const ALARM_SESSION = "jotty-session-end";
const CACHE_TTL = 30 * 60 * 1000;
const SEARCH_COST = 101;

const searchCache = new Map();
const recentEvents = new Map();

chrome.runtime.onInstalled.addListener(async (details) => {
  const state = await readState();
  if (details.reason === "install") {
    state.meta.installedAt = new Date().toISOString();
    await writeState(state);
  }
  await ensureAlarms(state.settings);
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await readState();
  await ensureAlarms(state.settings);
  await updateBadge();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.ns !== NS) return false;
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse({ ok: false, error: safeError(error) }));
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION) {
    const state = await readState();
    if (state.session?.status === "active") {
      notify("Session complete", "The clock is done. End the session in Jotty and write down where you stopped.");
    }
    await updateBadge();
    return;
  }
  if (alarm.name === ALARM_REFLECTION) {
    const state = await readState();
    if (state.settings.reflectionEnabled) {
      const pending = await findPendingReflection(state);
      if (pending) {
        notify(
          "Jotty has a question about yesterday",
          `${pending.count} ${pending.count === 1 ? "page" : "pages"} did not belong to the task. Two minutes now saves the same hour next week.`
        );
      }
    }
    const next = nextReflectionTime(state.settings.reflectionHour);
    chrome.alarms.create(ALARM_REFLECTION, { when: next.getTime(), periodInMinutes: 60 * 24 });
    await updateBadge();
  }
});

function safeError(error) {
  const message = String(error?.message || error || "Unknown error");
  return message.replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted]");
}

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title,
      message,
      priority: 0,
    });
  } catch {
    // Notifications can be disabled by the user; never let that break a session.
  }
}

function nextReflectionTime(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(Number(hour) || 8, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

async function ensureAlarms(settings) {
  const existing = await chrome.alarms.getAll();
  if (!existing.some((alarm) => alarm.name === ALARM_REFLECTION)) {
    chrome.alarms.create(ALARM_REFLECTION, {
      when: nextReflectionTime(settings?.reflectionHour ?? 8).getTime(),
      periodInMinutes: 60 * 24,
    });
  }
  const state = await readState();
  if (state.session?.status === "active") {
    const when = new Date(state.session.endsAt).getTime();
    if (when > Date.now()) chrome.alarms.create(ALARM_SESSION, { when });
  }
}

async function updateBadge() {
  const state = await readState();
  const pending = await findPendingReflection(state);
  if (pending) {
    chrome.action.setBadgeBackgroundColor({ color: "#9a7228" });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setTitle({ title: `Jotty: ${pending.count} pages to reflect on` });
    return;
  }
  const session = state.session;
  if (session?.status === "active") {
    chrome.action.setBadgeBackgroundColor({ color: "#47624b" });
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: `Jotty: ${session.task}` });
    return;
  }
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setTitle({ title: "Jotty" });
}

/** Yesterday, or the most recent day in the last three with unanswered flags. */
async function findPendingReflection(state) {
  if (!state.settings.reflectionEnabled) return null;
  const candidates = [];
  for (let offset = 1; offset <= 3; offset += 1) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    candidates.push(dateKey(d));
  }
  for (const date of candidates) {
    if (state.reflections?.[date]) continue;
    const events = flaggedEvents(state.habits, date);
    if (events.length) return { date, count: events.length };
  }
  return null;
}

async function recordJudgedPage(state, judgement, page) {
  if (judgement.verdict === VERDICT.ON_TASK || judgement.verdict === VERDICT.NEUTRAL) return null;
  const key = `${page.url.split("#")[0]}`;
  const last = recentEvents.get(key);
  if (last && Date.now() - last.ts < 5 * 60 * 1000) return last.eventId;

  const habits = recordEvent(state.habits, {
    ts: Date.now(),
    domain: judgement.host,
    url: page.url,
    title: page.title,
    channel: page.channel,
    verdict: judgement.verdict,
    action: "judged",
    task: judgement.task,
    subject: judgement.subject,
  });
  const eventId = habits.events[habits.events.length - 1]?.id || "";
  recentEvents.set(key, { ts: Date.now(), eventId });
  if (recentEvents.size > 200) {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [mapKey, value] of recentEvents) {
      if (value.ts < cutoff) recentEvents.delete(mapKey);
    }
  }
  state.habits = habits.events.length > 450 ? pruneHabits(habits, { keepDays: 90 }) : habits;
  return eventId;
}

async function handleMessage(message, sender) {
  const type = message.type;

  if (type === "state:get") {
    const state = await readState();
    const today = dateKey();
    return {
      ok: true,
      settings: state.settings,
      session: state.session,
      summary: summarizeDay(state.habits, today),
      pendingReflection: await findPendingReflection(state),
      hasKey: await hasApiKey(),
      quota: await readQuota(),
      version: chrome.runtime.getManifest().version,
      isYouTubeTab:
        Boolean(sender?.tab?.url) && /^https?:\/\/(www\.)?youtube\.com\//.test(sender.tab.url),
    };
  }

  if (type === "page:hello") {
    const state = await readState();
    return { ok: true, session: state.session, settings: state.settings };
  }

  if (type === "session:start") {
    const state = await readState();
    const task = String(message.task || "").trim();
    if (task.length < 3) return { ok: false, error: "A session needs a task of at least three characters." };
    const session = createSession({
      task,
      subject: message.subject || state.settings.subject,
      deadline: message.deadline || "",
      minutes: message.minutes || state.settings.sessionMinutes,
      taskUrl: message.taskUrl || "",
    });
    state.session = session;
    state.habits = state.habits || createHabits();
    await writeState(state);
    const when = new Date(session.endsAt).getTime();
    if (when > Date.now()) chrome.alarms.create(ALARM_SESSION, { when });
    await updateBadge();
    return { ok: true, session };
  }

  if (type === "session:pause" || type === "session:resume") {
    const state = await readState();
    if (!state.session) return { ok: false, error: "No session is running." };
    state.session = type === "session:pause" ? pauseSession(state.session) : resumeSession(state.session);
    await writeState(state);
    if (type === "session:resume" && state.session.status === "active") {
      const when = new Date(state.session.endsAt).getTime();
      if (when > Date.now()) chrome.alarms.create(ALARM_SESSION, { when });
    } else {
      await chrome.alarms.clear(ALARM_SESSION);
    }
    await updateBadge();
    return { ok: true, session: state.session };
  }

  if (type === "session:end") {
    const state = await readState();
    if (!state.session) return { ok: false, error: "No session is running." };
    state.session = endSession(state.session);
    await writeState(state);
    await chrome.alarms.clear(ALARM_SESSION);
    await updateBadge();
    return { ok: true, session: state.session };
  }

  if (type === "session:back") {
    const state = await readState();
    return { ok: true, url: state.session?.taskUrl || "" };
  }

  if (type === "page:judge") {
    const state = await readState();
    const session = state.session;
    const active = session && session.status === "active";
    const judgement = judgePage(message.page || {}, {
      session: active ? session : null,
      settings: state.settings,
    });
    if (!active) {
      return { ok: true, judgement, session, settings: state.settings, nudge: false, block: { block: false } };
    }
    const eventId = await recordJudgedPage(state, judgement, message.page || {});
    await writeState(state);
    const block = softBlockDecision(message.page || {}, judgement, state.settings);
    if (block.block && eventId) {
      const latest = await readState();
      latest.habits = markEventAction(latest.habits, eventId, "blocked");
      await writeState(latest);
    }
    return {
      ok: true,
      judgement: { ...judgement, eventId },
      session,
      settings: state.settings,
      nudge: shouldNudge(judgement, state.settings),
      block,
    };
  }

  if (type === "habits:tick") {
    const state = await readState();
    if (!state.session || state.session.status !== "active") return { ok: false, error: "No active session." };
    const page = message.page || {};
    const seconds = Math.min(120, Math.max(5, Number(message.seconds) || 30));
    const now = new Date();
    state.habits = recordSlice(state.habits, {
      date: dateKey(now),
      hour: now.getHours(),
      seconds,
      domain: page.url ? safeHost(page.url) : "unknown",
      verdict: message.verdict,
    });
    if (state.habits.events.length > 450) state.habits = pruneHabits(state.habits, { keepDays: 90 });
    await writeState(state);
    return { ok: true };
  }

  if (type === "page:action") {
    const state = await readState();
    let habits = state.habits;
    if (message.eventId) habits = markEventAction(habits, message.eventId, message.action);
    state.habits = habits;
    await writeState(state);
    return { ok: true };
  }

  if (type === "feedback:add") {
    await addFeedback({
      kind: message.kind || "note",
      domain: message.page?.url ? safeHost(message.page.url) : "",
      verdict: message.verdict || "",
      task: message.task || "",
    });
    return { ok: true };
  }

  if (type === "reflection:get") {
    const state = await readState();
    const pending = await findPendingReflection(state);
    const date = pending?.date || dateKey(new Date(Date.now() - 86400000));
    const reflection = buildReflection(state.habits, {
      date,
      task: state.session?.task,
      now: new Date(),
    });
    return { ok: true, reflection, saved: state.reflections[date] || null };
  }

  if (type === "reflection:save") {
    const state = await readState();
    const date = String(message.date || dateKey(new Date(Date.now() - 86400000)));
    const reflection = buildReflection(state.habits, { date, task: state.session?.task });
    const evaluation = evaluateReflection(reflection, message.answers || {});
    if (!evaluation.answered) return { ok: false, error: "Answer at least one question before saving." };
    const saved = await saveReflection(date, {
      date,
      answers: message.answers || {},
      evaluation,
      flaggedCount: reflection.flaggedCount,
    });
    await updateBadge();
    return { ok: true, saved };
  }

  if (type === "settings:get") {
    const state = await readState();
    return { ok: true, settings: state.settings };
  }

  if (type === "settings:set") {
    const state = await readState();
    state.settings = normalizeSettings({ ...state.settings, ...(message.settings || {}) });
    await writeState(state);
    await ensureAlarms(state.settings);
    return { ok: true, settings: state.settings };
  }

  if (type === "key:set") {
    const saved = await setApiKey(message.key);
    return { ok: true, saved };
  }

  if (type === "key:clear") {
    await clearApiKey();
    return { ok: true };
  }

  if (type === "key:has") {
    return { ok: true, hasKey: await hasApiKey() };
  }

  if (type === "key:test") {
    const key = await getApiKey();
    if (!key) return { ok: false, error: "No key is saved yet." };
    const result = await testKey(key);
    if (!result.ok) return result;
    const quota = await addQuota(result.cost || 1);
    return { ok: true, message: result.message, quota };
  }

  if (type === "focus:search") {
    const state = await readState();
    const key = await getApiKey();
    if (!key) return { ok: false, needsKey: true, error: "Add a YouTube API key to search." };
    const query = String(message.query || "").trim();
    if (query.length < 2) return { ok: false, error: "Type at least two characters." };
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      return { ok: true, videos: cached.videos, cached: true, quota: await readQuota() };
    }
    const search = await searchVideos({ query, key });
    if (!search.ok) return search;
    const detailed = await attachVideoDetails({ videos: search.videos, key });
    const quota = await addQuota(SEARCH_COST);
    searchCache.set(query, { at: Date.now(), videos: detailed.videos });
    if (searchCache.size > 40) searchCache.delete(searchCache.keys().next().value);
    return {
      ok: true,
      videos: detailed.videos,
      warning: detailed.warning || "",
      quota,
      cost: SEARCH_COST,
    };
  }

  if (type === "focus:channel") {
    const state = await readState();
    const handle = String(message.handle || "").trim();
    if (!handle) return { ok: false, error: "No channel name supplied." };
    const pretty = handle.startsWith("@") ? handle : `@${handle.replace(/\s+/g, "")}`;
    const subject = state.settings.subject;
    const list = new Set(state.settings.channelsBySubject?.[subject] || []);
    list.add(pretty);
    const trusted = new Set(state.settings.trustedChannels || []);
    trusted.add(pretty);
    state.settings.channelsBySubject = { ...state.settings.channelsBySubject, [subject]: [...list] };
    state.settings.trustedChannels = [...trusted];
    await writeState(state);
    return { ok: true, handle: pretty };
  }

  if (type === "focus:open") {
    await chrome.tabs.create({ url: chrome.runtime.getURL("focus.html") });
    return { ok: true };
  }

  if (type === "data:export") {
    return { ok: true, data: await exportState() };
  }

  if (type === "data:clear") {
    await clearAll();
    searchCache.clear();
    recentEvents.clear();
    await updateBadge();
    return { ok: true };
  }

  return { ok: false, error: `Unknown message: ${type}` };
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
