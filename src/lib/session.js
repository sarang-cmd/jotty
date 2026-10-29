/**
 * Focus session arithmetic. Pure, so the popup, the content script and the
 * tests all agree about what "12 minutes left" means.
 */

import { dateKey } from "./text.js";

export const SESSION_STATUS = { ACTIVE: "active", PAUSED: "paused", ENDED: "ended" };

export function sanitizeTask(task) {
  return String(task || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function createSession(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const minutes = Math.min(240, Math.max(5, Number(input.minutes) || 50));
  const session = {
    id: `fs_${now.getTime()}`,
    task: sanitizeTask(input.task),
    subject: String(input.subject || "Chemistry").slice(0, 40),
    deadline: input.deadline ? String(input.deadline).slice(0, 10) : "",
    taskUrl: String(input.taskUrl || "").slice(0, 2000),
    minutes,
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + minutes * 60000).toISOString(),
    status: SESSION_STATUS.ACTIVE,
    pausedAt: null,
    pausedMs: 0,
    dateKey: dateKey(now),
  };
  return session;
}

export function pauseSession(session, now = new Date()) {
  if (!session || session.status !== SESSION_STATUS.ACTIVE) return session;
  return { ...session, status: SESSION_STATUS.PAUSED, pausedAt: new Date(now).toISOString() };
}

export function resumeSession(session, now = new Date()) {
  if (!session || session.status !== SESSION_STATUS.PAUSED) return session;
  const pausedMs = session.pausedAt
    ? new Date(now).getTime() - new Date(session.pausedAt).getTime()
    : 0;
  return {
    ...session,
    status: SESSION_STATUS.ACTIVE,
    pausedAt: null,
    pausedMs: (session.pausedMs || 0) + Math.max(0, pausedMs),
    endsAt: new Date(new Date(session.endsAt).getTime() + Math.max(0, pausedMs)).toISOString(),
  };
}

export function endSession(session, now = new Date()) {
  if (!session) return null;
  const ended = { ...session, status: SESSION_STATUS.ENDED };
  if (session.status === SESSION_STATUS.PAUSED && session.pausedAt) {
    ended.pausedMs =
      (session.pausedMs || 0) + Math.max(0, new Date(now).getTime() - new Date(session.pausedAt).getTime());
    ended.pausedAt = null;
  }
  ended.endedAt = new Date(now).toISOString();
  return ended;
}

export function isActive(session) {
  return Boolean(session && session.status === SESSION_STATUS.ACTIVE);
}

export function remainingSeconds(session, now = new Date()) {
  if (!session || session.status === SESSION_STATUS.ENDED) return 0;
  const end = new Date(session.endsAt).getTime();
  const reference =
    session.status === SESSION_STATUS.PAUSED && session.pausedAt
      ? new Date(session.pausedAt).getTime()
      : new Date(now).getTime();
  return Math.max(0, Math.round((end - reference) / 1000));
}

export function elapsedSeconds(session, now = new Date()) {
  if (!session) return 0;
  const start = new Date(session.startedAt).getTime();
  let stop = new Date(now).getTime();
  if (session.status === SESSION_STATUS.ENDED) stop = new Date(session.endedAt || now).getTime();
  else if (session.status === SESSION_STATUS.PAUSED && session.pausedAt) stop = new Date(session.pausedAt).getTime();
  const paused = session.pausedMs || 0;
  return Math.max(0, Math.round((stop - start - paused) / 1000));
}

export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function deadlineLabel(deadline, now = new Date()) {
  if (!deadline) return "";
  const due = new Date(`${deadline}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const days = Math.round(diffMs / 86400000);
  if (Number.isNaN(days)) return "";
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${new Date(`${deadline}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export function sessionProgress(session, now = new Date()) {
  if (!session) return 0;
  const total = new Date(session.endsAt).getTime() - new Date(session.startedAt).getTime();
  if (total <= 0) return 100;
  const left = remainingSeconds(session, now) * 1000;
  return Math.min(100, Math.max(0, Math.round(((total - left) / total) * 100)));
}
