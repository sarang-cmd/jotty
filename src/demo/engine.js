/**
 * The live demo on the landing page runs this exact module, bundled by
 * `npm run build` into docs/assets/engine.js. Nothing is reimplemented for the
 * site, and no data leaves the page.
 */

import { judgePage, softBlockDecision, shouldNudge, VERDICT, VERDICT_LABEL } from "../lib/relevance.js";
import {
  createHabits,
  recordSlice,
  recordEvent,
  buildHeatmap,
  rankWeakSpots,
  summarizeDay,
  focusStreak,
} from "../lib/habits.js";
import { buildReflection, evaluateReflection } from "../lib/reflection.js";
import { createSession, formatCountdown, remainingSeconds } from "../lib/session.js";
import { formatDuration, formatHourRange, dateKey } from "../lib/text.js";

export {
  judgePage,
  softBlockDecision,
  shouldNudge,
  VERDICT,
  VERDICT_LABEL,
  createHabits,
  recordSlice,
  recordEvent,
  buildHeatmap,
  rankWeakSpots,
  summarizeDay,
  focusStreak,
  buildReflection,
  evaluateReflection,
  createSession,
  formatCountdown,
  remainingSeconds,
  formatDuration,
  formatHourRange,
  dateKey,
};
