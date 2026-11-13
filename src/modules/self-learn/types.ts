import { z } from 'zod';

export const TIME_BUDGETS = ['30m', '1h', '2h', '4h', 'custom'] as const;
export type TimeBudget = (typeof TIME_BUDGETS)[number];

/** One course is capped so a single generation run stays reviewable and affordable. */
export const SINGLE_COURSE_MAX_HOURS = 20;

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
  /** Only used when timeBudget is "custom"; hours are easier for learners than minutes. */
  customHours: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().min(0.25).max(20).optional(),
  ),
  /** Optional override; empty means "derive from the time budget". */
  lessonCount: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().int().min(3).max(12).optional(),
  ),
  explanationStyle: z.enum(EXPLANATION_STYLES).catch('examples'),
  contentFormat: z.enum(CONTENT_FORMATS).catch('mixed'),
  assessment: z.enum(ASSESSMENTS).catch('mixed'),
});

export type GenerationRequest = Omit<z.infer<typeof requestSchema>, 'customHours'> & {
  /** Minutes for a custom budget; absent for a fixed budget. */
  customMinutes?: number;
  /** UI language at generation time, so the outline and lessons stay in that language. */
  locale: 'en' | 'zh';
};

export const outlineLessonSchema = z.object({
  title: z.string().min(1).max(120),
  objective: z.string().min(1).max(300),
  keyPoints: z.array(z.string().min(1).max(200)).min(2).max(5),
  estimatedMinutes: z.number().int().min(5).max(240),
  activityTypes: z.array(z.string().min(1)).min(1).max(3),
});

export const courseOutlineSchema = z.object({
  title: z.string().min(3).max(100),
  promise: z.string().min(1).max(400),
  outcomes: z.array(z.string().min(1).max(200)).min(2).max(5),
  lessons: z.array(outlineLessonSchema).min(3).max(12),
  assessment: z.string().min(1).max(400),
  videoPlan: z.string().min(1).max(300).optional(),
});

export type CourseOutline = z.infer<typeof courseOutlineSchema>;
export type OutlineLesson = z.infer<typeof outlineLessonSchema>;

/** Exact lesson count for a fixed budget. A 4-hour course defaults to 10 short lessons. */
export function lessonCountForBudget(budget: TimeBudget): number {
  return { '30m': 3, '1h': 4, '2h': 6, '4h': 10, custom: 4 }[budget];
}

/** Minutes per lesson for a fixed budget. */
export function minutesPerLesson(budget: TimeBudget): number {
  return { '30m': 10, '1h': 15, '2h': 20, '4h': 24, custom: 25 }[budget];
}

export function totalMinutesForRequest(request: Pick<GenerationRequest, 'timeBudget' | 'customMinutes'>): number {
  if (request.timeBudget === 'custom') return Math.min(20 * 60, Math.max(15, request.customMinutes ?? 60));
  return { '30m': 30, '1h': 60, '2h': 120, '4h': 240, custom: 60 }[request.timeBudget];
}

/**
 * The learner's explicit lesson count wins. Otherwise a custom time budget targets about
 * 25 minutes per lesson; fixed budgets keep their historical shape.
 */
export function lessonCountForRequest(
  request: Pick<GenerationRequest, 'timeBudget' | 'customMinutes' | 'lessonCount'>,
): number {
  if (request.lessonCount) return Math.min(12, Math.max(3, request.lessonCount));
  if (request.timeBudget === 'custom') {
    return Math.min(12, Math.max(3, Math.round(totalMinutesForRequest(request) / 25)));
  }
  return lessonCountForBudget(request.timeBudget);
}

export function minutesPerLessonForRequest(
  request: Pick<GenerationRequest, 'timeBudget' | 'customMinutes' | 'lessonCount'>,
): number {
  return Math.max(5, Math.round(totalMinutesForRequest(request) / lessonCountForRequest(request)));
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
