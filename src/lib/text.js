/**
 * Small text utilities shared by the relevance judge, the reflection writer
 * and the habit report. Everything here is synchronous and side-effect free so
 * it can run in the service worker, a content script, and under `node --test`.
 */

/** Words that carry no topical signal. Kept deliberately short. */
export const STOPWORDS = new Set([
  "a", "about", "after", "again", "against", "all", "also", "am", "an", "and", "any",
  "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "can't", "cannot", "could", "couldn't", "did",
  "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
  "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
  "i", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
  "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "should", "shouldn't", "so", "some", "such", "than", "that",
  "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
  "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
  "was", "wasn't", "we", "were", "weren't", "what", "when", "where", "which", "while",
  "who", "whom", "why", "will", "with", "won't", "would", "wouldn't", "you", "your",
  "yours", "yourself", "yourselves", "need", "want", "get", "make", "use", "using",
  "video", "watch", "watching", "youtube", "page", "site", "today", "tonight",
  "tomorrow", "assignment", "homework", "study", "studying", "learn", "learning",
  "explain", "explained", "explains", "help", "please", "really", "thing", "things",
  "part", "parts", "week", "day", "time", "like", "best", "good", "new",
]);

/** Very light suffix folding. Enough to match "gases"/"gas", "reactions"/"reaction". */
export function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith("ses")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 6 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 5 && w.endsWith("ed")) w = w.slice(0, -2);
  return w;
}

export function normalizeText(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Content words, stemmed, de-duplicated, in original order. */
export function keywords(input) {
  const words = normalizeText(input).split(" ").filter(Boolean);
  const out = [];
  for (const raw of words) {
    if (raw.length < 2) continue;
    if (STOPWORDS.has(raw)) continue;
    const folded = stem(raw);
    if (STOPWORDS.has(folded)) continue;
    if (!out.includes(folded)) out.push(folded);
  }
  return out;
}

/** Split a task line such as "gas stoichiometry: p. 214" into search-friendly phrases. */
export function taskPhrases(task) {
  const cleaned = String(task || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\((?:due|p\.?|page)[^)]*\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/[,;:.!?/|]+|\s+(?:and|then|plus)\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.split(/\s+/).length >= 1 && part.length >= 3);
  return parts.slice(0, 4);
}

/** A stable, date-seeded integer. Used so reflection questions do not reshuffle on reload. */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function pick(list, seed) {
  if (!list.length) return null;
  return list[seed % list.length];
}

/** Format seconds as "1 h 04 min" or "18 min". */
export function formatDuration(totalSeconds) {
  const minutes = Math.max(0, Math.round(Number(totalSeconds || 0) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")} min` : `${hours} h`;
}

/** "16:04" from a 24-hour label and minutes. */
export function formatClock(hour, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatHourRange(hour) {
  const start = formatClock(hour);
  const end = formatClock((hour + 1) % 24);
  return `${start}\u2013${end}`;
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function weekdayName(index) {
  return WEEKDAYS[((index % 7) + 7) % 7];
}

export function dateKey(date = new Date()) {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function hoursBetween(fromIso, toIso) {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.round(ms / 3600000));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function percent(part, whole) {
  if (!whole) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 100);
}
