import test from "node:test";
import assert from "node:assert/strict";

import { buildReflection, evaluateReflection, reflectionQuestionCount } from "../src/lib/reflection.js";
import { createHabits, recordEvent } from "../src/lib/habits.js";
import { VERDICT } from "../src/lib/relevance.js";

const YESTERDAY = "2026-10-27";

function habitsWithDrift() {
  const base = new Date(`${YESTERDAY}T00:00:00`).getTime();
  let habits = createHabits();
  habits = recordEvent(habits, {
    ts: base + 16 * 3600000 + 4 * 60000,
    domain: "youtube.com",
    title: "The chemistry of Teflon and nonstick pans",
    verdict: VERDICT.ADJACENT,
    action: "nudged",
    task: "gas stoichiometry",
  });
  habits = recordEvent(habits, {
    ts: base + 16 * 3600000 + 12 * 60000,
    domain: "youtube.com",
    title: "24 hours in Tokyo",
    verdict: VERDICT.OFF_TASK,
    action: "nudged",
    task: "gas stoichiometry",
  });
  return habits;
}

test("writes a coach style question from the real timestamp", () => {
  const reflection = buildReflection(habitsWithDrift(), { date: YESTERDAY, task: "gas stoichiometry" });
  assert.equal(reflection.flaggedCount, 2);
  assert.equal(reflection.questions.length, 4);
  const intent = reflection.questions.find((q) => q.kind === "intent");
  assert.match(intent.prompt, /16:12/);
  assert.match(intent.prompt, /YouTube/);
  assert.ok(intent.options.length >= 2);
});

test("asks about the useful detour when adjacent material appears", () => {
  const reflection = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  const adjacent = reflection.questions.find((q) => q.kind === "adjacent");
  assert.ok(adjacent);
  assert.match(adjacent.prompt, /Teflon/);
});

test("question order is stable for the same date", () => {
  const a = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  const b = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  assert.deepEqual(
    a.questions.map((q) => q.prompt),
    b.questions.map((q) => q.prompt)
  );
});

test("a clean yesterday produces a single positive question", () => {
  const habits = recordEvent(createHabits(), {
    ts: new Date(`${YESTERDAY}T10:00:00`).getTime(),
    domain: "docs.google.com",
    title: "Chapter 9",
    verdict: VERDICT.ON_TASK,
  });
  const reflection = buildReflection(habits, { date: YESTERDAY });
  assert.equal(reflection.flaggedCount, 0);
  assert.equal(reflection.questions.length, 1);
  assert.equal(reflection.questions[0].kind, "helpful");
});

test("drift answers produce a soft block plan for the weak window", () => {
  const reflection = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  const evaluation = evaluateReflection(reflection, {
    "q-intent": { option: "drift" },
    "q-pull": { option: "sidebar" },
    "q-repair": { option: "soft-block" },
  });
  assert.equal(evaluation.verdict, "drift");
  assert.equal(evaluation.plan[0].id, "soft-block");
  assert.match(evaluation.insight, /doorway/);
});

test("planned breaks are not treated as failure", () => {
  const reflection = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  const evaluation = evaluateReflection(reflection, {
    "q-intent": { option: "planned" },
    "q-pull": { option: "habit" },
    "q-repair": { option: "shorter" },
  });
  assert.equal(evaluation.verdict, "planned");
  assert.match(evaluation.insight, /deliberate/);
  assert.ok(evaluation.plan.some((item) => item.id === "shorter-session"));
});

test("looking for help points at the focus player", () => {
  const reflection = buildReflection(habitsWithDrift(), { date: YESTERDAY });
  const evaluation = evaluateReflection(reflection, {
    "q-intent": { option: "needed" },
    "q-repair": { option: "focus-player" },
  });
  assert.equal(evaluation.verdict, "needed");
  assert.ok(evaluation.plan.some((item) => item.id === "focus-player"));
});

test("empty reflection has nothing to evaluate", () => {
  const reflection = buildReflection(createHabits(), { date: YESTERDAY });
  const evaluation = evaluateReflection(reflection, {});
  assert.equal(evaluation.answered, 0);
  assert.equal(evaluation.verdict, "unanswered");
});

test("counts flagged pages for the badge", () => {
  assert.equal(reflectionQuestionCount(habitsWithDrift(), YESTERDAY), 2);
});
