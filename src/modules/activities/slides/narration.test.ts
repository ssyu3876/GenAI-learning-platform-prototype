import { describe, expect, it } from 'vitest';
import { bulletForSentence, splitSentences } from './narration';

describe('splitSentences', () => {
  it('splits English narration after its punctuation', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?']);
  });

  it('splits Chinese narration after full-width punctuation', () => {
    expect(splitSentences('第一句。第二句！第三句？')).toEqual(['第一句。', '第二句！', '第三句？']);
  });

  it('keeps a final sentence without punctuation', () => {
    expect(splitSentences('First. Second without a stop')).toEqual([
      'First.',
      'Second without a stop',
    ]);
  });

  it('never returns an empty list', () => {
    expect(splitSentences('   ')).toEqual(['']);
  });
});

describe('bulletForSentence', () => {
  it('maps one sentence to one bullet when the counts match', () => {
    expect(bulletForSentence(0, 2, 2)).toBe(0);
    expect(bulletForSentence(1, 2, 2)).toBe(1);
  });

  it('spreads three sentences over two bullets', () => {
    expect(bulletForSentence(0, 3, 2)).toBe(0);
    expect(bulletForSentence(1, 3, 2)).toBe(0);
    expect(bulletForSentence(2, 3, 2)).toBe(1);
  });

  it('stays inside the bullet list and handles no bullets', () => {
    expect(bulletForSentence(5, 3, 2)).toBe(1);
    expect(bulletForSentence(0, 3, 0)).toBeNull();
    expect(bulletForSentence(0, 0, 3)).toBeNull();
  });
});
