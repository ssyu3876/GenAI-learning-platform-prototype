// Prompts for studio AI features. Plain module (no 'use server') so the client can read the presets.
import type { Locale } from '@/i18n/config';
import { outputLanguage } from '@/i18n/ai';

export const REWRITE_PRESETS = [
  {
    id: 'simpler',
    label: 'Simpler for non-CS learners',
    instruction:
      'Rewrite for learners with no computing background. Replace jargon with everyday words, explain any technical term the first time it appears, and use a familiar analogy.',
  },
  {
    id: 'example',
    label: 'Add a real-world example',
    instruction:
      'Keep the lesson as it is, and add one concrete real-world example or short story that shows the main idea in action.',
  },
  {
    id: 'technical',
    label: 'More technical for CS grads',
    instruction:
      'Rewrite for computer science graduates. Be more precise, use correct technical terms, and add one deeper detail or trade-off a professional would care about.',
  },
  {
    id: 'shorter',
    label: 'Shorter',
    instruction: 'Make the lesson about half as long. Keep the key ideas and the example, drop repetition.',
  },
  {
    id: 'chinese',
    label: 'Translate to Chinese',
    instruction:
      'Translate the lesson into natural Simplified Chinese. Keep the Markdown structure, code and well-known English technical terms as they are.',
  },
] as const;

export type RewritePresetId = (typeof REWRITE_PRESETS)[number]['id'];

export const REWRITE_SYSTEM_PROMPT = [
  'You edit lesson pages for a learning platform. You receive a lesson in Markdown and an instruction.',
  'Keep the facts correct and the Markdown structure (headings, lists, code blocks).',
  'Write like a warm, clear teacher: short paragraphs, concrete words, no hype words',
  '("unlock", "empower", "journey", "dive in", "elevate"), no emoji spam.',
  'Reply with the full rewritten lesson in Markdown only. No preface, no closing remarks, no code fence around the whole reply.',
].join('\n');

export function buildRewritePrompt(input: { lessonTitle: string; content: string; instruction: string }): string {
  return [
    `Lesson title: ${input.lessonTitle}`,
    `Instruction: ${input.instruction}`,
    'Lesson (Markdown):',
    '"""',
    input.content.slice(0, 12000),
    '"""',
  ].join('\n');
}

/** Models sometimes wrap the whole answer in ```markdown fences; strip that one outer fence. */
export function stripOuterFence(text: string): string {
  const m = text.trim().match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  return (m?.[1] ?? text).trim();
}

export function buildActivitySystemPrompt(input: { label: string; type: string; promptGuide: string; locale?: Locale }): string {
  return [
    'You write one interactive activity for a lesson on a learning platform.',
    `Activity type: "${input.type}" (${input.label}).`,
    `Config shape: ${input.promptGuide}`,
    'Base the activity on the lesson content you are given. Use plain, warm language, no hype words.',
    outputLanguage(input.locale ?? 'en'),
    'Reply with ONE JSON object only: the config object itself, no wrapper, no commentary.',
  ].join('\n');
}

export function buildActivityUserPrompt(input: {
  courseTitle: string;
  lessonTitle: string;
  content: string;
  note?: string;
}): string {
  return [
    `Course: ${input.courseTitle}`,
    `Lesson: ${input.lessonTitle}`,
    input.note ? `Instructor note: ${input.note}` : '',
    'Lesson content (Markdown):',
    '"""',
    input.content.slice(0, 6000),
    '"""',
  ]
    .filter(Boolean)
    .join('\n');
}
