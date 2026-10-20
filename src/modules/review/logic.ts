// Pure logic for the mistake notebook: reading quiz answers and the spaced review schedule.
// Leitner boxes: a missed question starts in box 0 (due now). Each right answer moves it up
// one box and pushes the next review further out; a wrong answer sends it back to box 0.
import { z } from 'zod';

/** Days to wait after reaching box 1, 2 and 3. A right answer in box 3 means mastered. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7] as const;
export const MASTERED_BOX = REVIEW_INTERVAL_DAYS.length + 1;
/** Small reward per right answer on a due card, so reviewing counts on the leaderboard. */
export const REVIEW_CORRECT_XP = 2;
/** Cards per review session, so one sitting stays short. */
export const SESSION_SIZE = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

// Narrow copies of the quiz shapes. Modules do not import each other, so we read the
// stored JSON with our own schemas instead of importing the quiz module.
export const quizQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number().int(),
      explanation: z.string().default(''),
    }),
  ),
});
export type QuizQuestion = z.infer<typeof quizQuestionsSchema>['questions'][number];

export const quizDetailSchema = z.object({
  answers: z.array(z.number().int().nullable()),
});

export function parseQuizQuestions(config: unknown): QuizQuestion[] {
  const parsed = quizQuestionsSchema.safeParse(config);
  return parsed.success ? parsed.data.questions : [];
}

/** The answers array the quiz player saves in activity_attempts.detail, or null. */
export function parseQuizAnswers(detail: unknown): (number | null)[] | null {
  const parsed = quizDetailSchema.safeParse(detail);
  return parsed.success ? parsed.data.answers : null;
}

/** Indexes of questions that were answered and answered wrong. */
export function wrongQuestionIndexes(questions: QuizQuestion[], answers: (number | null)[]): number[] {
  const out: number[] = [];
  questions.forEach((q, i) => {
    const a = answers[i];
    if (typeof a === 'number' && a !== q.answerIndex) out.push(i);
  });
  return out;
}

export interface NextReview {
  box: number;
  dueAt: Date;
  mastered: boolean;
}

export function scheduleNext(box: number, correct: boolean, now: Date): NextReview {
  if (!correct) return { box: 0, dueAt: new Date(now.getTime() + DAY_MS), mastered: false };
  const next = Math.max(0, box) + 1;
  if (next >= MASTERED_BOX) return { box: MASTERED_BOX, dueAt: now, mastered: true };
  const days = REVIEW_INTERVAL_DAYS[next - 1] ?? 1;
  return { box: next, dueAt: new Date(now.getTime() + days * DAY_MS), mastered: false };
}

/** 0-100, how far a card is towards mastered. */
export function boxProgress(box: number): number {
  return Math.round((Math.max(0, Math.min(box, MASTERED_BOX)) / MASTERED_BOX) * 100);
}

/** "today", "tomorrow", "in 3 days" (calendar days, UTC). */
export function formatDue(dueAt: Date, now: Date): string {
  const day = (d: Date) => Math.floor(d.getTime() / DAY_MS);
  const diff = day(dueAt) - day(now);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}
