// Server-side scoring for activity types whose result can be checked from the config alone.
// Pure functions, safe on client and server: given the stored config and the `detail` the
// player submitted, return the 0-100 score, or null when the detail does not fit the activity
// (wrong shape, wrong length, unknown option). The lesson runner uses these instead of the
// score sent by the browser, so XP and leaderboards cannot be faked with a crafted request.
import { z } from 'zod';
import type { QuizConfig } from './quiz/schema';
import type { SequenceConfig } from './sequence/schema';
import type { SortConfig } from './sort/schema';

const percent = (right: number, total: number) => (total ? Math.round((right / total) * 100) : 0);

// Quiz: detail.answers[i] is the ORIGINAL index of the option picked for question i, even
// though the player shows options in a shuffled order. null = not answered (counts as wrong).
const quizDetailSchema = z.object({ answers: z.array(z.number().int().nullable()) });

export function gradeQuiz(config: QuizConfig, detail: unknown): number | null {
  const parsed = quizDetailSchema.safeParse(detail);
  if (!parsed.success) return null;
  const { answers } = parsed.data;
  if (answers.length !== config.questions.length) return null;
  let right = 0;
  for (const [i, q] of config.questions.entries()) {
    const a = answers[i];
    if (a === null || a === undefined) continue;
    if (a < 0 || a >= q.options.length) return null;
    if (a === q.answerIndex) right++;
  }
  return percent(right, config.questions.length);
}

// Sort: detail.placed maps an item's index in config.items to the bucket it was dropped in.
// Unplaced items count as wrong.
const sortDetailSchema = z.object({ placed: z.record(z.string(), z.string()) });

export function gradeSort(config: SortConfig, detail: unknown): number | null {
  const parsed = sortDetailSchema.safeParse(detail);
  if (!parsed.success) return null;
  const { placed } = parsed.data;
  for (const [key, bucket] of Object.entries(placed)) {
    const i = Number(key);
    if (!Number.isInteger(i) || i < 0 || i >= config.items.length) return null;
    if (!config.buckets.includes(bucket)) return null;
  }
  const right = config.items.filter((item, i) => placed[String(i)] === item.bucket).length;
  return percent(right, config.items.length);
}

// Sequence: detail.order[pos] is the index (in the correct order) of the step shown at pos.
// It must be a full permutation; a step counts when it sits in its own position.
const sequenceDetailSchema = z.object({ order: z.array(z.number().int()) });

export function gradeSequence(config: SequenceConfig, detail: unknown): number | null {
  const parsed = sequenceDetailSchema.safeParse(detail);
  if (!parsed.success) return null;
  const { order } = parsed.data;
  const n = config.steps.length;
  if (order.length !== n || new Set(order).size !== n || order.some((v) => v < 0 || v >= n)) return null;
  return percent(order.filter((v, pos) => v === pos).length, n);
}
