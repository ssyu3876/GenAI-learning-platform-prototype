// The AI agents course exists twice: English in the seed and Chinese in the i18n dictionary.
// They are paired by position, so a missing lesson or activity silently falls back to English.
import { describe, expect, it } from 'vitest';
import { parseVideoUrl } from '@/components/ui/video-embed';
import { agentsCourse } from '../../../scripts/seed/course-agents';
import { agentsCourseZh } from './zh/course-agents';
import { contentDictionarySize, localizeContent } from './index';

const videoLinks = new Map<string, string[]>();
for (const [language, course] of [
  ['en', agentsCourse],
  ['zh', agentsCourseZh],
] as const) {
  for (const lesson of course.lessons) {
    for (const match of lesson.content.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)) {
      const url = match[1]!;
      if (!parseVideoUrl(url)) continue;
      videoLinks.set(language, [...(videoLinks.get(language) ?? []), url]);
    }
  }
}

describe('AI agents course', () => {
  it('is a nine-lesson course with practice in every lesson', () => {
    expect(agentsCourse.lessons).toHaveLength(9);
    expect(agentsCourse.lessons.reduce((n, lesson) => n + lesson.activities.length, 0)).toBe(24);
    for (const lesson of agentsCourse.lessons) expect(lesson.activities.length).toBeGreaterThanOrEqual(2);
    expect(contentDictionarySize()).toBeGreaterThan(1500);
  });

  it('embeds a playable video in every lesson', () => {
    for (const lesson of agentsCourse.lessons) {
      const urls = [...lesson.content.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)]
        .map((match) => match[1]!)
        .filter((url) => parseVideoUrl(url));
      expect(urls.length).toBeGreaterThanOrEqual(1);
    }
    expect(videoLinks.get('en')?.length).toBeGreaterThanOrEqual(9);
    expect(videoLinks.get('zh')?.length).toBe(videoLinks.get('en')?.length);
    expect(videoLinks.get('zh')?.every((url) => parseVideoUrl(url) !== null)).toBe(true);
  });

  it('keeps the same lesson and activity shape in both languages', () => {
    expect(agentsCourseZh.lessons).toHaveLength(agentsCourse.lessons.length);
    agentsCourse.lessons.forEach((lesson, i) => {
      const zh = agentsCourseZh.lessons[i];
      expect(zh?.activities.map((activity) => activity.type)).toEqual(lesson.activities.map((activity) => activity.type));
    });
  });

  it('translates the course and the new lessons', () => {
    const zh = localizeContent(agentsCourse, 'zh');
    expect(zh.title).toBe(agentsCourseZh.title);
    expect(zh.title).not.toBe(agentsCourse.title);
    for (const [i, lesson] of agentsCourse.lessons.entries()) {
      expect(zh.lessons[i]?.title).toBe(agentsCourseZh.lessons[i]?.title);
      expect(zh.lessons[i]?.title).not.toBe(lesson.title);
    }
  });

  it('keeps quiz answers, sort buckets and coding tests aligned after translation', () => {
    agentsCourse.lessons.forEach((lesson, li) => {
      lesson.activities.forEach((activity, ai) => {
        const zh = agentsCourseZh.lessons[li]?.activities[ai];
        expect(zh?.type).toBe(activity.type);
        if (activity.type === 'quiz' && zh?.type === 'quiz') {
          const en = activity.config as { questions: Array<{ options: string[]; answerIndex: number }> };
          const zhConfig = zh.config as typeof en;
          expect(zhConfig.questions.map((q) => q.answerIndex)).toEqual(en.questions.map((q) => q.answerIndex));
          expect(zhConfig.questions.map((q) => q.options.length)).toEqual(en.questions.map((q) => q.options.length));
        }
        if (activity.type === 'sort' && zh?.type === 'sort') {
          const zhConfig = zh.config as { buckets: string[]; items: Array<{ bucket: string }> };
          expect(zhConfig.items).toHaveLength((activity.config as typeof zhConfig).items.length);
          for (const item of zhConfig.items) expect(zhConfig.buckets).toContain(item.bucket);
        }
        if (activity.type === 'coding' && zh?.type === 'coding') {
          const en = activity.config as { tests: Array<{ args: unknown[]; expected: unknown }> };
          const zhConfig = zh.config as typeof en;
          expect(zhConfig.tests.map((t) => [t.args, t.expected])).toEqual(en.tests.map((t) => [t.args, t.expected]));
        }
      });
    });
  });
});
