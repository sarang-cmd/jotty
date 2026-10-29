/**
 * The morning reflection writer.
 *
 * It reads yesterday's judged pages, not yesterday's "screen time", and writes
 * three or four questions a coach could plausibly ask. Question choice is
 * seeded by the date and the event, so reloading the page does not reshuffle
 * the conversation.
 */

import { VERDICT } from "./relevance.js";
import { dateKey, formatClock, formatHourRange, hashString, pick, weekdayName } from "./text.js";
import { flaggedEvents, rankWeakSpots } from "./habits.js";

const DOMAIN_NAMES = {
  "youtube.com": "YouTube",
  "instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "x.com": "X",
  "twitter.com": "X",
  "reddit.com": "Reddit",
  "netflix.com": "Netflix",
  "twitch.tv": "Twitch",
  "discord.com": "Discord",
};

export function domainLabel(domain) {
  const clean = String(domain || "").replace(/^www\./, "");
  if (DOMAIN_NAMES[clean]) return DOMAIN_NAMES[clean];
  return clean || "that site";
}

function eventHour(event) {
  return new Date(event.ts).getHours();
}

function eventClock(event) {
  const d = new Date(event.ts);
  return formatClock(d.getHours(), d.getMinutes());
}

function shortTitle(event) {
  const title = String(event.title || "").replace(/\s+/g, " ").trim();
  if (!title) return domainLabel(event.domain);
  return title.length > 64 ? `${title.slice(0, 61).trim()}\u2026` : title;
}

const INTENT_OPTIONS = [
  { id: "planned", label: "I decided to take a break", detail: "The timing was mine." },
  { id: "drift", label: "I drifted there", detail: "I did not decide, I just ended up there." },
  { id: "needed", label: "I thought it would help with the task", detail: "It felt related at the time." },
];

const PULL_OPTIONS = [
  { id: "sidebar", label: "A recommended video", detail: "The next thing was already on screen." },
  { id: "notification", label: "A message or notification", detail: "Someone or something interrupted." },
  { id: "stuck", label: "I got stuck and left", detail: "The work stopped making sense." },
  { id: "habit", label: "It is where my hands go", detail: "No single reason, just a routine." },
];

const REPAIR_OPTIONS = [
  { id: "soft-block", label: "Put a delay in front of it" },
  { id: "shorter", label: "Make the session shorter, with a real break" },
  { id: "focus-player", label: "Search for the video inside Jotty" },
  { id: "environment", label: "Move the phone or close the tab" },
];

const HELPED_OPTIONS = [
  { id: "task-first", label: "I started with the task before opening anything else" },
  { id: "focus-player", label: "I used the Focus Player instead of YouTube search" },
  { id: "timer", label: "A shorter session with a fixed end" },
  { id: "quiet", label: "The room was quieter than usual" },
];

/** Build 3 or 4 questions from yesterday's flagged pages. */
export function buildReflection(habits, options = {}) {
  const yesterday = options.date || dateKey(new Date(Date.now() - 86400000));
  const events = flaggedEvents(habits, yesterday);
  const seed = hashString(`jotty:${yesterday}`);
  const weekday = weekdayName(new Date(`${yesterday}T12:00:00`).getDay());
  const task = options.task || events.find((event) => event.task)?.task || "your assignment";

  const questions = [];

  if (!events.length) {
    questions.push({
      id: "q-helpful",
      kind: "helpful",
      title: "What worked",
      prompt: `No drift was recorded on ${weekday}. What made that day easier?`,
      detail: "Naming it makes it repeatable. One sentence is plenty.",
      options: HELPED_OPTIONS,
      allowText: true,
    });
    return {
      date: yesterday,
      weekday,
      flaggedCount: 0,
      task,
      questions,
      intro: `On ${weekday} you stayed with what you opened. That is the whole point, so let's keep the useful part.`,
    };
  }

  const ranked = [...events].sort((a, b) => b.ts - a.ts);
  const primary = ranked.find((event) => event.verdict === VERDICT.OFF_TASK) || ranked[0];
  const adjacent = events.find((event) => event.verdict === VERDICT.ADJACENT);
  const primaryHour = eventHour(primary);

  questions.push({
    id: "q-intent",
    kind: "intent",
    title: "Intention",
    prompt: `At ${eventClock(primary)} yesterday you were on ${domainLabel(primary.domain)}, with \u201c${task}\u201d still open. Was that a break you chose?`,
    detail: `You were watching \u201c${shortTitle(primary)}\u201d.`,
    options: INTENT_OPTIONS,
    allowText: true,
    eventId: primary.id,
  });

  const pullPrompt = pick(
    [
      `What put ${domainLabel(primary.domain)} in front of you at ${eventClock(primary)}?`,
      `What was happening in the work right before you opened ${domainLabel(primary.domain)}?`,
      `What was the last thing you did on the assignment before ${domainLabel(primary.domain)}?`,
    ],
    seed
  );
  questions.push({
    id: "q-pull",
    kind: "pull",
    title: "The moment before",
    prompt: pullPrompt,
    detail: "The trigger matters more than the site. It is the part you can change.",
    options: PULL_OPTIONS,
    allowText: true,
    eventId: primary.id,
  });

  if (adjacent) {
    questions.push({
      id: "q-adjacent",
      kind: "adjacent",
      title: "The useful detour",
      prompt: `\u201c${shortTitle(adjacent)}\u201d was real subject material, and it still pulled you off \u201c${task}\u201d. When is a related video actually research?`,
      detail: "Adjacent material is the hardest thing to judge, for you and for Jotty.",
      options: [
        { id: "research", label: "I meant to research an adjacent idea" },
        { id: "escape", label: "It was the same escape with a smarter label" },
        { id: "unclear", label: "I genuinely did not notice" },
      ],
      allowText: true,
      eventId: adjacent.id,
    });
  }

  const weak = rankWeakSpots(habits, { weeks: 4, limit: 1, endDate: options.now })[0];
  const windowLabel = weak
    ? `${weak.weekdayLabel}s around ${formatHourRange(weak.hour)}`
    : `${formatHourRange(primaryHour)}`;

  questions.push({
    id: "q-repair",
    kind: "repair",
    title: "Next time",
    prompt: `${windowLabel} is where this keeps happening. What should be different next time?`,
    detail: "Pick one. Jotty will set it up before the window opens.",
    options: REPAIR_OPTIONS,
    allowText: true,
    weakSpot: weak || { weekday: new Date(`${yesterday}T12:00:00`).getDay(), hour: primaryHour },
  });

  return {
    date: yesterday,
    weekday,
    flaggedCount: events.length,
    task,
    questions,
    weakSpot: weak || null,
    intro: `${events.length} ${events.length === 1 ? "page" : "pages"} yesterday did not belong to \u201c${task}\u201d. Three questions, then a plan for next week.`,
  };
}

const DRIFT_OPTIONS = new Set(["drift", "sidebar", "notification", "stuck", "habit", "escape"]);
const PLANNED_OPTIONS = new Set(["planned", "research"]);
const NEEDED_OPTIONS = new Set(["needed"]);

/** Turn answers into a short read of the day and 1-3 concrete adjustments. */
export function evaluateReflection(reflection, answers = {}) {
  const values = Object.values(answers || {});
  let drift = 0;
  let planned = 0;
  let needed = 0;
  for (const answer of values) {
    const option = answer?.option;
    if (!option) continue;
    if (DRIFT_OPTIONS.has(option)) drift += 1;
    else if (PLANNED_OPTIONS.has(option)) planned += 1;
    else if (NEEDED_OPTIONS.has(option)) needed += 1;
  }

  const answered = values.filter((answer) => answer?.option || answer?.text).length;
  const intent = answers["q-intent"]?.option;
  let verdict = "mixed";
  if (!answered) verdict = "unanswered";
  else if (drift > planned + needed) verdict = "drift";
  else if (planned >= drift && planned > 0) verdict = "planned";
  else if (needed > drift) verdict = "needed";

  const insights = {
    drift:
      "You did not choose most of it. That is useful: the problem is the doorway, not your discipline.",
    planned:
      "Most of it was deliberate. The fix is timing and length, not guilt.",
    needed:
      "You went looking for help and found a feed. Jotty can send you to the video without the feed.",
    mixed:
      "Some of it was chosen, some of it happened to you. Keep the chosen part, remove the doorway.",
    unanswered: "Answer at least one question to get a plan for next week.",
  };

  const repair = answers["q-repair"]?.option;
  const weak = reflection?.weakSpot;
  const plan = [];

  if (repair === "soft-block" || verdict === "drift") {
    plan.push({
      id: "soft-block",
      title: weak
        ? `Soft block ${weak.weekdayLabel} ${formatHourRange(weak.hour)}`
        : "Soft block the next drift window",
      detail: weak
        ? `Jotty holds the site behind an 8-second delay at the window where your drift repeats.`
        : "Jotty holds the listed site behind a short delay during focus sessions.",
      action: "settings:soft-block",
    });
  }
  if (repair === "shorter") {
    plan.push({
      id: "shorter-session",
      title: "Sessions of 40 minutes with a 10 minute break",
      detail: "A session you can finish beats one you abandon.",
      action: "settings:session-length",
    });
  }
  if (repair === "focus-player" || verdict === "needed") {
    plan.push({
      id: "focus-player",
      title: "Search inside the Focus Player next time",
      detail: "Same subject videos, no sidebar and no next-up queue.",
      action: "open:focus",
    });
  }
  if (repair === "environment") {
    plan.push({
      id: "environment",
      title: "Move the phone out of reach before the session",
      detail: "Put it in another room for the length of one session.",
      action: "manual",
    });
  }
  if (!plan.length) {
    plan.push({
      id: "start-first",
      title: "Start with ten minutes of the task",
      detail: "Open the assignment before any video. Momentum first, help second.",
      action: "manual",
    });
  }

  return {
    answered,
    drift,
    planned,
    needed,
    verdict,
    insight: insights[verdict],
    plan: plan.slice(0, 3),
    completedAt: new Date().toISOString(),
  };
}

export function reflectionQuestionCount(habits, date) {
  return flaggedEvents(habits, date || dateKey(new Date(Date.now() - 86400000))).length;
}
