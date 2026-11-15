'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useT } from '@/i18n/client';
import { COURSE_FORMATS, type CourseFormat } from '../types';

const CONTENT_FORMAT: Record<CourseFormat, 'read' | 'slides' | 'interactive' | 'mixed'> = {
  text: 'read',
  slides: 'slides',
  video: 'mixed',
  interactive: 'interactive',
};

function deriveContentFormat(selected: CourseFormat[]) {
  if (selected.includes('interactive')) return CONTENT_FORMAT.interactive;
  if (selected.includes('slides')) return CONTENT_FORMAT.slides;
  if (selected.length === 1 && selected[0] === 'text') return CONTENT_FORMAT.text;
  return 'mixed';
}

export function CourseFormatPicker({ defaultFormats = ['text'] }: { defaultFormats?: CourseFormat[] }) {
  const t = useT();
  const [selected, setSelected] = useState<CourseFormat[]>(defaultFormats);
  const lastIndex = useRef<number | null>(null);

  function toggle(index: number, shift: boolean) {
    const value = COURSE_FORMATS[index]!;
    if (shift && lastIndex.current !== null) {
      const start = Math.min(lastIndex.current, index);
      const end = Math.max(lastIndex.current, index);
      const range = COURSE_FORMATS.slice(start, end + 1);
      setSelected((current) => [...new Set([...current, ...range])]);
    } else {
      setSelected((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      );
    }
    lastIndex.current = index;
  }

  return (
    <div>
      <input type="hidden" name="contentFormat" value={deriveContentFormat(selected)} />
      {selected.map((value) => (
        <input key={value} type="hidden" name="formats" value={value} />
      ))}
      <div role="group" aria-label={t.selfLearn.form.formatLabel} className="flex flex-wrap gap-2">
        {COURSE_FORMATS.map((value, index) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={(event) => toggle(index, event.shiftKey)}
              className={`inline-flex items-center gap-1.5 rounded-pill border-2 border-line px-3 py-1.5 text-sm font-semibold transition ${
                active ? 'bg-butter shadow-sticker-sm' : 'bg-paper hover:bg-butter-soft'
              }`}
            >
              {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              {t.selfLearn.form.formatChoices[value]}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">
        {selected.length === 0
          ? t.selfLearn.form.formatEmpty
          : t.selfLearn.form.formatSelected.replace('{count}', String(selected.length))}
        {' · '}
        {t.selfLearn.form.formatShiftHint}
      </p>
    </div>
  );
}
