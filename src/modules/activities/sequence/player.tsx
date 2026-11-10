'use client';

import { ArrowDown, ArrowUp, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { seededShuffle, useCompletion } from '../components/use-completion';
import type { SequenceConfig } from './schema';

export function SequencePlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<SequenceConfig>) {
  const t = useT();
  const initial = () => {
    const indices = config.steps.map((_, i) => i);
    let shuffled = seededShuffle(indices, activity.id);
    // Never start already solved
    if (shuffled.every((v, i) => v === i)) shuffled = [...shuffled.slice(1), shuffled[0]!];
    return shuffled;
  };
  const [order, setOrder] = useState<number[]>(initial);
  const [checked, setChecked] = useState(false);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const correct = order.filter((v, i) => v === i).length;
  const score = Math.round((correct / order.length) * 100);

  function move(pos: number, dir: -1 | 1) {
    const target = pos + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[pos], next[target]] = [next[target]!, next[pos]!];
    setOrder(next);
  }

  function check() {
    setChecked(true);
    void submit({ score, detail: { order } });
  }

  function retry() {
    setOrder(initial());
    setChecked(false);
    reset();
  }

  return (
    <ActivityFrame kind={t.activities.frame.sequence} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview}>
      <div className="flex flex-col gap-4">
        <p className="font-semibold">{config.instructions}</p>
        <ol className="flex flex-col gap-2" aria-label={t.activities.sequence.steps}>
          {order.map((stepIndex, pos) => {
            const ok = stepIndex === pos;
            return (
              <li
                key={stepIndex}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 border-line bg-paper px-3 py-2 transition',
                  checked && (ok ? 'bg-mint-soft' : 'bg-coral-soft'),
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-butter font-display font-bold">
                  {pos + 1}
                </span>
                <span className="flex-1 font-semibold">{config.steps[stepIndex]}</span>
                {checked ? (
                  ok ? (
                    <Check className="h-5 w-5" aria-label={t.activities.sequence.correctPosition} />
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-bold">
                      <X className="h-4 w-4" aria-hidden /> {fmt(t.activities.sequence.shouldBe, { position: stepIndex + 1 })}
                    </span>
                  )
                ) : (
                  <span className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(pos, -1)}
                      disabled={pos === 0}
                      aria-label={fmt(t.activities.sequence.moveUp, { text: config.steps[stepIndex]! })}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => move(pos, 1)}
                      disabled={pos === order.length - 1}
                      aria-label={fmt(t.activities.sequence.moveDown, { text: config.steps[stepIndex]! })}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        {checked ? (
          <ResultPanel score={score} outcome={outcome} submitting={submitting} error={error} preview={preview} onRetry={retry}>
            <p className="text-ink-soft">{fmt(t.activities.sequence.scoreLine, { correct, total: order.length })}</p>
          </ResultPanel>
        ) : (
          <div className="flex justify-end">
            <Button onClick={check}>{t.activities.sequence.check}</Button>
          </div>
        )}
      </div>
    </ActivityFrame>
  );
}
