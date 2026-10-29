/**
 * The habit log.
 *
 * Two questions drive this module: "where did the time go?" and "when does it
 * usually go there?". Storage keeps per-day, per-hour and per-domain slices so
 * the heatmap and the weak spot list can be built without replaying events.
 */

import { VERDICT } from "./relevance.js";
import { clamp, dateKey, formatDuration, percent, WEEKDAYS } from "./text.js";

export const HABITS_VERSION = 1;

export function createHabits() {
  return { version: HABITS_VERSION, days: {}, events: [], updatedAt: null };
}

function emptyDay() {
  return {
    hours: Array.from({ length: 24 }, () => ({ onTask: 0, offTask: 0 })),
    domains: {},
    flagged: 0,
    sessions: 0,
  };
}

function cloneHabits(habits) {
  return JSON.parse(JSON.stringify(habits || createHabits()));
}

function ensureDay(habits, date) {
  if (!habits.days[date]) habits.days[date] = emptyDay();
  const day = habits.days[date];
  if (!Array.isArray(day.hours) || day.hours.length !== 24) day.hours = emptyDay().hours;
  if (!day.domains) day.domains = {};
  return day;
}

export function dayKeyFromTimestamp(ts) {
  return dateKey(new Date(ts));
}

export function hourFromTimestamp(ts) {
  return new Date(ts).getHours();
}

/**
 * Add a measured slice of time.
 * @param {object} habits
 * @param {{date?: string, hour?: number, seconds: number, domain: string, verdict: string}} slice
 */
export function recordSlice(habits, slice = {}) {
  const next = cloneHabits(habits);
  const date = slice.date || dateKey(new Date());
  const hour = clamp(Number(slice.hour ?? new Date().getHours()), 0, 23);
  const seconds = clamp(Math.round(Number(slice.seconds) || 0), 0, 3600);
  if (!seconds) return next;
  const day = ensureDay(next, date);
  const bucket = slice.verdict === VERDICT.ON_TASK ? "onTask" : "offTask";
  day.hours[hour][bucket] += seconds;

  const domain = String(slice.domain || "unknown").replace(/^www\./, "").toLowerCase();
  if (!day.domains[domain]) {
    day.domains[domain] = { seconds: 0, onTask: 0, offTask: 0, hours: {} };
  }
  const entry = day.domains[domain];
  entry.seconds += seconds;
  entry[bucket] += seconds;
  entry.hours[hour] = (entry.hours[hour] || 0) + seconds;
  if (bucket === "offTask" && slice.verdict === VERDICT.ADJACENT) entry.adjacent = (entry.adjacent || 0) + seconds;
  if (bucket === "offTask" && slice.verdict === VERDICT.OFF_TASK) entry.drifting = (entry.drifting || 0) + seconds;
  next.updatedAt = new Date().toISOString();
  return next;
}

/** Keep a compact, de-duplicated trail of judged pages for the morning reflection. */
export function recordEvent(habits, event = {}, options = {}) {
  const next = cloneHabits(habits);
  const limit = options.limit ?? 400;
  const entry = {
    id: event.id || `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ts: event.ts || Date.now(),
    domain: String(event.domain || "").replace(/^www\./, "").toLowerCase(),
    url: event.url || "",
    title: String(event.title || "").slice(0, 180),
    channel: event.channel || "",
    verdict: event.verdict || VERDICT.OFF_TASK,
    action: event.action || "judged",
    task: event.task || "",
    subject: event.subject || "",
    seconds: Math.round(Number(event.seconds) || 0),
  };
  next.events.push(entry);
  const day = ensureDay(next, dateKey(new Date(entry.ts)));
  if (entry.verdict === VERDICT.OFF_TASK || entry.verdict === VERDICT.ADJACENT) day.flagged += 1;
  next.events = next.events.slice(-limit);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function eventsForDate(habits, date) {
  return (habits?.events || []).filter((event) => dateKey(new Date(event.ts)) === date);
}

export function flaggedEvents(habits, date) {
  return eventsForDate(habits, date).filter(
    (event) => event.verdict === VERDICT.OFF_TASK || event.verdict === VERDICT.ADJACENT
  );
}

export function markEventAction(habits, eventId, action) {
  const next = cloneHabits(habits);
  next.events = next.events.map((event) =>
    event.id === eventId ? { ...event, action, actionAt: Date.now() } : event
  );
  return next;
}

export function summarizeDay(habits, date = dateKey(new Date())) {
  const day = habits?.days?.[date];
  if (!day) {
    return {
      date,
      totalSeconds: 0,
      onTaskSeconds: 0,
      offTaskSeconds: 0,
      focusPercent: 0,
      flagged: 0,
      topDomains: [],
      focusLabel: "No time recorded",
    };
  }
  let onTaskSeconds = 0;
  let offTaskSeconds = 0;
  for (const hour of day.hours) {
    onTaskSeconds += hour.onTask;
    offTaskSeconds += hour.offTask;
  }
  const totalSeconds = onTaskSeconds + offTaskSeconds;
  const topDomains = Object.entries(day.domains)
    .map(([domain, entry]) => ({
      domain,
      seconds: entry.seconds,
      onTask: entry.onTask || 0,
      offTask: entry.offTask || 0,
      share: percent(entry.seconds, totalSeconds),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5);
  return {
    date,
    totalSeconds,
    onTaskSeconds,
    offTaskSeconds,
    focusPercent: percent(onTaskSeconds, totalSeconds),
    flagged: day.flagged || 0,
    topDomains,
    focusLabel: totalSeconds ? `${formatDuration(totalSeconds)} recorded` : "No time recorded",
  };
}

/** Monday-first weekday index, 0 = Monday ... 6 = Sunday. */
export function mondayIndex(date) {
  return (new Date(date).getDay() + 6) % 7;
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LONG = WEEKDAYS.slice(1).concat(WEEKDAYS[0]);

function shiftDate(date, deltaDays) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

/**
 * Aggregate the last `weeks` weeks into a Monday-first, hour-by-hour grid.
 * Cells are drift minutes: the time that did not belong to the task.
 */
export function buildHeatmap(habits, options = {}) {
  const weeks = clamp(Number(options.weeks) || 4, 1, 12);
  const endDate = options.endDate ? new Date(options.endDate) : new Date();
  const rows = Array.from({ length: 7 }, (_, index) => ({
    weekday: index,
    label: WEEKDAY_SHORT[index],
    longLabel: WEEKDAY_LONG[index],
    hours: Array.from({ length: 24 }, () => ({ drift: 0, focus: 0, days: 0 })),
    drift: 0,
    focus: 0,
  }));

  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const d = shiftDate(endDate, -offset);
    const key = dateKey(d);
    const day = habits?.days?.[key];
    if (!day) continue;
    const row = rows[mondayIndex(d)];
    day.hours.forEach((bucket, hour) => {
      if (!bucket.offTask && !bucket.onTask) return;
      row.hours[hour].drift += bucket.offTask;
      row.hours[hour].focus += bucket.onTask;
      row.hours[hour].days += 1;
      row.drift += bucket.offTask;
      row.focus += bucket.onTask;
    });
  }

  let max = 0;
  let maxFocus = 0;
  for (const row of rows) {
    for (const cell of row.hours) {
      cell.driftMinutes = Math.round(cell.drift / 60);
      cell.focusMinutes = Math.round(cell.focus / 60);
      if (cell.driftMinutes > max) max = cell.driftMinutes;
      if (cell.focusMinutes > maxFocus) maxFocus = cell.focusMinutes;
    }
  }
  return { weeks, rows, max, maxFocus, generatedAt: new Date().toISOString() };
}

/** Rank repeated day/hour windows by drift. */
export function rankWeakSpots(habits, options = {}) {
  const weeks = clamp(Number(options.weeks) || 4, 1, 12);
  const limit = options.limit ?? 3;
  const endDate = options.endDate ? new Date(options.endDate) : new Date();
  const cells = new Map();

  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const d = shiftDate(endDate, -offset);
    const key = dateKey(d);
    const day = habits?.days?.[key];
    if (!day) continue;
    const weekday = mondayIndex(d);
    day.hours.forEach((bucket, hour) => {
      if (!bucket.offTask) return;
      const id = `${weekday}-${hour}`;
      if (!cells.has(id)) {
        cells.set(id, { weekday, hour, drift: 0, focus: 0, occurrences: 0, domains: {} });
      }
      const cell = cells.get(id);
      cell.drift += bucket.offTask;
      cell.focus += bucket.onTask;
      cell.occurrences += 1;
    });
    for (const [domain, entry] of Object.entries(day.domains || {})) {
      if (!entry.drifting && !entry.adjacent) continue;
      const byHour = entry.hours || {};
      for (const [hour, seconds] of Object.entries(byHour)) {
        const id = `${weekday}-${hour}`;
        const cell = cells.get(id);
        if (!cell) continue;
        const driftShare = (entry.offTask / Math.max(1, entry.seconds)) * seconds;
        cell.domains[domain] = (cell.domains[domain] || 0) + driftShare;
      }
    }
  }

  const ranked = [...cells.values()]
    .filter((cell) => cell.drift >= 60)
    .sort((a, b) => b.drift - a.drift)
    .slice(0, limit)
    .map((cell) => {
      const domains = Object.entries(cell.domains).sort((a, b) => b[1] - a[1]);
      return {
        weekday: cell.weekday,
        weekdayLabel: WEEKDAY_LONG[cell.weekday],
        hour: cell.hour,
        hourLabel: `${String(cell.hour).padStart(2, "0")}:00`,
        driftMinutes: Math.round(cell.drift / 60),
        focusMinutes: Math.round(cell.focus / 60),
        occurrences: cell.occurrences,
        topDomain: domains[0]?.[0] || null,
        driftLabel: formatDuration(cell.drift),
      };
    });
  return ranked;
}

/** How much of today's measured time belonged to the task? */
export function focusScore(habits, date = dateKey(new Date())) {
  return summarizeDay(habits, date).focusPercent;
}

export function topDriftDomain(habits, date = dateKey(new Date())) {
  const summary = summarizeDay(habits, date);
  const ranked = summary.topDomains
    .filter((entry) => entry.offTask > 0)
    .sort((a, b) => b.offTask - a.offTask);
  return ranked[0]?.domain || null;
}

/** Consecutive days (ending today or yesterday) with at least `goalMinutes` of on-task time. */
export function focusStreak(habits, options = {}) {
  const goalMinutes = options.goalMinutes ?? 25;
  const from = options.today ? new Date(options.today) : new Date();
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const summary = summarizeDay(habits, dateKey(shiftDate(from, -offset)));
    if (summary.onTaskSeconds >= goalMinutes * 60) streak += 1;
    else if (offset === 0) continue;
    else break;
  }
  return streak;
}

export function weekSummary(habits, options = {}) {
  const days = options.days ?? 7;
  const endDate = options.endDate ? new Date(options.endDate) : new Date();
  let onTaskSeconds = 0;
  let offTaskSeconds = 0;
  const daily = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = shiftDate(endDate, -offset);
    const summary = summarizeDay(habits, dateKey(d));
    onTaskSeconds += summary.onTaskSeconds;
    offTaskSeconds += summary.offTaskSeconds;
    daily.push({ dateSummary: summary, weekday: d.getDay() });
  }
  const total = onTaskSeconds + offTaskSeconds;
  return {
    days,
    onTaskSeconds,
    offTaskSeconds,
    totalSeconds: total,
    focusPercent: percent(onTaskSeconds, total),
    averageOnTaskSeconds: Math.round(onTaskSeconds / days),
    daily,
  };
}

/** Drop days older than `keepDays` so storage stays small forever. */
export function pruneHabits(habits, options = {}) {
  const keepDays = options.keepDays ?? 90;
  const next = cloneHabits(habits);
  const cutoff = dateKey(shiftDate(new Date(), -keepDays));
  for (const key of Object.keys(next.days)) {
    if (key < cutoff) delete next.days[key];
  }
  const cutoffTs = new Date(`${cutoff}T00:00:00`).getTime();
  next.events = next.events.filter((event) => event.ts >= cutoffTs);
  return next;
}

/** Merge stored habits defensively (older or partial objects). */
export function normalizeHabits(raw) {
  if (!raw || typeof raw !== "object") return createHabits();
  const habits = createHabits();
  habits.days = raw.days && typeof raw.days === "object" ? raw.days : {};
  habits.events = Array.isArray(raw.events) ? raw.events : [];
  habits.updatedAt = raw.updatedAt || null;
  return habits;
}
