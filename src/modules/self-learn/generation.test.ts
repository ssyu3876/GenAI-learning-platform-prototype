import { describe, expect, it } from 'vitest';
import type { CourseDraft } from '@/core/content/draft';
import { qualityIssues } from './generation';
import {
  courseOutlineSchema,
  lessonCountForBudget,
  lessonCountForRequest,
  minutesPerLesson,
  minutesPerLessonForRequest,
  preferredActivityTypes,
  requestSchema,
  type GenerationRequest,
} from './types';

const request: GenerationRequest = {
  topic: 'How the stock market works',
  why: undefined,
  level: 'beginner',
  timeBudget: '1h',
  explanationStyle: 'examples',
  contentFormat: 'mixed',
  assessment: 'mixed',
  locale: 'en',
};

describe('self-learn course shape', () => {
  it('maps a time budget to lessons and minutes', () => {
    expect(lessonCountForBudget('30m')).toBe(3);
    expect(lessonCountForBudget('1h')).toBe(4);
    expect(lessonCountForBudget('2h')).toBe(6);
    expect(lessonCountForBudget('4h')).toBe(10);
    expect(minutesPerLesson('4h')).toBe(24);
  });

  it('honours a lesson-count override and a custom duration', () => {
    expect(lessonCountForRequest({ timeBudget: '4h' })).toBe(10);
    expect(lessonCountForRequest({ timeBudget: '4h', lessonCount: 7 })).toBe(7);
    expect(lessonCountForRequest({ timeBudget: 'custom', customMinutes: 240 })).toBe(10);
    expect(lessonCountForRequest({ timeBudget: 'custom', customMinutes: 90 })).toBe(4);
    expect(minutesPerLessonForRequest({ timeBudget: 'custom', customMinutes: 240, lessonCount: 10 })).toBe(24);
  });

  it('chooses activity types from format and assessment', () => {
    expect(preferredActivityTypes('slides', 'quick')).toContain('slides');
    expect(preferredActivityTypes('interactive', 'project')).toContain('sequence');
    expect(preferredActivityTypes('read', 'quiz')).toContain('quiz');
  });

  it('accepts a framework with concrete outcomes and lessons', () => {
    const outline = courseOutlineSchema.parse({
      title: 'A useful course',
      promise: 'You will be able to do one concrete thing.',
      outcomes: ['Explain the idea', 'Apply it once'],
      lessons: [
        {
          title: 'The big picture',
          objective: 'Understand the shape of the topic.',
          keyPoints: ['One', 'Two'],
          estimatedMinutes: 15,
          activityTypes: ['quiz'],
        },
        {
          title: 'A worked example',
          objective: 'Apply the idea.',
          keyPoints: ['Three', 'Four'],
          estimatedMinutes: 15,
          activityTypes: ['sequence'],
        },
        {
          title: 'Practice',
          objective: 'Try it yourself.',
          keyPoints: ['Five', 'Six'],
          estimatedMinutes: 15,
          activityTypes: ['sort'],
        },
      ],
      assessment: 'A short quiz and one task.',
    });
    expect(outline.lessons).toHaveLength(3);
  });

  it('rejects a thin draft with too few activities', () => {
    const draft: CourseDraft = {
      title: 'A course',
      summary: '',
      subject: 'Test',
      level: 'beginner',
      audience: 'everyone',
      tags: [],
      emoji: '🌱',
      color: 'mint',
      lessons: [
        { title: 'Only a heading', content: 'short', estimatedMinutes: 10, activities: [] },
        { title: 'Another heading', content: 'short', estimatedMinutes: 10, activities: [] },
        { title: 'Third heading', content: 'short', estimatedMinutes: 10, activities: [] },
        { title: 'Fourth heading', content: 'short', estimatedMinutes: 10, activities: [] },
      ],
    };
    const issues = qualityIssues(draft, request);
    expect(issues.some((issue) => issue.includes('too short'))).toBe(true);
    expect(issues.some((issue) => issue.includes('fewer than 2 activities'))).toBe(true);
  });

  it('fills safe defaults for malformed preference values', () => {
    const parsed = requestSchema.parse({
      topic: 'A valid topic',
      level: 'not-a-level',
      timeBudget: 'nope',
      explanationStyle: 'nope',
      contentFormat: 'nope',
      assessment: 'nope',
    });
    expect(parsed.level).toBe('beginner');
    expect(parsed.timeBudget).toBe('1h');
    expect(parsed.contentFormat).toBe('mixed');
  });
});
