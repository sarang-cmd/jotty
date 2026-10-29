import test from "node:test";
import assert from "node:assert/strict";

import {
  createSession,
  pauseSession,
  resumeSession,
  endSession,
  remainingSeconds,
  elapsedSeconds,
  formatCountdown,
  deadlineLabel,
  sessionProgress,
  sanitizeTask,
  SESSION_STATUS,
} from "../src/lib/session.js";

const start = new Date("2026-10-27T16:00:00");

test("a session ends when the minutes say it does", () => {
  const session = createSession({ task: "  Chapter 9   problems ", minutes: 50, now: start });
  assert.equal(session.task, "Chapter 9 problems");
  assert.equal(session.status, SESSION_STATUS.ACTIVE);
  assert.equal(session.endsAt, "2026-10-27T16:50:00.000Z");
  assert.equal(remainingSeconds(session, new Date("2026-10-27T16:25:00")), 1500);
});

test("pausing stops the clock and resuming gives the time back", () => {
  let session = createSession({ task: "Lab report", minutes: 50, now: start });
  session = pauseSession(session, new Date("2026-10-27T16:10:00"));
  assert.equal(session.status, SESSION_STATUS.PAUSED);
  const beforeResume = remainingSeconds(session, new Date("2026-10-27T16:20:00"));
  assert.equal(beforeResume, 2400);
  session = resumeSession(session, new Date("2026-10-27T16:20:00"));
  assert.equal(session.pausedMs, 600000);
  assert.equal(session.endsAt, "2026-10-27T17:00:00.000Z");
  assert.equal(remainingSeconds(session, new Date("2026-10-27T16:20:00")), 2400);
});

test("elapsed time subtracts paused time", () => {
  let session = createSession({ task: "Reading", minutes: 30, now: start });
  session = pauseSession(session, new Date("2026-10-27T16:05:00"));
  session = resumeSession(session, new Date("2026-10-27T16:15:00"));
  assert.equal(elapsedSeconds(session, new Date("2026-10-27T16:25:00")), 900);
});

test("ending a session is final", () => {
  let session = createSession({ task: "Reading", minutes: 30, now: start });
  session = endSession(session, new Date("2026-10-27T16:20:00"));
  assert.equal(session.status, SESSION_STATUS.ENDED);
  assert.equal(remainingSeconds(session, new Date("2026-10-27T16:21:00")), 0);
  assert.equal(elapsedSeconds(session, new Date("2026-10-27T16:21:00")), 1200);
});

test("countdown and progress agree", () => {
  const session = createSession({ task: "Reading", minutes: 40, now: start });
  assert.equal(formatCountdown(remainingSeconds(session, new Date("2026-10-27T16:10:00"))), "30:00");
  assert.equal(sessionProgress(session, new Date("2026-10-27T16:10:00")), 25);
});

test("deadline labels are human and stable", () => {
  const now = new Date("2026-10-27T16:00:00");
  assert.equal(deadlineLabel("2026-10-28", now), "Due tomorrow");
  assert.equal(deadlineLabel("2026-10-27", now), "Due today");
  assert.equal(deadlineLabel("2026-10-26", now), "Past due");
  assert.equal(deadlineLabel("", now), "");
});

test("task text is trimmed and capped", () => {
  assert.equal(sanitizeTask("  gas\n stoichiometry  "), "gas stoichiometry");
  assert.equal(sanitizeTask("x".repeat(300)).length, 160);
});
