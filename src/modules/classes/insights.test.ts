import { describe, expect, it } from 'vitest';
import {
  buildMisconceptionInput,
  errorRate,
  mockMisconceptionSummary,
  parseQuizQuestions,
  pickFocusQuestions,
  resolveQuestionRefs,
  tallyQuestions,
  topWrongPick,
  type QuestionInsight,
} from './insights';

const quiz = parseQuizQuestions({
  questions: [
    { prompt: 'Q one', options: ['right', 'trap', 'other'], answerIndex: 0, explanation: 'Because.' },
    { prompt: 'Q two', options: ['a', 'b'], answerIndex: 1 },
  ],
});

function insight(overrides: Partial<QuestionInsight>): QuestionInsight {
  return {
    key: 'k',
    activityId: 'act_1',
    activityTitle: 'Check',
    questionIndex: 0,
    prompt: 'Q one',
    options: ['right', 'trap', 'other'],
    answerIndex: 0,
    explanation: 'Because.',
    answered: 4,
    wrong: 3,
    errorRate: 75,
    picks: [1, 3, 0],
    topWrong: { index: 1, count: 3 },
    lessonTitle: 'Lesson A',
    course: { id: 'crs_1', title: 'Course', emoji: '🌱' },
    ...overrides,
  };
}

describe('tallyQuestions', () => {
  it('counts picks, answers and wrong answers per question', () => {
    const [first, second] = tallyQuestions(quiz, [
      [1, 1],
      [1, 0],
      [0, null],
      [2],
    ]);
    expect(first).toEqual({ answered: 4, wrong: 3, picks: [1, 2, 1] });
    expect(second).toEqual({ answered: 2, wrong: 1, picks: [1, 1] });
  });

  it('ignores answers that point outside the options', () => {
    expect(tallyQuestions(quiz, [[7, -1]])).toEqual([
      { answered: 0, wrong: 0, picks: [0, 0, 0] },
      { answered: 0, wrong: 0, picks: [0, 0] },
    ]);
  });
});

describe('rates and picks', () => {
  it('rounds the error rate and handles zero answers', () => {
    expect(errorRate(1, 3)).toBe(33);
    expect(errorRate(0, 0)).toBe(0);
  });

  it('finds the most popular wrong option', () => {
    expect(topWrongPick({ answered: 5, wrong: 3, picks: [2, 1, 2] }, 0)).toEqual({ index: 2, count: 2 });
    expect(topWrongPick({ answered: 2, wrong: 0, picks: [2, 0, 0] }, 0)).toBeNull();
  });

  it('keeps only questions with enough answers and at least one miss, worst first', () => {
    const focus = pickFocusQuestions([
      insight({ key: 'a', errorRate: 40, wrong: 2, answered: 5 }),
      insight({ key: 'b', errorRate: 100, wrong: 1, answered: 1 }),
      insight({ key: 'c', errorRate: 0, wrong: 0 }),
      insight({ key: 'd', errorRate: 75 }),
    ]);
    expect(focus.map((q) => q.key)).toEqual(['d', 'a']);
  });
});

describe('summary helpers', () => {
  it('labels questions Q1, Q2 and lists wrong picks in the prompt', () => {
    const text = buildMisconceptionInput('Group A', [insight({})]);
    expect(text).toContain('Class: Group A');
    expect(text).toContain('Q1 (Course / Lesson A): Q one');
    expect(text).toContain('"trap" x3');
    expect(text).not.toContain('"right" x1');
  });

  it('maps Q references back to question text and drops unknown ones', () => {
    const focus = [insight({ prompt: 'First' }), insight({ prompt: 'Second' })];
    const resolved = resolveQuestionRefs(
      { overview: 'o', misconceptions: [{ title: 't', detail: 'd', questions: ['Q2', 'q1', 'Q9', 'Q2'], tip: '' }] },
      focus,
    );
    expect(resolved.misconceptions[0]?.questions).toEqual(['Second', 'First']);
  });

  it('builds an offline summary from the numbers', () => {
    const summary = mockMisconceptionSummary([insight({})]);
    expect(summary.misconceptions[0]?.title).toBe('Choosing "trap"');
    expect(summary.misconceptions[0]?.tip).toBe('Because.');
    expect(mockMisconceptionSummary([]).misconceptions).toEqual([]);
  });
});
