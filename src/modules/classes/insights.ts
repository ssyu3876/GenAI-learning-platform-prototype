// Pure logic for the class "Insights" tab: per-question error rates from stored quiz answers,
// plus the prompt and offline fallback for the AI misconception summary.
// No "@/" imports so schema.ts (loaded by drizzle-kit) can import the summary type.
import { z } from 'zod';

/** A question needs at least this many answers before it counts as a pattern. */
export const MIN_ANSWERS_FOR_FOCUS = 2;
/** Questions sent to the AI summary, worst first. */
export const FOCUS_LIMIT = 8;
/** Error rate (%) at which a question is flagged in the list. */
export const ATTENTION_RATE = 50;

// Narrow copies of the quiz shapes (modules do not import each other).
const quizQuestionsSchema = z.object({
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

const quizDetailSchema = z.object({ answers: z.array(z.number().int().nullable()) });

export function parseQuizQuestions(config: unknown): QuizQuestion[] {
  const parsed = quizQuestionsSchema.safeParse(config);
  return parsed.success ? parsed.data.questions : [];
}

export function parseQuizAnswers(detail: unknown): (number | null)[] | null {
  const parsed = quizDetailSchema.safeParse(detail);
  return parsed.success ? parsed.data.answers : null;
}

export interface QuestionTally {
  answered: number;
  wrong: number;
  /** How many students picked each option */
  picks: number[];
}

/** Counts answers per question across students (one answers array per student). */
export function tallyQuestions(questions: QuizQuestion[], answerSets: (number | null)[][]): QuestionTally[] {
  return questions.map((q, i) => {
    const picks = q.options.map(() => 0);
    let answered = 0;
    let wrong = 0;
    for (const answers of answerSets) {
      const a = answers[i];
      if (typeof a !== 'number' || a < 0 || a >= q.options.length) continue;
      answered++;
      picks[a]!++;
      if (a !== q.answerIndex) wrong++;
    }
    return { answered, wrong, picks };
  });
}

export function errorRate(wrong: number, answered: number): number {
  return answered ? Math.round((wrong / answered) * 100) : 0;
}

/** The wrong option picked most often, or null when nobody got it wrong. */
export function topWrongPick(tally: QuestionTally, answerIndex: number): { index: number; count: number } | null {
  let best: { index: number; count: number } | null = null;
  for (const [index, count] of tally.picks.entries()) {
    if (index === answerIndex || count === 0) continue;
    if (!best || count > best.count) best = { index, count };
  }
  return best;
}

export interface QuestionInsight {
  key: string;
  activityId: string;
  activityTitle: string;
  questionIndex: number;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  answered: number;
  wrong: number;
  errorRate: number;
  picks: number[];
  topWrong: { index: number; count: number } | null;
  lessonTitle: string;
  course: { id: string; title: string; emoji: string };
}

/** Worst questions with enough answers to mean something. */
export function pickFocusQuestions(questions: QuestionInsight[], limit = FOCUS_LIMIT): QuestionInsight[] {
  return questions
    .filter((q) => q.answered >= MIN_ANSWERS_FOR_FOCUS && q.wrong > 0)
    .sort((a, b) => b.errorRate - a.errorRate || b.wrong - a.wrong)
    .slice(0, limit);
}

export const misconceptionSummarySchema = z.object({
  overview: z.string().trim().min(1).max(600),
  misconceptions: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        detail: z.string().trim().min(1).max(600),
        questions: z.array(z.string().max(300)).max(6).default([]),
        tip: z.string().trim().max(400).default(''),
      }),
    )
    .max(4),
});
export type MisconceptionSummary = z.infer<typeof misconceptionSummarySchema>;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
/** Option text without a trailing full stop, for quoting inside a sentence. */
const quoted = (text: string, max: number) => `"${clip(text.replace(/\.$/, ''), max)}"`;

export const MISCONCEPTION_SYSTEM_PROMPT = `You help a teacher see where their class is going wrong.
You get quiz questions with the right answer, how many students missed each one and which wrong options they picked.
Find the 2-4 misconceptions behind the wrong picks. Group questions that share one. Name the wrong belief itself, not just the topic, and say why the wrong option is tempting.
For each misconception give one short tip the teacher can use at the start of the next class.
Plain, warm English. Short sentences. No hype words. Never guess about individual students.
Reply with JSON only, in this shape:
{"overview": "1-2 sentences on the overall picture",
 "misconceptions": [{"title": "max 8 words", "detail": "max 2 sentences", "questions": ["Q1", "Q3"], "tip": "1 sentence"}]}`;

/** User message for the summary: one block per focus question, labelled Q1, Q2, ... */
export function buildMisconceptionInput(className: string, focus: QuestionInsight[]): string {
  const blocks = focus.map((q, i) => {
    const wrongPicks = q.picks
      .map((count, idx) => ({ count, idx }))
      .filter((p) => p.idx !== q.answerIndex && p.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((p) => `"${clip(q.options[p.idx] ?? '', 160)}" x${p.count}`)
      .join(', ');
    return [
      `Q${i + 1} (${q.course.title} / ${q.lessonTitle}): ${clip(q.prompt, 300)}`,
      `Right answer: "${clip(q.options[q.answerIndex] ?? '', 160)}"`,
      `Missed by ${q.wrong} of ${q.answered} students (${q.errorRate}%)`,
      `Wrong picks: ${wrongPicks || 'none'}`,
      q.explanation ? `Author's explanation: ${clip(q.explanation, 300)}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  });
  return `Class: ${className}\n\n${blocks.join('\n\n')}`;
}

/** Turns the model's "Q2" references back into question text so the stored summary stands alone. */
export function resolveQuestionRefs(summary: MisconceptionSummary, focus: QuestionInsight[]): MisconceptionSummary {
  return {
    ...summary,
    misconceptions: summary.misconceptions.map((m) => ({
      ...m,
      questions: m.questions
        .map((ref) => {
          const n = Number(ref.replace(/[^0-9]/g, ''));
          const q = Number.isInteger(n) ? focus[n - 1] : undefined;
          return q ? clip(q.prompt, 200) : '';
        })
        .filter((p, i, all) => p && all.indexOf(p) === i),
    })),
  };
}

/** Offline fallback built straight from the numbers, so the tab works with no AI key. */
export function mockMisconceptionSummary(focus: QuestionInsight[]): MisconceptionSummary {
  const top = focus.slice(0, 3);
  const worst = top[0];
  return {
    overview: worst
      ? `${focus.length} question${focus.length === 1 ? '' : 's'} stand out. The hardest was in "${worst.lessonTitle}", missed by ${worst.wrong} of ${worst.answered} students.`
      : 'No clear pattern yet.',
    misconceptions: top.map((q) => {
      const wrong = q.topWrong ? q.options[q.topWrong.index] : undefined;
      return {
        title: wrong ? `Choosing ${quoted(wrong, 50)}` : clip(q.prompt, 60),
        detail: wrong
          ? `${q.topWrong!.count} student${q.topWrong!.count === 1 ? '' : 's'} picked ${quoted(wrong, 120)} instead of ${quoted(q.options[q.answerIndex] ?? '', 120)}.`
          : `${q.errorRate}% of answers were wrong.`,
        questions: [clip(q.prompt, 200)],
        tip: q.explanation || 'Walk through this question together at the start of the next class.',
      };
    }),
  };
}
