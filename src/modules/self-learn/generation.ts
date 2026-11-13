import { generateJson, isAiConfigured } from '@/core/ai/client';
import {
  courseDraftSchema,
  lessonDraftSchema,
  sanitizeDraft,
  type ActivitySpec,
  type CourseDraft,
} from '@/core/content/draft';
import { byLocale, outputLanguage } from '@/i18n/ai';
import type { Locale } from '@/i18n/config';
import { buildAudienceNote, type AudienceProfile } from './audience';
import {
  courseOutlineSchema,
  lessonCountForBudget,
  minutesPerLesson,
  preferredActivityTypes,
  type CourseOutline,
  type GenerationRequest,
} from './types';

export interface GenerateOutlineInput {
  request: GenerationRequest;
  profile: AudienceProfile | null;
  specs: ActivitySpec[];
  userId: string;
  feedback?: string;
}

export interface GenerateCourseInput {
  request: GenerationRequest;
  outline: CourseOutline;
  specs: ActivitySpec[];
  userId: string;
  feedback?: string;
}

/** Short label for prompt instructions, not UI copy. */
function budgetLabel(budget: GenerationRequest['timeBudget']): string {
  return { '30m': '30 minutes', '1h': '1 hour', '2h': '2 hours', '4h': '4 hours' }[budget];
}

function styleLabel(style: GenerationRequest['explanationStyle']): string {
  return {
    examples: 'lots of concrete examples and analogies',
    steps: 'step-by-step instructions',
    theory: 'principles first, then practice',
    cases: 'case-driven explanations',
  }[style];
}

function formatLabel(format: GenerationRequest['contentFormat']): string {
  return {
    read: 'reading-first lessons with quick checks',
    slides: 'narrated slides with diagrams',
    interactive: 'interactive practice and scenarios',
    mixed: 'a mix of reading, slides and interactive practice',
  }[format];
}

function assessmentLabel(assessment: GenerationRequest['assessment']): string {
  return {
    quick: 'a short check after each lesson',
    quiz: 'quizzes that test understanding',
    project: 'a small project or applied task',
    mixed: 'a mix of quick checks and a final applied task',
  }[assessment];
}

function typeGuide(specs: ActivitySpec[]): string {
  return specs.map((spec) => `- "${spec.type}" (${spec.label}): ${spec.promptGuide}`).join('\n');
}

function allowedTypes(specs: ActivitySpec[]): string {
  return specs.map((spec) => spec.type).join(', ');
}

/** The prompt keeps the outline small; the expensive call happens only after approval. */
export async function generateOutline(input: GenerateOutlineInput): Promise<CourseOutline> {
  const { request, profile, specs } = input;
  const count = lessonCountForBudget(request.timeBudget);
  const minutes = minutesPerLesson(request.timeBudget);
  const audience = buildAudienceNote(profile, request.why);
  const allowed = allowedTypes(specs);

  const system = [
    'You are Pip, a careful curriculum designer for a learning platform.',
    'Design a course outline, not the full lessons. The learner will approve or adjust this outline before content is written.',
    'Write like a clear human teacher: concrete outcomes, no hype words, no emoji spam.',
    outputLanguage(request.locale),
    'Reply with ONE JSON object only:',
    '{ "title": string, "promise": string (1-2 sentences), "outcomes": string[] (2-5 concrete things the learner can do),',
    `  "lessons": [ { "title": string, "objective": string, "keyPoints": string[] (2-4), "estimatedMinutes": number, "activityTypes": string[] (1-3 from the allowed list) } ] (exactly ${count} lessons),`,
    '  "assessment": string (how the learner proves they learned it), "videoPlan": string (short; narrated slides + diagrams unless told otherwise) }',
    `Allowed activity types: ${allowed}.`,
    'Every lesson must have a distinct purpose and build on the previous one. Do not repeat the same title pattern.',
  ].join('\n');

  const user = [
    `Topic: ${request.topic}`,
    `Learner level: ${request.level}`,
    `Time budget: ${budgetLabel(request.timeBudget)}; exactly ${count} lessons, about ${minutes} minutes each.`,
    `Explanation style: ${styleLabel(request.explanationStyle)}.`,
    `Content format: ${formatLabel(request.contentFormat)}.`,
    `Assessment preference: ${assessmentLabel(request.assessment)}.`,
    audience ? `Learner context: ${audience}.` : '',
    input.feedback ? `The learner reviewed the previous outline and asked for: ${input.feedback}` : '',
    'The course must be useful on its own, not a table of contents with vague labels.',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, mocked } = await generateJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    courseOutlineSchema,
    {
      feature: 'self_learn.generate_outline',
      userId: input.userId,
      tier: 'smart',
      maxTokens: 6000,
      temperature: 0.6,
      mock: () => mockOutline(request, specs),
    },
  );
  if (mocked && isAiConfigured()) {
    throw new Error('Pip could not get a usable course framework from the model. Please try again.');
  }

  return normalizeOutline(data, request, specs);
}

function normalizeOutline(outline: CourseOutline, request: GenerationRequest, specs: ActivitySpec[]): CourseOutline {
  const count = lessonCountForBudget(request.timeBudget);
  const minutes = minutesPerLesson(request.timeBudget);
  const installed = new Set(specs.map((spec) => spec.type));
  const fallbackTypes = preferredActivityTypes(request.contentFormat, request.assessment).filter((type) => installed.has(type));
  const normalized: CourseOutline = {
    ...outline,
    lessons: outline.lessons.slice(0, count).map((lesson) => ({
      ...lesson,
      estimatedMinutes: minutes,
      activityTypes: (lesson.activityTypes.filter((type) => installed.has(type)).slice(0, 3).length
        ? lesson.activityTypes.filter((type) => installed.has(type)).slice(0, 3)
        : fallbackTypes.slice(0, 2)),
    })),
  };
  // The schema allows 3-8; if the model returned fewer than requested, asking it again is
  // better than silently promising a longer course than it wrote.
  return normalized.lessons.length ? normalized : mockOutline(request, specs);
}

/** Full generation; one call, because the outline already fixed the structure. */
export async function generateFullCourse(input: GenerateCourseInput): Promise<CourseDraft> {
  const { request, outline, specs } = input;
  const audience = buildAudienceNote(null, request.why);
  const count = outline.lessons.length;
  const system = [
    'You are Pip, writing the complete lessons for an approved course outline.',
    'Match the approved outline exactly: same title, same lesson order, same lesson titles, same estimated minutes.',
    'Each lesson must be substantial: 400-700 words of Markdown with a short opening, one concrete example,',
    'one common mistake, and a small practice prompt. No filler, no repeated paragraphs, no "in this lesson we will".',
    'Each lesson must have 2-3 activities whose configs match the allowed activity schemas.',
    outputLanguage(request.locale),
    'Reply with ONE JSON object only, matching the supplied course schema. Allowed activity types:',
    typeGuide(specs),
  ].join('\n');

  const user = [
    `Topic: ${request.topic}`,
    `Learner level: ${request.level}`,
    `Time budget: ${budgetLabel(request.timeBudget)}; exactly ${count} lessons.`,
    `Explanation style: ${styleLabel(request.explanationStyle)}.`,
    `Content format: ${formatLabel(request.contentFormat)}.`,
    `Assessment: ${assessmentLabel(request.assessment)}.`,
    audience ? `Learner context: ${audience}.` : '',
    'Approved outline JSON:',
    JSON.stringify(outline, null, 2),
    input.feedback ? `The learner asked for these changes: ${input.feedback}` : '',
    'Set the course title/summary from the outline. Keep the course level/audience sensible.',
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];

  const first = await generateJson(messages, courseDraftSchema, {
    feature: 'self_learn.generate_course',
    userId: input.userId,
    tier: 'smart',
    maxTokens: 16000,
    temperature: 0.6,
    mock: () => mockCourse(request, outline, specs),
  });

  let draft = sanitizeDraft(first.data, specs);
  if (first.mocked) {
    if (isAiConfigured()) throw new Error('Pip could not get usable lessons from the model. Please retry.');
    return draft;
  }

  const issues = qualityIssues(draft, request);
  if (issues.length) {
    const retry = await generateJson(
      [
        ...messages,
        { role: 'assistant', content: JSON.stringify(first.data) },
        {
          role: 'user',
          content: `The draft is too thin: ${issues.join('; ')}. Rewrite the whole JSON and fix those issues. Keep the outline's lesson count and titles.`,
        },
      ],
      courseDraftSchema,
      {
        feature: 'self_learn.generate_course_retry',
        userId: input.userId,
        tier: 'smart',
        maxTokens: 12000,
        temperature: 0.5,
        mock: () => mockCourse(request, outline, specs),
      },
    );
    draft = sanitizeDraft(retry.data, specs);
  }

  return draft;
}

/** Cheap quality gate: the model must write a real course, not four headings. */
export function qualityIssues(draft: CourseDraft, request: GenerationRequest): string[] {
  const expected = lessonCountForBudget(request.timeBudget);
  const issues: string[] = [];
  if (draft.lessons.length !== expected) issues.push(`expected ${expected} lessons, got ${draft.lessons.length}`);
  for (const [index, lesson] of draft.lessons.entries()) {
    if (lesson.content.length < 700) issues.push(`lesson ${index + 1} is too short`);
    if (lesson.activities.length < 2) issues.push(`lesson ${index + 1} has fewer than 2 activities`);
  }
  return issues;
}

function mockOutline(request: GenerationRequest, specs: ActivitySpec[]): CourseOutline {
  const locale = request.locale;
  const count = lessonCountForBudget(request.timeBudget);
  const minutes = minutesPerLesson(request.timeBudget);
  const installed = new Set(specs.map((spec) => spec.type));
  const types = preferredActivityTypes(request.contentFormat, request.assessment).filter((type) => installed.has(type));
  const patterns = byLocale(
    locale,
    ['The big picture', 'The key idea', 'A worked example', 'Common mistakes', 'Practice', 'Going deeper', 'Putting it together', 'What next'],
    ['先看全局', '核心概念', '一个完整例子', '常见错误', '动手练习', '再深入一点', '串起来', '接下来学什么'],
  );
  return {
    title: byLocale(locale, request.topic, request.topic),
    promise: byLocale(
      locale,
      `A practical, ${budgetLabel(request.timeBudget)} introduction to ${request.topic}, built around examples and practice.`,
      `一门围绕例子和练习展开的${budgetLabel(request.timeBudget)}入门课，主题是${request.topic}。`,
    ),
    outcomes: byLocale(
      locale,
      [`Explain the core ideas of ${request.topic}`, 'Recognise a good example and a common mistake', 'Apply one idea in a small task'],
      [`解释${request.topic}的核心概念`, '分辨一个正确例子和常见错误', '在一个小任务里用上一个概念'],
    ),
    lessons: Array.from({ length: count }, (_, index) => ({
      title: patterns[index] ?? byLocale(locale, `Part ${index + 1}`, `第 ${index + 1} 部分`),
      objective: byLocale(locale, `Understand ${request.topic} from a new angle.`, `从新的角度理解${request.topic}。`),
      keyPoints: byLocale(locale, ['One concrete idea', 'Why it matters', 'What to try'], ['一个具体概念', '它为什么重要', '可以尝试什么']),
      estimatedMinutes: minutes,
      activityTypes: types.length ? types.slice(0, 2) : ['quiz'],
    })),
    assessment: byLocale(locale, 'A short quiz and one applied task.', '一个简短测验和一个应用任务。'),
    videoPlan: byLocale(locale, 'Narrated slides with simple diagrams.', '带简单图解的语音幻灯片。'),
  };
}

function mockCourse(request: GenerationRequest, outline: CourseOutline, specs: ActivitySpec[]): CourseDraft {
  const locale = request.locale;
  const byType = new Map(specs.map((spec) => [spec.type, spec]));
  return {
    title: outline.title,
    summary: outline.promise,
    subject: request.topic.split(' ').slice(0, 3).join(' ') || request.topic,
    level: request.level,
    audience: 'everyone',
    tags: [request.topic.toLowerCase().slice(0, 30)],
    emoji: '🌱',
    color: 'mint',
    lessons: outline.lessons.map((lesson) => ({
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      content: byLocale(
        locale,
        `## ${lesson.title}\n\n**Objective:** ${lesson.objective}\n\n${lesson.keyPoints.map((point) => `- ${point}`).join('\n')}\n\n### A concrete example\n\nImagine you are using **${request.topic}** in a real situation. Start with one small decision, write down what you expect, then check it against what actually happens.\n\n### Common mistake\n\nTrying to learn every detail before doing one small task. Pick one example and finish it first.\n\n### Try this\n\nExplain the idea to a friend in two sentences, then change one assumption and see what breaks.`,
        `## ${lesson.title}\n\n**目标：** ${lesson.objective}\n\n${lesson.keyPoints.map((point) => `- ${point}`).join('\n')}\n\n### 一个具体例子\n\n想象你在真实场景里使用**${request.topic}**。先做一个小决定，写下你的预期，再对照实际结果。\n\n### 常见错误\n\n想先把所有细节学完再动手。先挑一个例子做完它。\n\n### 试一试\n\n用两句话把概念讲给朋友听，然后改变一个假设，看看哪里会出问题。`,
      ),
      activities: lesson.activityTypes
        .map((type) => byType.get(type))
        .filter((spec): spec is ActivitySpec => Boolean(spec))
        .slice(0, 2)
        .map((spec) => ({
          type: spec.type,
          title: byLocale(locale, `Check-in: ${lesson.title}`, `小测：${lesson.title}`),
          config: spec.mock({ topic: request.topic, lessonTitle: lesson.title, locale }),
          xpReward: 20,
        })),
    })),
  };
}

/** Rewrite one lesson after the learner's feedback; used by the iteration screen. */
export async function regenerateOneLesson(input: {
  request: GenerationRequest;
  outline: CourseOutline;
  lessonIndex: number;
  specs: ActivitySpec[];
  userId: string;
  feedback: string;
}): Promise<CourseDraft['lessons'][number]> {
  const lesson = input.outline.lessons[input.lessonIndex];
  if (!lesson) throw new Error('Lesson not found');
  const system = [
    'You are Pip, rewriting exactly one lesson from an approved course outline.',
    'Keep the lesson title and estimated minutes. Return ONE JSON object with title, content, estimatedMinutes and 2-3 activities.',
    'The content must be 400-700 words of Markdown with a concrete example, a common mistake and a practice prompt.',
    outputLanguage(input.request.locale),
    'Allowed activity types:',
    typeGuide(input.specs),
  ].join('\n');
  const user = [
    `Topic: ${input.request.topic}`,
    `Lesson title: ${lesson.title}`,
    `Objective: ${lesson.objective}`,
    `Key points: ${lesson.keyPoints.join('; ')}`,
    `Learner feedback: ${input.feedback || 'Make it clearer and more useful.'}`,
  ].join('\n');

  const { data, mocked } = await generateJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    lessonDraftSchema,
    {
      feature: 'self_learn.regenerate_lesson',
      userId: input.userId,
      tier: 'smart',
      maxTokens: 12000,
      temperature: 0.6,
      mock: () => {
        const spec = input.specs[0];
        return {
          title: lesson.title,
          estimatedMinutes: lesson.estimatedMinutes,
          content: byLocale(input.request.locale, `## ${lesson.title}\n\nA revised explanation for ${input.request.topic}.`, `## ${lesson.title}\n\n关于${input.request.topic}的修订讲解。`),
          activities: spec
            ? [{ type: spec.type, title: lesson.title, config: spec.mock({ topic: input.request.topic, lessonTitle: lesson.title, locale: input.request.locale }), xpReward: 20 }]
            : [],
        };
      },
    },
  );
  if (mocked && isAiConfigured()) {
    throw new Error('Pip could not write this lesson. Please retry.');
  }

  const sanitized = sanitizeDraft(
    {
      title: input.outline.title,
      summary: input.outline.promise,
      subject: input.request.topic,
      level: input.request.level,
      audience: 'everyone',
      tags: [],
      emoji: '🌱',
      color: 'mint',
      lessons: [data],
    },
    input.specs,
  );
  const result = sanitized.lessons[0]!;
  // The brief asks for 2-3 activities. If the model returns one, add a second activity of a
  // different type rather than shipping a lesson with a single quiz.
  if (result.activities.length < 2) {
    const extra = input.specs.find((spec) => !result.activities.some((activity) => activity.type === spec.type));
    if (extra) {
      result.activities.push({
        type: extra.type,
        title: byLocale(input.request.locale, `Practice: ${lesson.title}`, `练习：${lesson.title}`),
        config: extra.mock({ topic: input.request.topic, lessonTitle: lesson.title, locale: input.request.locale }),
        xpReward: 20,
      });
    }
  }
  return result;
}
