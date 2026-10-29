/**
 * An end-to-end pass through the product's logic: a Tuesday session, a few
 * judged pages, the habit slices they produce, Wednesday morning's questions,
 * and the plan that comes out of the answers. No browser required.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { judgePage, VERDICT, shouldNudge, softBlockDecision } from "../src/lib/relevance.js";
import { createSession, endSession } from "../src/lib/session.js";
import { createHabits, recordSlice, recordEvent, summarizeDay, rankWeakSpots } from "../src/lib/habits.js";
import { buildReflection, evaluateReflection } from "../src/lib/reflection.js";
import { dateKey } from "../src/lib/text.js";

const settings = {
  nudges: true,
  blocklist: ["youtube.com", "instagram.com"],
  allowlist: ["docs.google.com"],
  trustedChannels: ["@tylerdewitt"],
  strictMode: false,
  blockUnrelated: false,
  blockDelaySeconds: 8,
};

const pages = [
  {
    title: "Chapter 9 problem set",
    url: "https://docs.google.com/document/d/ch9",
    channel: "",
    seconds: 1500,
    at: "09:10",
  },
  {
    title: "Gas Stoichiometry: Equations Part 1",
    url: "https://www.youtube.com/watch?v=gas1",
    channel: "Tyler DeWitt",
    seconds: 420,
    at: "15:40",
  },
  {
    title: "The chemistry of Teflon and nonstick pans",
    url: "https://www.youtube.com/watch?v=teflon",
    channel: "Tyler DeWitt",
    seconds: 300,
    at: "16:04",
  },
  {
    title: "24 hours in Tokyo",
    url: "https://www.youtube.com/watch?v=tokyo",
    channel: "SomeVlog",
    seconds: 240,
    at: "16:31",
  },
];

test("a Tuesday becomes a reflection and a plan", () => {
  const session = createSession({
    task: "Gas stoichiometry, chapter 9 problems",
    subject: "Chemistry",
    minutes: 50,
    now: new Date("2026-10-27T15:30:00"),
  });

  let habits = createHabits();
  const judged = [];

  for (const page of pages) {
    const judgement = judgePage(page, { session, settings });
    judged.push({ page, judgement });
    const ts = new Date(`2026-10-27T${page.at}:00`).getTime();
    habits = recordSlice(habits, {
      date: "2026-10-27",
      hour: Number(page.at.slice(0, 2)),
      seconds: page.seconds,
      domain: new URL(page.url).hostname.replace(/^www\./, ""),
      verdict: judgement.verdict,
    });
    habits = recordEvent(habits, {
      ts,
      domain: new URL(page.url).hostname.replace(/^www\./, ""),
      url: page.url,
      title: page.title,
      channel: page.channel,
      verdict: judgement.verdict,
      action: shouldNudge(judgement, settings) ? "nudged" : "judged",
      task: session.task,
      subject: session.subject,
      seconds: page.seconds,
    });
  }

  assert.deepEqual(
    judged.map((entry) => entry.judgement.verdict),
    [VERDICT.ON_TASK, VERDICT.ON_TASK, VERDICT.ADJACENT, VERDICT.OFF_TASK]
  );

  const summary = summarizeDay(habits, "2026-10-27");
  assert.equal(summary.totalSeconds, 2460);
  assert.equal(summary.onTaskSeconds, 1920);
  assert.equal(summary.focusPercent, 78);

  const spots = rankWeakSpots(habits, {
    weeks: 1,
    endDate: new Date("2026-10-27T23:00:00"),
  });
  assert.equal(spots[0].hour, 16);
  assert.equal(spots[0].topDomain, "youtube.com");

  const reflection = buildReflection(habits, {
    date: "2026-10-27",
    task: session.task,
    now: new Date("2026-10-28T08:00:00"),
  });
  assert.equal(reflection.flaggedCount, 2);
  assert.ok(reflection.questions.length >= 3);

  const evaluation = evaluateReflection(reflection, {
    "q-intent": { option: "drift" },
    "q-pull": { option: "sidebar" },
    "q-adjacent": { option: "escape" },
    "q-repair": { option: "soft-block" },
  });
  assert.equal(evaluation.verdict, "drift");
  assert.equal(evaluation.plan[0].id, "soft-block");
  assert.match(evaluation.plan[0].title, /Tuesday/);
  assert.match(evaluation.plan[0].title, /16:00/);

  const ended = endSession(session, new Date("2026-10-27T16:50:00"));
  assert.equal(ended.status, "ended");
});

test("the soft block respects strict mode and the allowlist", () => {
  const session = createSession({ task: "Gas stoichiometry", subject: "Chemistry", now: new Date() });
  const youtube = { title: "Gas Stoichiometry", url: "https://www.youtube.com/watch?v=gas1", channel: "Tyler DeWitt" };
  const judgement = judgePage(youtube, { session, settings });

  assert.equal(
    softBlockDecision(youtube, judgement, { ...settings, strictMode: false }).block,
    false
  );
  assert.equal(
    softBlockDecision(youtube, judgement, { ...settings, strictMode: true }).block,
    true
  );

  const docs = { title: "Chapter 9", url: "https://docs.google.com/document/d/ch9" };
  assert.equal(
    softBlockDecision(docs, judgePage(docs, { session, settings }), { ...settings, strictMode: true }).block,
    false
  );
});

test("today is always a valid date key", () => {
  assert.match(dateKey(new Date("2026-10-27T23:59:00")), /^2026-10-27$/);
});
