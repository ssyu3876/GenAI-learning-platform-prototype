import { describe, expect, it } from 'vitest';
import {
  boxProgress,
  formatDue,
  MASTERED_BOX,
  parseQuizAnswers,
  parseQuizQuestions,
  scheduleNext,
  wrongQuestionIndexes,
} from './logic';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-20T08:00:00Z');

const questions = parseQuizQuestions({
  questions: [
    { prompt: 'A?', options: ['x', 'y'], answerIndex: 0 },
    { prompt: 'B?', options: ['x', 'y', 'z'], answerIndex: 2, explanation: 'z it is' },
    { prompt: 'C?', options: ['x', 'y'], answerIndex: 1 },
  ],
});

describe('quiz parsing', () => {
  it('reads questions and fills the default explanation', () => {
    expect(questions).toHaveLength(3);
    expect(questions[0]?.explanation).toBe('');
  });

  it('returns nothing for a config that is not a quiz', () => {
    expect(parseQuizQuestions({ steps: ['a'] })).toEqual([]);
    expect(parseQuizAnswers({ placed: {} })).toBeNull();
    expect(parseQuizAnswers(null)).toBeNull();
  });

  it('finds wrong answers and ignores unanswered questions', () => {
    expect(wrongQuestionIndexes(questions, [0, 1, 1])).toEqual([1]);
    expect(wrongQuestionIndexes(questions, [1, null])).toEqual([0]);
    expect(wrongQuestionIndexes(questions, [0, 2, 1])).toEqual([]);
  });
});

describe('scheduleNext', () => {
  it('moves up one box per right answer with growing gaps', () => {
    const first = scheduleNext(0, true, now);
    expect(first).toMatchObject({ box: 1, mastered: false });
    expect(first.dueAt.getTime() - now.getTime()).toBe(1 * DAY);
    expect(scheduleNext(1, true, now).dueAt.getTime() - now.getTime()).toBe(3 * DAY);
    expect(scheduleNext(2, true, now).dueAt.getTime() - now.getTime()).toBe(7 * DAY);
  });

  it('marks a card mastered after a right answer in the last box', () => {
    expect(scheduleNext(MASTERED_BOX - 1, true, now)).toMatchObject({ box: MASTERED_BOX, mastered: true });
  });

  it('sends a wrong answer back to box 0 for tomorrow', () => {
    const res = scheduleNext(2, false, now);
    expect(res).toMatchObject({ box: 0, mastered: false });
    expect(res.dueAt.getTime() - now.getTime()).toBe(DAY);
  });
});

describe('display helpers', () => {
  it('turns a box into progress', () => {
    expect(boxProgress(0)).toBe(0);
    expect(boxProgress(MASTERED_BOX)).toBe(100);
    expect(boxProgress(99)).toBe(100);
  });

  it('formats due dates in calendar days', () => {
    expect(formatDue(new Date(now.getTime() - DAY), now)).toBe('today');
    expect(formatDue(now, now)).toBe('today');
    expect(formatDue(new Date(now.getTime() + DAY), now)).toBe('tomorrow');
    expect(formatDue(new Date(now.getTime() + 3 * DAY), now)).toBe('in 3 days');
  });
});
