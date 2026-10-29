import test from "node:test";
import assert from "node:assert/strict";

import {
  judgePage,
  softBlockDecision,
  shouldNudge,
  hostFromUrl,
  VERDICT,
} from "../src/lib/relevance.js";

const session = {
  task: "Gas stoichiometry, chapter 9 problems",
  subject: "Chemistry",
  status: "active",
  taskUrl: "https://docs.google.com/document/d/ch9",
};
const settings = {
  blocklist: ["youtube.com", "instagram.com"],
  allowlist: ["khanacademy.org"],
  trustedChannels: ["@tylerdewitt"],
  nudges: true,
};

test("recognises a video about the exact assignment", () => {
  const result = judgePage(
    {
      title: "Gas Stoichiometry: Equations Part 1",
      url: "https://www.youtube.com/watch?v=abc123",
      channel: "Tyler DeWitt",
    },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.ON_TASK);
  assert.ok(result.confidence > 0.8);
  assert.equal(result.surface, "youtube");
});

test("calls real chemistry adjacent when the topic is different", () => {
  const result = judgePage(
    {
      title: "The chemistry of Teflon and nonstick pans",
      url: "https://www.youtube.com/watch?v=teflon",
      channel: "Tyler DeWitt",
    },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.ADJACENT);
  assert.match(result.reasons[0], /polymers rather than gas laws/);
  assert.equal(result.suggestedAction, "nudge");
});

test("an unrelated vlog is off task", () => {
  const result = judgePage(
    { title: "24 hours in Tokyo", url: "https://www.youtube.com/watch?v=zzz", channel: "SomeVlog" },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.OFF_TASK);
  assert.ok(result.confidence >= 0.8);
});

test("no session means no judgement", () => {
  const result = judgePage(
    { title: "Gas Stoichiometry", url: "https://www.youtube.com/watch?v=abc" },
    { session: null, settings }
  );
  assert.equal(result.verdict, VERDICT.NEUTRAL);
  assert.equal(result.suggestedAction, "none");
  assert.equal(shouldNudge(result, settings), false);
});

test("an allowlisted domain is trusted even without a title match", () => {
  const result = judgePage(
    { title: "Science", url: "https://www.khanacademy.org/science/chemistry" },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.ON_TASK);
  assert.equal(result.surface, "allowlisted");
});

test("a non YouTube reference page on the task is on task", () => {
  const result = judgePage(
    { title: "Gas stoichiometry (practice)", url: "https://www.chem.libretexts.org/books/gas-stoichiometry" },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.ON_TASK);
});

test("an unrelated document is off task with lower confidence", () => {
  const result = judgePage(
    { title: "Holiday packing list", url: "https://example.com/packing" },
    { session, settings }
  );
  assert.equal(result.verdict, VERDICT.OFF_TASK);
  assert.ok(result.confidence < 0.8);
});

test("strict mode blocks the listed site before judging relevance", () => {
  const result = softBlockDecision(
    { url: "https://www.youtube.com/watch?v=x" },
    { verdict: VERDICT.ON_TASK, confidence: 0.9 },
    { ...settings, strictMode: true }
  );
  assert.equal(result.block, true);
  assert.equal(result.strict, true);
  assert.equal(result.delaySeconds, 8);
});

test("normal mode lets on-task pages through even when listed", () => {
  const result = softBlockDecision(
    { url: "https://www.youtube.com/watch?v=x" },
    { verdict: VERDICT.ON_TASK, confidence: 0.9 },
    { ...settings, strictMode: false, blockUnrelated: true }
  );
  assert.equal(result.block, false);
});

test("normal mode blocks a listed site when the page is off task", () => {
  const result = softBlockDecision(
    { url: "https://www.youtube.com/watch?v=x" },
    { verdict: VERDICT.OFF_TASK, confidence: 0.9 },
    { ...settings, strictMode: false }
  );
  assert.equal(result.block, true);
  assert.equal(result.reason, "listed-and-off-task");
});

test("nudges stay off for low confidence off task calls", () => {
  assert.equal(
    shouldNudge({ verdict: VERDICT.OFF_TASK, confidence: 0.5 }, settings),
    false
  );
  assert.equal(
    shouldNudge({ verdict: VERDICT.ADJACENT, confidence: 0.6 }, settings),
    true
  );
});

test("host parsing tolerates malformed urls", () => {
  assert.equal(hostFromUrl("https://www.YouTube.com/watch?v=1"), "youtube.com");
  assert.equal(hostFromUrl("not a url"), "");
});
