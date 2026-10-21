import { describe, expect, it } from 'vitest';
import { gradeQuiz, gradeSequence, gradeSort } from './grading';
import type { QuizConfig } from './quiz/schema';
import type { SequenceConfig } from './sequence/schema';
import type { SortConfig } from './sort/schema';

const quiz: QuizConfig = {
  questions: [
    { prompt: 'Q1', options: ['a', 'b', 'c'], answerIndex: 0, explanation: '' },
    { prompt: 'Q2', options: ['a', 'b', 'c', 'd'], answerIndex: 2, explanation: '' },
  ],
};

describe('gradeQuiz', () => {
  it('scores from the stored answer key, not from the client', () => {
    expect(gradeQuiz(quiz, { answers: [0, 2] })).toBe(100);
    expect(gradeQuiz(quiz, { answers: [0, 1] })).toBe(50);
    expect(gradeQuiz(quiz, { answers: [1, 1] })).toBe(0);
  });
  it('treats unanswered questions as wrong', () => {
    expect(gradeQuiz(quiz, { answers: [0, null] })).toBe(50);
  });
  it('rejects answers that do not fit the quiz', () => {
    expect(gradeQuiz(quiz, { answers: [0] })).toBeNull();
    expect(gradeQuiz(quiz, { answers: [0, 9] })).toBeNull();
    expect(gradeQuiz(quiz, { answers: [0, -1] })).toBeNull();
    expect(gradeQuiz(quiz, { score: 100 })).toBeNull();
    expect(gradeQuiz(quiz, undefined)).toBeNull();
  });
});

const sort: SortConfig = {
  instructions: '',
  buckets: ['Functional', 'Non-functional'],
  items: [
    { text: 'Reset password', bucket: 'Functional' },
    { text: 'Loads in 2s', bucket: 'Non-functional' },
    { text: 'Export CSV', bucket: 'Functional' },
    { text: 'Screen reader', bucket: 'Non-functional' },
  ],
};

describe('gradeSort', () => {
  it('counts items placed in their bucket', () => {
    expect(gradeSort(sort, { placed: { 0: 'Functional', 1: 'Non-functional', 2: 'Functional', 3: 'Non-functional' } })).toBe(100);
    expect(gradeSort(sort, { placed: { 0: 'Functional', 1: 'Functional', 2: 'Functional', 3: 'Functional' } })).toBe(50);
  });
  it('counts unplaced items as wrong', () => {
    expect(gradeSort(sort, { placed: { 0: 'Functional' } })).toBe(25);
  });
  it('rejects unknown items or buckets', () => {
    expect(gradeSort(sort, { placed: { 7: 'Functional' } })).toBeNull();
    expect(gradeSort(sort, { placed: { 0: 'Made up' } })).toBeNull();
    expect(gradeSort(sort, { placed: 'everything' })).toBeNull();
  });
});

const sequence: SequenceConfig = { instructions: '', steps: ['one', 'two', 'three', 'four'] };

describe('gradeSequence', () => {
  it('counts steps in their own position', () => {
    expect(gradeSequence(sequence, { order: [0, 1, 2, 3] })).toBe(100);
    expect(gradeSequence(sequence, { order: [1, 0, 2, 3] })).toBe(50);
  });
  it('rejects anything that is not a full permutation', () => {
    expect(gradeSequence(sequence, { order: [0, 0, 1, 2] })).toBeNull();
    expect(gradeSequence(sequence, { order: [0, 1, 2] })).toBeNull();
    expect(gradeSequence(sequence, { order: [0, 1, 2, 4] })).toBeNull();
    expect(gradeSequence(sequence, {})).toBeNull();
  });
});
