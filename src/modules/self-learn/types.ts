import { z } from 'zod';

export const TIME_BUDGETS = ['30m', '1h', '2h', '4h'] as const;
export type TimeBudget = (typeof TIME_BUDGETS)[number];

export const EXPLANATION_STYLES = ['examples', 'steps', 'theory', 'cases'] as const;
export type ExplanationStyle = (typeof EXPLANATION_STYLES)[number];

export const CONTENT_FORMATS = ['read', 'slides', 'interactive', 'mixed'] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const ASSESSMENTS = ['quick', 'quiz', 'project', 'mixed'] as const;
export type Assessment = (typeof ASSESSMENTS)[number];

export const requestSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  why: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value ? value : undefined)),
  level: z.enum(['beginner', 'intermediate', 'advanced']).catch('beginner'),
  timeBudget: z.enum(TIME_BUDGETS).catch('1h'),
  explanationStyle: z.enum(EXPLANATION_STYLES).catch('examples'),
  contentFormat: z.enum(CONTENT_FORMATS).catch('mixed'),
  assessment: z.enum(ASSESSMENTS).catch('mixed'),
});

export type GenerationRequest = z.infer<typeof requestSchema> & {
  /** UI language at generation time, so the outline and lessons stay in that language. */
  locale: 'en' | 'zh';
};

export const outlineLessonSchema = z.object({
  title: z.string().min(1).max(120),
  objective: z.string().min(1).max(300),
  keyPoints: z.array(z.string().min(1).max(200)).min(2).max(5),
  estimatedMinutes: z.number().int().min(5).max(60),
  activityTypes: z.array(z.string().min(1)).min(1).max(3),
});

export const courseOutlineSchema = z.object({
  title: z.string().min(3).max(100),
  promise: z.string().min(1).max(400),
  outcomes: z.array(z.string().min(1).max(200)).min(2).max(5),
  lessons: z.array(outlineLessonSchema).min(3).max(8),
  assessment: z.string().min(1).max(400),
  videoPlan: z.string().min(1).max(300).optional(),
});

export type CourseOutline = z.infer<typeof courseOutlineSchema>;
export type OutlineLesson = z.infer<typeof outlineLessonSchema>;

/** Exact lesson count for a time budget. Keeps the promise and the content in sync. */
export function lessonCountForBudget(budget: TimeBudget): number {
  return { '30m': 3, '1h': 4, '2h': 6, '4h': 8 }[budget];
}

/** Minutes per lesson for a budget. */
export function minutesPerLesson(budget: TimeBudget): number {
  return { '30m': 10, '1h': 15, '2h': 20, '4h': 30 }[budget];
}

/**
 * Activity types to offer the generator for a content/assessment preference. They are
 * intersected with the installed registry anyway, so adding/removing a module is safe.
 */
export function preferredActivityTypes(format: ContentFormat, assessment: Assessment): string[] {
  const base =
    format === 'slides'
      ? ['slides', 'quiz']
      : format === 'interactive'
        ? ['sequence', 'sort', 'coding', 'roleplay', 'quiz']
        : format === 'read'
          ? ['quiz', 'sort']
          : ['slides', 'quiz', 'sequence', 'sort', 'roleplay'];

  const assessmentExtra =
    assessment === 'project' ? ['coding', 'roleplay'] : assessment === 'quiz' ? ['quiz'] : [];
  return [...new Set([...base, ...assessmentExtra])];
}
