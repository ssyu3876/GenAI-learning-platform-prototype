// The student edition is the core course plus nine project labs. This test keeps the English
// and Chinese versions structurally paired and checks the 30-hour promise is real.
import { describe, expect, it } from 'vitest';
import { parseVideoUrl } from '@/components/ui/video-embed';
import { agentsStudentCourse } from '../../../scripts/seed/course-agents-student';
import { agentsStudentCourseZh } from './zh/course-agents-student';
import { contentDictionarySize, localizeContent } from './index';

describe('AI agents student edition', () => {
  it('has nine core lessons plus nine labs and about thirty hours', () => {
    expect(agentsStudentCourse.lessons).toHaveLength(18);
    expect(agentsStudentCourse.lessons.slice(9)).toHaveLength(9);
    expect(agentsStudentCourse.lessons.reduce((n, lesson) => n + lesson.activities.length, 0)).toBe(42);
    const minutes = agentsStudentCourse.lessons.reduce((n, lesson) => n + (lesson.estimatedMinutes ?? 0), 0);
    expect(minutes).toBe(1804);
    expect(minutes / 60).toBeGreaterThanOrEqual(30);
    expect(contentDictionarySize()).toBeGreaterThan(2000);
  });

  it('gives every lab two activities and a project deliverable', () => {
    for (const lab of agentsStudentCourse.lessons.slice(9)) {
      expect(lab.activities).toHaveLength(2);
      expect(lab.content).toContain('Deliverable');
      expect(lab.estimatedMinutes).toBeGreaterThanOrEqual(170);
    }
  });

  it('keeps the student title plain and the summary student-facing', () => {
    expect(agentsStudentCourse.title).toBe('Working with AI Coding Agents');
    expect(agentsStudentCourse.title).not.toContain('Student Edition');
    expect(agentsStudentCourse.summary.toLowerCase()).toContain('student');
    expect(agentsStudentCourse.summary.toLowerCase()).not.toContain('busy professionals');
    expect(agentsStudentCourse.tags).toContain('student');
    expect(agentsStudentCourse.tags).not.toContain('professional');
  });

  it('has the same structure in both languages', () => {
    expect(agentsStudentCourseZh.lessons).toHaveLength(agentsStudentCourse.lessons.length);
    agentsStudentCourse.lessons.forEach((lesson, i) => {
      const zh = agentsStudentCourseZh.lessons[i];
      expect(zh?.activities.map((a) => a.type)).toEqual(lesson.activities.map((a) => a.type));
      expect(zh?.estimatedMinutes).toBe(lesson.estimatedMinutes);
    });
  });

  it('keeps quizzes, sorts, sequences, role-play and slides aligned', () => {
    agentsStudentCourse.lessons.forEach((lesson, li) => {
      lesson.activities.forEach((activity, ai) => {
        const zh = agentsStudentCourseZh.lessons[li]?.activities[ai];
        expect(zh?.type).toBe(activity.type);
        if (activity.type === 'quiz' && zh?.type === 'quiz') {
          const en = activity.config as { questions: Array<{ options: string[]; answerIndex: number }> };
          const zhConfig = zh.config as typeof en;
          expect(zhConfig.questions.map((q) => q.answerIndex)).toEqual(en.questions.map((q) => q.answerIndex));
          expect(zhConfig.questions.map((q) => q.options.length)).toEqual(en.questions.map((q) => q.options.length));
        }
        if (activity.type === 'sort' && zh?.type === 'sort') {
          const en = activity.config as { buckets: string[]; items: Array<{ bucket: string }> };
          const zhConfig = zh.config as typeof en;
          expect(zhConfig.items).toHaveLength(en.items.length);
          for (const item of zhConfig.items) expect(zhConfig.buckets).toContain(item.bucket);
        }
        if (activity.type === 'sequence' && zh?.type === 'sequence') {
          expect((zh.config as { steps: string[] }).steps).toHaveLength((activity.config as { steps: string[] }).steps.length);
        }
        if (activity.type === 'roleplay' && zh?.type === 'roleplay') {
          const en = activity.config as { maxTurns: number; goals: string[]; rubric: unknown[]; mockReplies: string[] };
          const zhConfig = zh.config as typeof en;
          expect(zhConfig.maxTurns).toBe(en.maxTurns);
          expect(zhConfig.goals).toHaveLength(en.goals.length);
          expect(zhConfig.rubric).toHaveLength(en.rubric.length);
          expect(zhConfig.mockReplies).toHaveLength(en.mockReplies.length);
        }
        if (activity.type === 'slides' && zh?.type === 'slides') {
          expect((zh.config as { slides: unknown[] }).slides).toHaveLength((activity.config as { slides: unknown[] }).slides.length);
        }
      });
    });
  });

  it('embeds video players in both languages', () => {
    for (const course of [agentsStudentCourse, agentsStudentCourseZh]) {
      const videos = course.lessons.flatMap((lesson) =>
        [...lesson.content.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)]
          .map((match) => match[1]!)
          .filter((url) => parseVideoUrl(url)),
      );
      expect(videos.length).toBeGreaterThanOrEqual(18);
    }
  });

  it('translates the student edition title', () => {
    const zh = localizeContent(agentsStudentCourse, 'zh');
    expect(zh.title).toBe(agentsStudentCourseZh.title);
    expect(zh.title).not.toBe(agentsStudentCourse.title);
    expect(zh.summary).not.toBe(agentsStudentCourse.summary);
  });
});
