'use client';

// The diff, one clickable row per line. Lines the scenario author annotated open a short
// explanation of what that line actually does; the rest stay plain context. Making the note
// part of the code block (rather than a hover card) keeps it usable on a phone.
import { useState } from 'react';
import { cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';

export interface DiffRisk {
  /** 0-based line index into `lines`. */
  line: number;
  note: string;
}

export function DiffReview({
  lines,
  risks,
  title = 'The change',
}: {
  lines: string[];
  risks: DiffRisk[];
  title?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  const notes = new Map(risks.map((r) => [r.line, r.note]));
  const selected = open === null ? undefined : notes.get(open);

  return (
    <div className="flex flex-col gap-2">
      <ol
        aria-label={fmt(t.scenarios.ship.diffAria, { title })}
        className="overflow-x-auto rounded-blob border-2 border-line bg-ink px-2 py-2 font-mono text-[0.8rem] leading-relaxed text-cream"
      >
        {lines.map((line, i) => {
          const note = notes.get(i);
          const kind = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'same';
          const code = (
            <>
              <span className="w-4 shrink-0 text-right text-[0.7rem] opacity-40 select-none">{i + 1}</span>
              <span
                className={cn(
                  'whitespace-pre',
                  kind === 'add' && 'text-mint',
                  kind === 'del' && 'text-coral',
                )}
              >
                {line || ' '}
              </span>
            </>
          );

          return (
            <li key={i}>
              {note ? (
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-1 text-left transition-colors hover:bg-cream/10',
                    open === i && 'bg-butter/20',
                  )}
                >
                  {code}
                  <span className="ml-auto flex shrink-0 items-center gap-1 font-sans text-[0.65rem] font-semibold text-butter">
                    <span className="h-1.5 w-1.5 rounded-full bg-butter" aria-hidden />{' '}
                    {t.scenarios.ship.diffNote}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-1">{code}</div>
              )}
            </li>
          );
        })}
      </ol>

      {selected !== undefined && open !== null ? (
        <div className="rounded-blob border-2 border-line bg-paper px-3 py-2">
          <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
            {fmt(t.scenarios.ship.diffLine, { line: open + 1 })}
          </div>
          <p className="mt-0.5 text-sm">{selected}</p>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">{t.scenarios.ship.diffHint}</p>
      )}
    </div>
  );
}
