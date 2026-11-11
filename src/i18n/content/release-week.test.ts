// Release Week exists twice: English in the scenario content, Chinese in the i18n dictionary.
// They are paired by position, so this guards the shape and the one obvious translation.
import { describe, expect, it } from 'vitest';
import { RELEASE_COPY } from '@/modules/scenarios/content/release-week';
import { localizeContent } from './index';
import { RELEASE_COPY_ZH } from './zh/release-week';

describe('Release Week content', () => {
  it('has three weeks with three decisions each', () => {
    expect(RELEASE_COPY.weeks).toHaveLength(3);
    for (const week of RELEASE_COPY.weeks) {
      expect(week.bank).toHaveLength(3);
      expect(week.draw.reduce((a, b) => a + b, 0)).toBe(3);
      for (const step of week.bank) expect(step.choices).toHaveLength(3);
    }
  });

  it('keeps the Chinese copy structurally identical', () => {
    expect(RELEASE_COPY_ZH.weeks).toHaveLength(RELEASE_COPY.weeks.length);
    RELEASE_COPY.weeks.forEach((week, i) => {
      const zh = RELEASE_COPY_ZH.weeks[i];
      expect(zh?.bank.map((step) => step.id)).toEqual(week.bank.map((step) => step.id));
      expect(zh?.bank.map((step) => step.choices.length)).toEqual(week.bank.map((step) => step.choices.length));
    });
  });

  it('translates the title, weeks, endings and advice through the dictionary', () => {
    const zh = localizeContent(RELEASE_COPY, 'zh');
    expect(zh.title).toBe(RELEASE_COPY_ZH.title);
    expect(zh.weeks[0]?.title).toBe(RELEASE_COPY_ZH.weeks[0]?.title);
    expect(zh.endings.clean.title).toBe(RELEASE_COPY_ZH.endings.clean.title);
    expect(zh.advice.trust).toBe(RELEASE_COPY_ZH.advice.trust);
  });
});
