// The clickable diff only stays honest if every note points at a line that exists, and every
// turn has at least one line worth opening.
import { describe, expect, it } from 'vitest';
import { SHIP_IT } from './ship-it';
import { SHIP_LINE_NOTES } from './ship-it-notes';

describe('Ship It line notes', () => {
  it('covers every turn and has no stale turn ids', () => {
    const ids = new Set(SHIP_IT.turns.map((t) => t.id));
    for (const turn of SHIP_IT.turns) {
      expect(turn.risks?.length ?? 0).toBeGreaterThan(0);
    }
    for (const id of Object.keys(SHIP_LINE_NOTES)) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('points every note at a real line, once, in order', () => {
    for (const turn of SHIP_IT.turns) {
      for (const risk of turn.risks ?? []) {
        expect(risk.line).toBeGreaterThanOrEqual(0);
        expect(risk.line).toBeLessThan(turn.diff.length);
        expect(risk.note.trim().length).toBeGreaterThan(20);
      }
      const lines = (turn.risks ?? []).map((r) => r.line);
      expect(new Set(lines).size).toBe(lines.length);
      expect([...lines].sort((a, b) => a - b)).toEqual(lines);
    }
  });
});
