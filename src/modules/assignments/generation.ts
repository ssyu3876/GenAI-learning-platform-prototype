// AI draft for an assignment or quiz. The teacher reviews the result before publishing.
import { z } from 'zod';
import { generateJson } from '@/core/ai/client';
import type { Locale } from '@/i18n/config';
import { outputLanguage } from '@/i18n/ai';
import type { AssignmentType } from './schema';

const questionSchema = z.object({
  prompt: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).default([]),
  answer: z.union([z.string(), z.number()]).default(0),
});

const draftSchema = z.object({
  title: z.string().trim().min(1),
  instructions: z.string().trim().default(''),
  questions: z.array(questionSchema).default([]),
});

export interface AssignmentDraft {
  title: string;
  instructions: string;
  questions: Array<{
    kind: 'single' | 'short';
    prompt: string;
    options: string[];
    answer: string;
    points: number;
  }>;
  mocked: boolean;
}

export async function generateAssignmentDraft(input: {
  type: AssignmentType;
  requirement: string;
  courseTitle: string;
  lessonTitle?: string;
  locale: Locale;
  userId: string;
}): Promise<AssignmentDraft> {
  const system = [
    'You write university course assignments for an instructor.',
    'Return JSON only, no markdown.',
    'For type "quiz", include 5 questions. Each question must have 2–4 options and one correct answer index (0-based).',
    'For "assignment" or "project", questions must be an empty array and instructions must be a clear, actionable brief.',
    outputLanguage(input.locale),
  ].join('\n');

  const user = [
    `Type: ${input.type}`,
    `Course: ${input.courseTitle}`,
    input.lessonTitle ? `Week / chapter: ${input.lessonTitle}` : '',
    `Instructor requirements:\n${input.requirement}`,
    'Do not add system/meta commentary. Only student-facing content.',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, mocked } = await generateJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    draftSchema,
    {
      feature: 'assignments.generate',
      userId: input.userId,
      tier: 'fast',
      maxTokens: 3000,
      temperature: 0.5,
      mock: () => mockDraft(input),
    },
  );

  return {
    title: data.title,
    instructions: data.instructions,
    questions: data.questions.map((question) => {
      const options = question.options.filter(Boolean);
      const single = options.length >= 2;
      const raw = String(question.answer);
      const numeric = Number.parseInt(raw, 10);
      const letterIndex = /^[A-Ha-h]$/.test(raw) ? raw.toUpperCase().charCodeAt(0) - 65 : -1;
      const index = Number.isFinite(numeric) ? numeric : letterIndex;
      return {
        kind: single ? ('single' as const) : ('short' as const),
        prompt: question.prompt,
        options,
        answer: single ? String(index >= 0 && index < options.length ? index : 0) : raw,
        points: 1,
      };
    }),
    mocked,
  };
}

function mockDraft(input: {
  type: AssignmentType;
  courseTitle: string;
  lessonTitle?: string;
  locale: Locale;
}): z.infer<typeof draftSchema> {
  const zh = input.locale === 'zh';
  const topic = input.lessonTitle ?? input.courseTitle;
  if (input.type === 'quiz') {
    return {
      title: zh ? `${topic} · 章节测验` : `${topic} · Chapter quiz`,
      instructions: zh
        ? '完成本测验，检查你对本章关键概念的掌握。'
        : 'Complete this quiz to check your understanding of the key ideas in this chapter.',
      questions: [
        {
          prompt: zh ? '本章的核心目标是什么？' : 'What is the main goal of this chapter?',
          options: zh
            ? ['理解基本概念并应用', '记住所有术语', '完成一次考试', '跳过练习']
            : ['Understand and apply the key ideas', 'Memorise every term', 'Pass an exam', 'Skip practice'],
          answer: 0,
        },
        {
          prompt: zh ? '遇到不确定的问题时，最好的做法是？' : 'What is the best response when something is unclear?',
          options: zh
            ? ['查资料并向同学/老师求证', '直接猜一个答案', '忽略问题', '等别人做完']
            : ['Check the material and ask someone', 'Guess immediately', 'Ignore it', 'Wait for others'],
          answer: 0,
        },
      ],
    };
  }
  return {
    title: zh ? `${topic} · 作业` : `${topic} · Assignment`,
    instructions: zh
      ? `结合本章内容，完成一份简短的实践作业：\n\n1. 选择一个真实场景。\n2. 说明你如何应用本章方法。\n3. 提交一份 500 字左右的说明。`
      : `Apply this chapter to a short practical task:\n\n1. Choose a real scenario.\n2. Explain how you would apply the chapter method.\n3. Submit a 500-word write-up.`,
    questions: [],
  };
}
