import { describe, expect, it } from 'vitest';
import { matchRows, type SyncRow } from './match-rows';

const ids = (rows: (SyncRow | null)[]) => rows.map((row) => row?.id ?? null);

// One lesson as it is stored today: a sort, a quiz and a sequence
const activityRows: SyncRow[] = [
  { id: 'sort', position: 0, type: 'sort', title: 'Which meeting is this?' },
  { id: 'quiz', position: 1, type: 'quiz', title: 'Agile basics' },
  { id: 'sequence', position: 2, type: 'sequence', title: 'Order a sprint' },
];

describe('matchRows for activities', () => {
  it('keeps every row when nothing changed', () => {
    const items = activityRows.map(({ type, title }) => ({ type, title }));
    const { matches, unused } = matchRows(activityRows, items);
    expect(ids(matches)).toEqual(['sort', 'quiz', 'sequence']);
    expect(unused).toEqual([]);
  });

  it('gives an activity inserted at the start a new row, and keeps the old ids', () => {
    const { matches, unused } = matchRows(activityRows, [
      { type: 'slides', title: 'Pip walks through one sprint' },
      { type: 'sort', title: 'Which meeting is this?' },
      { type: 'quiz', title: 'Agile basics' },
      { type: 'sequence', title: 'Order a sprint' },
    ]);
    expect(ids(matches)).toEqual([null, 'sort', 'quiz', 'sequence']);
    expect(unused).toEqual([]);
  });

  it('follows activities that swapped places', () => {
    const { matches } = matchRows(activityRows, [
      { type: 'quiz', title: 'Agile basics' },
      { type: 'sort', title: 'Which meeting is this?' },
      { type: 'sequence', title: 'Order a sprint' },
    ]);
    expect(ids(matches)).toEqual(['quiz', 'sort', 'sequence']);
  });

  it('keeps the row when only the title was edited', () => {
    const { matches, unused } = matchRows(activityRows, [
      { type: 'sort', title: 'Which meeting is it?' },
      { type: 'quiz', title: 'Agile basics' },
      { type: 'sequence', title: 'Order a sprint' },
    ]);
    expect(ids(matches)).toEqual(['sort', 'quiz', 'sequence']);
    expect(unused).toEqual([]);
  });

  it('does not reuse a row of another type at the same position', () => {
    const { matches, unused } = matchRows(activityRows, [
      { type: 'slides', title: 'A new deck' },
      { type: 'quiz', title: 'Agile basics' },
      { type: 'sequence', title: 'Order a sprint' },
    ]);
    expect(ids(matches)).toEqual([null, 'quiz', 'sequence']);
    expect(ids(unused)).toEqual(['sort']);
  });

  it('reports only the removed activity as unused', () => {
    const { matches, unused } = matchRows(activityRows, [
      { type: 'sort', title: 'Which meeting is this?' },
      { type: 'sequence', title: 'Order a sprint' },
    ]);
    expect(ids(matches)).toEqual(['sort', 'sequence']);
    expect(ids(unused)).toEqual(['quiz']);
  });

  it('uses each row once when two activities share a title', () => {
    const rows: SyncRow[] = [
      { id: 'a', position: 0, type: 'quiz', title: 'Check' },
      { id: 'b', position: 1, type: 'quiz', title: 'Check' },
    ];
    const { matches } = matchRows(rows, [
      { type: 'quiz', title: 'Check' },
      { type: 'quiz', title: 'Check' },
      { type: 'quiz', title: 'Check' },
    ]);
    expect(ids(matches)).toEqual(['a', 'b', null]);
  });
});

describe('matchRows for lessons (no type)', () => {
  const lessonRows: SyncRow[] = [
    { id: 'l1', position: 0, title: 'From idea to app' },
    { id: 'l2', position: 1, title: 'Requirements' },
  ];

  it('keeps lesson ids when a lesson is inserted at the start', () => {
    const { matches, unused } = matchRows(lessonRows, [
      { title: 'Welcome' },
      { title: 'From idea to app' },
      { title: 'Requirements' },
    ]);
    expect(ids(matches)).toEqual([null, 'l1', 'l2']);
    expect(unused).toEqual([]);
  });

  it('keeps the lesson id when only its title was edited', () => {
    const { matches } = matchRows(lessonRows, [{ title: 'From idea to app' }, { title: 'Requirements: what to build' }]);
    expect(ids(matches)).toEqual(['l1', 'l2']);
  });

  it('reports a removed lesson as unused', () => {
    const { matches, unused } = matchRows(lessonRows, [{ title: 'Requirements' }]);
    expect(ids(matches)).toEqual(['l2']);
    expect(ids(unused)).toEqual(['l1']);
  });
});
