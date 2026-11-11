// The People course exists twice: English in the seed and Chinese in the i18n dictionary.
// They are paired by position, so a missing lesson or activity silently falls back to English.
import { describe, expect, it } from 'vitest';
import { isSlideVisual } from '@/modules/activities/slides/visuals';
import { peopleCourse } from '../../../scripts/seed/course-people';
import { localizeContent } from './index';
import { peopleCourseZh } from './zh/course-people';

function slideVisuals(course: typeof peopleCourse): string[] {
  return course.lessons.flatMap((lesson) =>
    lesson.activities.flatMap((activity) => {
      if (activity.type !== 'slides') return [];
      const config = activity.config as { slides?: Array<{ visual?: string }> };
      return (config.slides ?? [])
        .map((slide) => slide.visual)
        .filter((visual): visual is string => Boolean(visual));
    }),
  );
}

describe('People course localisation', () => {
  it('keeps the same lesson and activity shape in both languages', () => {
    expect(peopleCourseZh.lessons).toHaveLength(peopleCourse.lessons.length);
    peopleCourse.lessons.forEach((lesson, i) => {
      const zh = peopleCourseZh.lessons[i];
      expect(zh?.activities.map((a) => a.type)).toEqual(lesson.activities.map((a) => a.type));
    });
  });

  it('translates the new practical lesson', () => {
    const zh = localizeContent(peopleCourse, 'zh');
    const translated = zh.lessons.at(-1);
    const english = peopleCourse.lessons.at(-1);
    expect(english).toBeTruthy();
    expect(translated?.title).toBe(peopleCourseZh.lessons.at(-1)?.title);
    expect(translated?.title).not.toBe(english?.title);
  });

  it('links the practice scenarios from the lessons', () => {
    const text = peopleCourse.lessons.map((lesson) => lesson.content).join('\n');
    expect(text).toContain('/scenarios/interview');
    expect(text).toContain('/scenarios/sprint-zero');
  });

  it('only uses slide visuals the player knows how to draw', () => {
    const visuals = [...slideVisuals(peopleCourse), ...slideVisuals(peopleCourseZh)];
    expect(visuals.length).toBeGreaterThan(0);
    for (const visual of visuals) {
      expect(isSlideVisual(visual)).toBe(true);
    }
  });
});
