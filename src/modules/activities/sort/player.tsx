'use client';

import { Check, Undo2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { seededShuffle, useCompletion } from '../components/use-completion';
import type { SortConfig } from './schema';

const BUCKET_TINTS = ['bg-sky-soft', 'bg-coral-soft', 'bg-mint-soft', 'bg-lilac-soft'];

// Click-to-place instead of drag-and-drop: works with keyboard, touch and screen readers.
export function SortPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<SortConfig>) {
  const t = useT();
  const items = useMemo(
    () => seededShuffle(config.items.map((it, i) => ({ ...it, key: i })), activity.id),
    [config.items, activity.id],
  );
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(items[0]?.key ?? null);
  const [checked, setChecked] = useState(false);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const pool = items.filter((it) => placed[it.key] === undefined);
  const correct = items.filter((it) => placed[it.key] === it.bucket).length;
  const score = Math.round((correct / items.length) * 100);

  function place(bucket: string) {
    if (selected === null) return;
    const next = { ...placed, [selected]: bucket };
    setPlaced(next);
    const remaining = items.filter((it) => next[it.key] === undefined);
    setSelected(remaining[0]?.key ?? null);
  }

  function unplace(key: number) {
    if (checked) return;
    const next = { ...placed };
    delete next[key];
    setPlaced(next);
    setSelected(key);
  }

  function check() {
    setChecked(true);
    void submit({ score, detail: { placed } });
  }

  function retry() {
    setPlaced({});
    setSelected(items[0]?.key ?? null);
    setChecked(false);
    reset();
  }

  return (
    <ActivityFrame kind={t.activities.frame.sort} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview}>
      <div className="flex flex-col gap-4">
        <p className="font-semibold">{config.instructions}</p>

        {!checked ? (
          <div className="rounded-xl border-2 border-dashed border-line/40 p-3">
            <p className="mb-2 text-sm text-ink-soft">
              {pool.length ? t.activities.sort.pickCard : t.activities.sort.allPlaced}
            </p>
            <div className="flex flex-wrap gap-2">
              {pool.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  aria-pressed={selected === it.key}
                  onClick={() => setSelected(it.key)}
                  className={cn(
                    'rounded-xl border-2 border-line bg-paper px-3 py-2 text-left text-sm font-semibold transition',
                    selected === it.key ? '-translate-y-0.5 bg-butter shadow-sticker-sm' : 'hover:bg-butter-soft',
                  )}
                >
                  {it.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={cn('grid gap-3', config.buckets.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {config.buckets.map((bucket, bi) => (
            <div key={bucket} className={cn('flex flex-col gap-2 rounded-blob border-2 border-line p-3', BUCKET_TINTS[bi % 4])}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-bold">{bucket}</h4>
                {!checked ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selected === null}
                    onClick={() => place(bucket)}
                    aria-label={fmt(t.activities.sort.placeIn, { bucket })}
                  >
                    {t.activities.sort.placeHere}
                  </Button>
                ) : null}
              </div>
              <ul className="flex min-h-12 flex-col gap-1.5">
                {items
                  .filter((it) => placed[it.key] === bucket)
                  .map((it) => {
                    const ok = it.bucket === bucket;
                    return (
                      <li key={it.key}>
                        <button
                          type="button"
                          onClick={() => unplace(it.key)}
                          disabled={checked}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg border-2 border-line bg-paper px-2.5 py-1.5 text-left text-sm',
                            checked && (ok ? 'bg-mint' : 'bg-coral'),
                          )}
                          aria-label={
                            checked
                              ? `${it.text}: ${ok ? t.activities.sort.correct : fmt(t.activities.sort.wrong, { bucket: it.bucket })}`
                              : fmt(t.activities.sort.takeBack, { text: it.text })
                          }
                        >
                          {checked ? ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" /> : <Undo2 className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                          <span>
                            {it.text}
                            {checked && !ok ? <span className="block text-xs font-bold">→ {it.bucket}</span> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>

        {checked ? (
          <ResultPanel score={score} outcome={outcome} submitting={submitting} error={error} preview={preview} onRetry={retry}>
            <p className="text-ink-soft">{fmt(t.activities.sort.scoreLine, { correct, total: items.length })}</p>
          </ResultPanel>
        ) : (
          <div className="flex justify-end">
            <Button onClick={check} disabled={pool.length > 0}>
              {t.activities.sort.check}
            </Button>
          </div>
        )}
      </div>
    </ActivityFrame>
  );
}
