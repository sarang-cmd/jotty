import test from "node:test";
import assert from "node:assert/strict";

import {
  createHabits,
  recordSlice,
  recordEvent,
  summarizeDay,
  buildHeatmap,
  rankWeakSpots,
  focusScore,
  weekSummary,
  pruneHabits,
  focusStreak,
} from "../src/lib/habits.js";
import { dateKey } from "../src/lib/text.js";
import { VERDICT } from "../src/lib/relevance.js";

const date = "2026-10-27"; // Tuesday

function dayWith(entries) {
  let habits = createHabits();
  for (const entry of entries) {
    habits = recordSlice(habits, { date, ...entry });
  }
  return habits;
}

test("records a slice into the right hour bucket and domain", () => {
  const habits = dayWith([
    { hour: 9, seconds: 1500, domain: "docs.google.com", verdict: VERDICT.ON_TASK },
    { hour: 16, seconds: 420, domain: "youtube.com", verdict: VERDICT.OFF_TASK },
  ]);
  const summary = summarizeDay(habits, date);
  assert.equal(summary.totalSeconds, 1920);
  assert.equal(summary.onTaskSeconds, 1500);
  assert.equal(summary.offTaskSeconds, 420);
  assert.equal(summary.focusPercent, 78);
  assert.equal(summary.topDomains[0].domain, "docs.google.com");
});

test("an empty day summarizes to zero rather than undefined", () => {
  const summary = summarizeDay(createHabits(), "2026-01-01");
  assert.equal(summary.totalSeconds, 0);
  assert.equal(summary.focusPercent, 0);
  assert.equal(summary.focusLabel, "No time recorded");
});

test("events are recorded once and flagged for reflection", () => {
  const ts = new Date(`${date}T16:04:00`).getTime();
  let habits = recordEvent(createHabits(), {
    ts,
    domain: "www.youtube.com",
    title: "Teflon",
    verdict: VERDICT.ADJACENT,
    action: "nudged",
  });
  habits = recordEvent(habits, {
    ts: ts + 1000,
    domain: "instagram.com",
    title: "Feed",
    verdict: VERDICT.ON_TASK,
  });
  assert.equal(habits.events.length, 2);
  assert.equal(habits.events[0].domain, "youtube.com");
  assert.equal(habits.days[date].flagged, 1);
});

test("heatmap is Monday first and sums drift minutes", () => {
  const habits = dayWith([
    { hour: 16, seconds: 1800, domain: "youtube.com", verdict: VERDICT.OFF_TASK },
  ]);
  const heatmap = buildHeatmap(habits, { weeks: 1, endDate: new Date(`${date}T23:00:00`) });
  assert.equal(heatmap.rows.length, 7);
  assert.equal(heatmap.rows[0].label, "Mon");
  const tuesday = heatmap.rows[1];
  assert.equal(tuesday.label, "Tue");
  assert.equal(tuesday.hours[16].driftMinutes, 30);
  assert.equal(heatmap.max, 30);
});

test("weak spots rank the hour with the most drift", () => {
  const habits = dayWith([
    { hour: 16, seconds: 1800, domain: "youtube.com", verdict: VERDICT.OFF_TASK },
    { hour: 10, seconds: 300, domain: "instagram.com", verdict: VERDICT.OFF_TASK },
  ]);
  const spots = rankWeakSpots(habits, { weeks: 1, endDate: new Date(`${date}T23:00:00`) });
  assert.equal(spots.length, 2);
  assert.equal(spots[0].hour, 16);
  assert.equal(spots[0].weekdayLabel, "Tuesday");
  assert.equal(spots[0].driftMinutes, 30);
});

test("week summary covers seven days including today", () => {
  const habits = dayWith([
    { hour: 9, seconds: 600, domain: "docs.google.com", verdict: VERDICT.ON_TASK },
  ]);
  const summary = weekSummary(habits, { days: 7, endDate: new Date(`${date}T23:00:00`) });
  assert.equal(summary.days, 7);
  assert.equal(summary.onTaskSeconds, 600);
  assert.equal(summary.focusPercent, 100);
  assert.equal(summary.daily.length, 7);
});

test("focus score reflects on task share", () => {
  const habits = dayWith([
    { hour: 9, seconds: 900, domain: "docs.google.com", verdict: VERDICT.ON_TASK },
    { hour: 10, seconds: 100, domain: "x.com", verdict: VERDICT.OFF_TASK },
  ]);
  assert.equal(focusScore(habits, date), 90);
});

test("pruning drops old days and old events", () => {
  let habits = recordSlice(createHabits(), {
    date: "2020-01-01",
    hour: 9,
    seconds: 60,
    domain: "docs.google.com",
    verdict: VERDICT.ON_TASK,
  });
  habits = recordEvent(habits, {
    ts: new Date("2020-01-01T10:00:00").getTime(),
    domain: "youtube.com",
    verdict: VERDICT.OFF_TASK,
  });
  const pruned = pruneHabits(habits, { keepDays: 30 });
  assert.equal(pruned.days["2020-01-01"], undefined);
  assert.equal(pruned.events.length, 0);
});

test("streak counts consecutive days with enough on task time", () => {
  let habits = createHabits();
  for (const offset of [0, 1]) {
    const target = new Date();
    target.setDate(target.getDate() - offset);
    habits = recordSlice(habits, {
      date: dateKey(target),
      hour: 9,
      seconds: 1800,
      domain: "docs.google.com",
      verdict: VERDICT.ON_TASK,
    });
  }
  assert.equal(focusStreak(habits, { goalMinutes: 20 }), 2);
});
