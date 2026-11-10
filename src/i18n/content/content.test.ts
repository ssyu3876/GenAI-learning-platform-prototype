import { describe, expect, it } from 'vitest';
import { SPRINT_ZERO } from '@/modules/scenarios/content/sprint-zero';
import { INTERVIEW_TYPES } from '@/modules/scenarios/content/interview';
import { basicsCourse } from '../../../scripts/seed/course-basics';
import { contentDictionarySize, localizeContent } from './index';

describe('content localisation', () => {
  it('has a filled dictionary', () => {
    expect(contentDictionarySize()).toBeGreaterThan(1000);
  });

  it('keeps English untouched', () => {
    const sprint = localizeContent(SPRINT_ZERO, 'en');
    expect(sprint.title).toBe(SPRINT_ZERO.title);
    expect(sprint.weeks[0]?.bank[0]?.title).toBe(SPRINT_ZERO.weeks[0]?.bank[0]?.title);
  });

  it('translates display text but never ids, keys or activity types', () => {
    const sprint = localizeContent(SPRINT_ZERO, 'zh');
    expect(sprint.title).not.toBe(SPRINT_ZERO.title);
    expect(sprint.stats.map((s) => s.key)).toEqual(SPRINT_ZERO.stats.map((s) => s.key));
    const enStep = SPRINT_ZERO.weeks[0]!.bank[0]!;
    const zhStep = sprint.weeks[0]!.bank[0]!;
    expect(zhStep.id).toBe(enStep.id);
    expect(zhStep.choices.map((c) => c.id)).toEqual(enStep.choices.map((c) => c.id));
    expect(zhStep.title).not.toBe(enStep.title);
  });

  it('translates course content by exact match', () => {
    const zh = localizeContent(basicsCourse, 'zh');
    expect(zh.title).not.toBe(basicsCourse.title);
    expect(zh.lessons[0]?.title).not.toBe(basicsCourse.lessons[0]?.title);
    // Sort buckets and their item.bucket values must stay consistent after translation.
    for (const lesson of zh.lessons) {
      for (const activity of lesson.activities) {
        if (activity.type !== 'sort') continue;
        const config = activity.config as { buckets: string[]; items: Array<{ bucket: string }> };
        for (const item of config.items) expect(config.buckets).toContain(item.bucket);
      }
    }
    expect(INTERVIEW_TYPES.length).toBe(localizeContent(INTERVIEW_TYPES, 'zh').length);
  });
});
