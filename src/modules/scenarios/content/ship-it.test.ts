// The clickable diff only stays honest if every note points at a line that exists, and every
// turn has at least one line worth opening.
import { describe, expect, it } from 'vitest';
import { localizeContent } from '@/i18n/content';
import { SHIP_LINE_NOTES_ZH } from '@/i18n/content/zh/ship-it-notes';
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

describe('Ship It line notes (Chinese)', () => {
  it('mirrors every English note and line', () => {
    const enIds = Object.keys(SHIP_LINE_NOTES).sort();
    expect(Object.keys(SHIP_LINE_NOTES_ZH).sort()).toEqual(enIds);

    for (const id of enIds) {
      const en = SHIP_LINE_NOTES[id] ?? {};
      const zh = SHIP_LINE_NOTES_ZH[id] ?? {};
      const enLines = Object.keys(en).map(Number).sort((a, b) => a - b);
      const zhLines = Object.keys(zh).map(Number).sort((a, b) => a - b);
      expect(zhLines).toEqual(enLines);

      for (const line of enLines) {
        const note = zh[line] ?? '';
        expect(note.trim().length).toBeGreaterThan(10);
        expect(note).not.toBe(en[line]);
      }
    }
  });

  it('translates the notes through the content dictionary', () => {
    const zh = localizeContent(SHIP_IT, 'zh');
    const enNote = SHIP_IT.turns[0]?.risks?.[0]?.note;
    const zhNote = zh.turns[0]?.risks?.[0]?.note;
    expect(enNote).toBeTruthy();
    expect(zhNote).not.toBe(enNote);
  });
});
