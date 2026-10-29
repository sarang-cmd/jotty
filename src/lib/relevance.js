/**
 * The relevance judge.
 *
 * Input: what the browser knows about the page (title, URL, channel) and the
 * focus session the student set. Output: on-task, adjacent, off-task or
 * neutral, plus the evidence for that call in plain words.
 *
 * The judge never reads page content and never calls a server. It compares
 * words, domains and topic clusters. That is enough for the decision this
 * product makes: "does this belong to the assignment, or does it belong to the
 * subject?" The difference is the whole product.
 */

import {
  SUBJECTS,
  SUBJECT_WORDS,
  DISTRACTION_DOMAINS,
  REFERENCE_DOMAINS,
  matchDomain,
  detectSubject,
  detectCluster,
} from "../config/subjects.js";
import { keywords, normalizeText, taskPhrases } from "./text.js";

export const VERDICT = {
  ON_TASK: "on-task",
  ADJACENT: "adjacent",
  OFF_TASK: "off-task",
  NEUTRAL: "neutral",
};

export const VERDICT_LABEL = {
  "on-task": "On task",
  adjacent: "Related, off task",
  "off-task": "Off task",
  neutral: "No session",
};

const SUBJECT_LABELS = {
  chemistry: "chemistry",
  biology: "biology",
  physics: "physics",
  math: "math",
  cs: "computer science",
  history: "history",
  economics: "economics",
  literature: "literature",
};

const CLUSTER_LABELS = {
  gases: "gas laws",
  bonding: "bonding",
  reactions: "reactions",
  acids: "acids and bases",
  atomic: "atomic structure",
  organic: "organic chemistry",
  polymers: "polymers",
  lab: "lab work",
  cells: "cells",
  genetics: "genetics",
  physiology: "physiology",
  ecology: "ecology",
  evolution: "evolution",
  microbiology: "microbiology",
  mechanics: "mechanics",
  energy: "energy",
  electricity: "electricity",
  waves: "waves and optics",
  thermo: "thermodynamics",
  modern_physics: "modern physics",
  algebra: "algebra",
  calculus: "calculus",
  geometry: "geometry",
  statistics: "statistics",
  discrete: "discrete math",
  programming: "programming",
  algorithms: "algorithms",
  systems: "systems",
  networks: "networks",
  data: "data and databases",
  ai: "machine learning",
  ancient: "ancient history",
  earlymodern: "early modern history",
  modern: "modern history",
  revolutions: "revolutions",
  historiography: "historiography",
  micro: "microeconomics",
  macro: "macroeconomics",
  trade: "trade",
  finance: "finance",
  poetry: "poetry",
  novel: "the novel",
  drama: "drama",
  analysis: "close reading",
};

export function subjectIdFromLabel(label) {
  const clean = String(label || "").trim().toLowerCase();
  if (!clean) return null;
  for (const [id, words] of Object.entries(SUBJECT_WORDS)) {
    if (id === clean) return id;
    if (words.includes(clean)) return id;
  }
  if (clean === "computer science") return "cs";
  return null;
}

export function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function pathWords(url) {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname)
      .replace(/[-_/]+/g, " ")
      .replace(/\.[a-z]{2,5}$/i, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function countPhrase(haystack, phrase) {
  if (!phrase) return 0;
  const needle = ` ${normalizeText(phrase)} `;
  if (!needle.trim()) return 0;
  return haystack.includes(needle) ? 1 : 0;
}

function clusterLabel(subjectId, clusterId) {
  const subject = SUBJECTS[subjectId];
  if (!subject || !clusterId) return null;
  return CLUSTER_LABELS[clusterId] || clusterId;
}

function surfaceFor(host, settings) {
  if (!host) return "document";
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
  if (matchDomain(host, settings.allowlist || [])) return "allowlisted";
  if (matchDomain(host, DISTRACTION_DOMAINS)) return "social";
  if (matchDomain(host, REFERENCE_DOMAINS)) return "reference";
  return "document";
}

function channelTrust(channel, settings) {
  const list = (settings.trustedChannels || []).map((entry) =>
    String(entry || "").toLowerCase().replace(/^@/, "").trim()
  ).filter(Boolean);
  if (!channel || !list.length) return false;
  const clean = String(channel).toLowerCase().replace(/^@/, "").trim();
  return list.some((entry) => clean === entry || clean.includes(entry));
}

/**
 * @param {{title?: string, url?: string, channel?: string, description?: string}} page
 * @param {{session?: object, settings?: object, now?: Date}} context
 */
export function judgePage(page = {}, context = {}) {
  const settings = context.settings || {};
  const session = context.session || {};
  const host = hostFromUrl(page.url || "");
  const title = String(page.title || "").trim();
  const channel = String(page.channel || "").trim();
  const description = String(page.description || "").slice(0, 600);
  const surface = surfaceFor(host, settings);

  const base = {
    host,
    surface,
    title,
    channel,
    verdict: VERDICT.NEUTRAL,
    confidence: 0,
    score: 0,
    reasons: [],
    signals: [],
    task: session.task || "",
    subject: session.subject || "",
    suggestedAction: "none",
    coachLine: "",
  };

  if (!session.task || session.status === "ended") {
    return {
      ...base,
      reasons: ["No focus session is running, so nothing is being judged."],
      coachLine: "Start a session when you know what you are working on.",
    };
  }

  if (surface === "allowlisted") {
    return {
      ...base,
      verdict: VERDICT.ON_TASK,
      confidence: 0.95,
      score: 10,
      reasons: ["This domain is on your own allowlist."],
      coachLine: "You marked this site as part of your study setup.",
    };
  }

  const task = session.task;
  const phrases = taskPhrases(task);
  const taskTerms = keywords(task);
  const haystack = ` ${normalizeText([title, description, channel, pathWords(page.url)].join(" "))} `;
  const pageText = `${title} ${description} ${channel} ${pathWords(page.url)}`;
  const pageSubject = detectSubject(pageText)[0] || null;
  const sessionSubjectId = subjectIdFromLabel(session.subject);
  const taskSubject = detectSubject(task)[0] || null;
  const effectiveSubjectId =
    (pageSubject && pageSubject.id) || sessionSubjectId || (taskSubject && taskSubject.id) || null;

  const signals = [];
  let taskScore = 0;

  for (const phrase of phrases) {
    if (phrase.split(/\s+/).length >= 2 && countPhrase(haystack, phrase)) {
      taskScore += 3;
      signals.push({ kind: "task", weight: 3, label: `Mentions \u201c${phrase}\u201d` });
    }
  }

  const matchedTerms = [];
  for (const term of taskTerms) {
    if (term.length < 3) continue;
    if (haystack.includes(` ${term} `) || haystack.includes(` ${term}s `)) {
      matchedTerms.push(term);
      taskScore += 1;
    }
  }
  if (matchedTerms.length) {
    signals.push({
      kind: "task",
      weight: matchedTerms.length,
      label: `Shares ${matchedTerms.length === 1 ? "the word" : "words"} \u201c${matchedTerms.join("\u201d, \u201c")}\u201d with the task`,
    });
  }

  const taskCluster = detectCluster(
    effectiveSubjectId || sessionSubjectId || pageSubject?.id,
    task
  );
  const pageCluster = effectiveSubjectId ? detectCluster(effectiveSubjectId, pageText) : null;

  let subjectMatched = false;
  if (pageSubject) {
    if (sessionSubjectId) subjectMatched = pageSubject.id === sessionSubjectId;
    else subjectMatched = true;
  } else if (sessionSubjectId) {
    const words = SUBJECT_WORDS[sessionSubjectId] || [];
    subjectMatched = words.some((word) => haystack.includes(` ${word} `));
  }
  if (subjectMatched) {
    const label = SUBJECT_LABELS[effectiveSubjectId] || "the subject";
    signals.push({ kind: "subject", weight: 1, label: `Is ${label} material` });
  }

  const trustedChannel = channelTrust(channel, settings);
  if (trustedChannel) {
    signals.push({ kind: "channel", weight: 1, label: "Channel is on your study list" });
  }

  const sameCluster =
    Boolean(taskCluster && pageCluster) && taskCluster.id === pageCluster.id;

  let verdict = VERDICT.NEUTRAL;
  let confidence = 0.5;
  const reasons = [];

  if (taskScore >= 3) {
    verdict = VERDICT.ON_TASK;
    confidence = 0.93;
  } else if (taskScore >= 1.5) {
    verdict = VERDICT.ON_TASK;
    confidence = 0.82;
  } else if (sameCluster && subjectMatched) {
    verdict = VERDICT.ON_TASK;
    confidence = 0.78;
    reasons.push(
      `Same part of ${SUBJECT_LABELS[effectiveSubjectId] || "the subject"}: ${clusterLabel(effectiveSubjectId, pageCluster.id)}.`
    );
  } else if (subjectMatched) {
    verdict = VERDICT.ADJACENT;
    confidence = trustedChannel ? 0.8 : 0.72;
  } else if (surface === "social" || surface === "youtube") {
    verdict = VERDICT.OFF_TASK;
    confidence = 0.86;
  } else {
    verdict = VERDICT.OFF_TASK;
    confidence = 0.58;
  }

  const taskLabel = task.length > 52 ? `${task.slice(0, 49).trim()}\u2026` : task;
  if (verdict === VERDICT.ON_TASK && !reasons.length) {
    reasons.push(`Looks like work on \u201c${taskLabel}\u201d.`);
  }
  if (verdict === VERDICT.ADJACENT) {
    const pageTopic = clusterLabel(effectiveSubjectId, pageCluster?.id);
    const taskTopic = clusterLabel(effectiveSubjectId, taskCluster?.id);
    if (pageTopic && taskTopic && pageTopic !== taskTopic) {
      reasons.unshift(
        `It is ${SUBJECT_LABELS[effectiveSubjectId] || "the subject"}, but about ${pageTopic} rather than ${taskTopic}.`
      );
    } else {
      reasons.unshift(
        `It is ${SUBJECT_LABELS[effectiveSubjectId] || "subject"} material, but not \u201c${taskLabel}\u201d.`
      );
    }
    if (trustedChannel) reasons.push("Trusted channel, but the topic still sits beside your task.");
  }
  if (verdict === VERDICT.OFF_TASK) {
    if (surface === "social" || surface === "youtube") {
      reasons.unshift(`${host || "This page"} is not connected to \u201c${taskLabel}\u201d.`);
    } else {
      reasons.unshift(`No link to \u201c${taskLabel}\u201d in the title, address or channel.`);
    }
  }

  let coachLine = "";
  let suggestedAction = "none";
  if (verdict === VERDICT.ADJACENT) {
    coachLine =
      "This is the subject, not the assignment. That is exactly the turn that costs you the hour.";
    suggestedAction = "nudge";
  } else if (verdict === VERDICT.OFF_TASK) {
    coachLine = "This is not the assignment. Want the way back?";
    suggestedAction = "nudge";
  } else if (verdict === VERDICT.ON_TASK) {
    coachLine = "You are on the assignment.";
  }

  return {
    ...base,
    verdict,
    confidence,
    score: Number(taskScore.toFixed(2)),
    reasons,
    signals,
    subjectId: effectiveSubjectId,
    taskCluster: taskCluster?.id || null,
    pageCluster: pageCluster?.id || null,
    suggestedAction,
    coachLine,
  };
}

/**
 * Should the content script put a delay screen in front of this page?
 * Strict mode blocks every site on the list. Normal mode only interrupts
 * when the session says the page is off task.
 */
export function softBlockDecision(page, judgement, settings = {}) {
  const host = hostFromUrl(page.url || "");
  const blockedDomain = matchDomain(host, settings.blocklist || []);
  const sessionOn = judgement && judgement.verdict !== VERDICT.NEUTRAL;
  if (!sessionOn) return { block: false, delaySeconds: 0, reason: "no-session" };
  if (!blockedDomain && !settings.blockUnrelated) return { block: false, delaySeconds: 0, reason: "not-listed" };
  if (settings.strictMode && blockedDomain) {
    return { block: true, strict: true, delaySeconds: Number(settings.blockDelaySeconds ?? 8), reason: "strict-list" };
  }
  if (blockedDomain && judgement.verdict !== VERDICT.ON_TASK) {
    return {
      block: true,
      strict: false,
      delaySeconds: Number(settings.blockDelaySeconds ?? 8),
      reason: "listed-and-off-task",
    };
  }
  if (settings.blockUnrelated && judgement.verdict === VERDICT.OFF_TASK && judgement.confidence >= 0.8) {
    return {
      block: true,
      strict: false,
      delaySeconds: Number(settings.blockDelaySeconds ?? 8),
      reason: "confidently-off-task",
    };
  }
  return { block: false, delaySeconds: 0, reason: "allowed" };
}

/** Does this judgement deserve a toast? */
export function shouldNudge(judgement, settings = {}) {
  if (!judgement || !settings.nudges) return false;
  if (judgement.verdict === VERDICT.ON_TASK) return false;
  if (judgement.verdict === VERDICT.NEUTRAL) return false;
  if (judgement.verdict === VERDICT.ADJACENT) return true;
  return judgement.confidence >= 0.7;
}

/** Compact line for the popup and the heatmap. */
export function summarizeJudgement(judgement) {
  if (!judgement) return VERDICT_LABEL.neutral;
  return VERDICT_LABEL[judgement.verdict] || VERDICT_LABEL.neutral;
}
