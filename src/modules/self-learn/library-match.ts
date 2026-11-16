// Before generating a new course, look for a public course that already covers the request.
// This is a lightweight token-overlap match; the UI only shows it as a suggestion.
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { courses } from '@/core/db/schema';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import type { GenerationRequest } from './types';

export interface CourseMatch {
  id: string;
  slug: string;
  title: string;
  summary: string;
  emoji: string;
  subject: string;
  score: number;
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'into',
  'about',
  '想要',
  '学习',
  '课程',
  '一个',
  '一些',
  '如何',
  '怎么',
  '什么',
  'the',
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function scoreCourse(course: CourseMatch, topic: string, why: string): number {
  const haystack = `${course.title} ${course.summary} ${course.subject}`.toLowerCase();
  const topicTokens = tokens(topic);
  const whyTokens = tokens(why);
  let score = 0;
  const normalizedTopic = topic.toLowerCase().trim();
  if (normalizedTopic.length >= 2 && haystack.includes(normalizedTopic)) score += 12;
  for (const token of new Set(topicTokens)) {
    if (haystack.includes(token)) score += 4;
  }
  for (const token of new Set(whyTokens)) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export async function findMatchingPublicCourses(request: GenerationRequest): Promise<CourseMatch[]> {
  const db = await getDb();
  const locale = await getLocale();
  const rows = await db
    .select()
    .from(courses)
    .where(and(eq(courses.status, 'published'), eq(courses.visibility, 'public')));
  const topic = request.topic;
  const why = request.why ?? '';
  return rows
    .map((raw) => {
      const course = localizeContent(raw, locale);
      const match: CourseMatch = {
        id: course.id,
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        emoji: course.emoji,
        subject: course.subject,
        score: 0,
      };
      return { ...match, score: scoreCourse(match, topic, why) };
    })
    .filter((match) => match.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
