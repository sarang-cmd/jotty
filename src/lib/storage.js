/**
 * One storage contract for the whole extension.
 *
 * Everything lives in chrome.storage.local under a single versioned object so
 * an export is a single file and a wipe is a single remove. The YouTube API key
 * lives under its own key, is never returned to a page context, and is never
 * included in an export.
 */

import { CURATED_CHANNELS, SUBJECT_OPTIONS } from "../config/subjects.js";
import { createHabits, normalizeHabits } from "./habits.js";

export const STORAGE_KEY = "jotty.v1";
export const API_KEY_STORAGE = "jotty.youtube.key.v1";
export const QUOTA_STORAGE = "jotty.quota.v1";
export const STATE_VERSION = 1;

export const DEFAULT_BLOCKLIST = [
  "youtube.com",
  "instagram.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "reddit.com",
  "netflix.com",
  "twitch.tv",
  "discord.com",
  "primevideo.com",
  "disneyplus.com",
];

export const DEFAULT_ALLOWLIST = [
  "khanacademy.org",
  "chem.libretexts.org",
  "openstax.org",
  "docs.google.com",
  "notion.so",
  "overleaf.com",
];

const defaultChannels = () => {
  const map = {};
  for (const [subject, channels] of Object.entries(CURATED_CHANNELS)) {
    map[subject] = channels.map((channel) => channel.handle);
  }
  return map;
};

export function defaultSettings() {
  return {
    enabled: true,
    nudges: true,
    nudgeSnoozeMinutes: 10,
    blockUnrelated: false,
    strictMode: false,
    blockDelaySeconds: 8,
    blocklist: [...DEFAULT_BLOCKLIST],
    allowlist: [...DEFAULT_ALLOWLIST],
    trustedChannels: [...new Set(Object.values(CURATED_CHANNELS).flat().map((c) => c.handle.toLowerCase()))],
    channelsBySubject: defaultChannels(),
    subject: "Chemistry",
    sessionMinutes: 50,
    breakMinutes: 10,
    dailyGoalMinutes: 60,
    reflectionEnabled: true,
    reflectionHour: 8,
    notifications: true,
    hideShorts: true,
    reduceMotion: false,
  };
}

export function defaultState() {
  return {
    version: STATE_VERSION,
    settings: defaultSettings(),
    session: null,
    habits: createHabits(),
    reflections: {},
    feedback: [],
    meta: { installedAt: new Date().toISOString(), lastReflectionPrompt: null },
  };
}

function sanitizeDomainList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of list) {
    const clean = String(entry || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out.slice(0, 200);
}

function sanitizeHandleList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of list) {
    const clean = String(entry || "").trim().replace(/\s+/g, "");
    if (!clean) continue;
    const handle = clean.startsWith("@") ? clean : `@${clean}`;
    const key = handle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(handle);
  }
  return out.slice(0, 60);
}

export function normalizeSettings(raw = {}) {
  const defaults = defaultSettings();
  const settings = { ...defaults, ...(raw && typeof raw === "object" ? raw : {}) };
  settings.enabled = Boolean(settings.enabled);
  settings.nudges = Boolean(settings.nudges);
  settings.blockUnrelated = Boolean(settings.blockUnrelated);
  settings.strictMode = Boolean(settings.strictMode);
  settings.reflectionEnabled = Boolean(settings.reflectionEnabled);
  settings.notifications = Boolean(settings.notifications);
  settings.hideShorts = Boolean(settings.hideShorts);
  settings.reduceMotion = Boolean(settings.reduceMotion);
  settings.blockDelaySeconds = Math.min(30, Math.max(3, Number(settings.blockDelaySeconds) || 8));
  settings.sessionMinutes = Math.min(240, Math.max(10, Number(settings.sessionMinutes) || 50));
  settings.breakMinutes = Math.min(60, Math.max(3, Number(settings.breakMinutes) || 10));
  settings.dailyGoalMinutes = Math.min(600, Math.max(10, Number(settings.dailyGoalMinutes) || 60));
  settings.reflectionHour = Math.min(23, Math.max(0, Number(settings.reflectionHour) || 8));
  settings.nudgeSnoozeMinutes = Math.min(60, Math.max(1, Number(settings.nudgeSnoozeMinutes) || 10));
  settings.blocklist = sanitizeDomainList(settings.blocklist);
  settings.allowlist = sanitizeDomainList(settings.allowlist);
  settings.trustedChannels = sanitizeHandleList(settings.trustedChannels);
  const channels = {};
  for (const subject of SUBJECT_OPTIONS) {
    const list = settings.channelsBySubject?.[subject];
    channels[subject] = sanitizeHandleList(
      Array.isArray(list) ? list : defaults.channelsBySubject[subject] || []
    );
  }
  settings.channelsBySubject = channels;
  if (!SUBJECT_OPTIONS.includes(settings.subject)) settings.subject = defaults.subject;
  return settings;
}

export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    version: STATE_VERSION,
    settings: normalizeSettings(raw.settings),
    habits: normalizeHabits(raw.habits),
    reflections: raw.reflections && typeof raw.reflections === "object" ? raw.reflections : {},
    feedback: Array.isArray(raw.feedback) ? raw.feedback.slice(-200) : [],
    meta: { ...base.meta, ...(raw.meta || {}) },
  };
}

function storageArea() {
  const area = globalThis.chrome?.storage?.local;
  if (!area) throw new Error("chrome.storage.local is not available");
  return area;
}

export async function readState() {
  const area = storageArea();
  const result = await area.get(STORAGE_KEY);
  return normalizeState(result?.[STORAGE_KEY]);
}

export async function writeState(state) {
  const area = storageArea();
  const normalized = normalizeState(state);
  await area.set({ [STORAGE_KEY]: normalized });
  return normalized;
}

export async function updateState(updater) {
  const current = await readState();
  const next = await updater(current);
  return writeState(next || current);
}

export async function readSettings() {
  return (await readState()).settings;
}

export async function saveSettings(patch) {
  const state = await readState();
  state.settings = normalizeSettings({ ...state.settings, ...patch });
  await writeState(state);
  return state.settings;
}

export async function readHabits() {
  return (await readState()).habits;
}

export async function saveHabits(habits) {
  const state = await readState();
  state.habits = normalizeHabits(habits);
  await writeState(state);
  return state.habits;
}

export async function readSession() {
  return (await readState()).session;
}

export async function saveSession(session) {
  const state = await readState();
  state.session = session;
  await writeState(state);
  return state.session;
}

export async function saveReflection(date, payload) {
  const state = await readState();
  state.reflections[date] = { ...payload, savedAt: new Date().toISOString() };
  await writeState(state);
  return state.reflections[date];
}

export async function readReflection(date) {
  return (await readState()).reflections[date] || null;
}

export async function addFeedback(entry) {
  const state = await readState();
  state.feedback.push({ ...entry, ts: Date.now() });
  state.feedback = state.feedback.slice(-200);
  await writeState(state);
  return state.feedback.length;
}

/** Export everything except the API key. */
export async function exportState() {
  const state = await readState();
  return { exportedAt: new Date().toISOString(), app: "Jotty", ...state };
}

export async function clearAll() {
  const area = storageArea();
  await area.remove([STORAGE_KEY, API_KEY_STORAGE, QUOTA_STORAGE]);
}

/** Guard: only the MV3 service worker may read the key back. */
export function assertServiceWorker() {
  if (globalThis.__JOTTY_SERVICE_WORKER__ !== true) {
    throw new Error("The YouTube API key is only readable inside the service worker.");
  }
}

export async function getApiKey() {
  assertServiceWorker();
  const area = storageArea();
  const result = await area.get(API_KEY_STORAGE);
  return String(result?.[API_KEY_STORAGE] || "").trim();
}

export async function hasApiKey() {
  const area = storageArea();
  const result = await area.get(API_KEY_STORAGE);
  return Boolean(String(result?.[API_KEY_STORAGE] || "").trim());
}

export async function setApiKey(key) {
  const area = storageArea();
  const clean = String(key || "").trim();
  if (!clean) {
    await area.remove(API_KEY_STORAGE);
    return false;
  }
  await area.set({ [API_KEY_STORAGE]: clean });
  return true;
}

export async function clearApiKey() {
  const area = storageArea();
  await area.remove(API_KEY_STORAGE);
}

/** Keep a small daily counter so the quota note in Settings is truthful. */
export async function readQuota() {
  const area = storageArea();
  const result = await area.get(QUOTA_STORAGE);
  const today = new Date().toISOString().slice(0, 10);
  const stored = result?.[QUOTA_STORAGE];
  if (!stored || stored.date !== today) return { date: today, units: 0 };
  return stored;
}

export async function addQuota(units) {
  const area = storageArea();
  const current = await readQuota();
  const next = { date: current.date, units: current.units + Math.max(0, Number(units) || 0) };
  await area.set({ [QUOTA_STORAGE]: next });
  return next;
}

export function maskKey(key) {
  const clean = String(key || "");
  if (clean.length < 8) return clean ? "Saved" : "Not set";
  return `${clean.slice(0, 4)}\u2026${clean.slice(-4)}`;
}
