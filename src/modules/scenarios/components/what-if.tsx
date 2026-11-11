'use client';

// The counterfactual panel under a finished turn: what else the learner could have done, and
// what it would have cost. Kept in the result card so the lesson lands while the choice is
// still fresh. Numbers come from the pure engine, not from the UI.
import { Badge } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import type { ShipAlternative } from '../engine';

export function WhatIfPanel({
  alternatives,
  quality,
  evidenceMinutes,
  evidenceShown,
}: {
  alternatives: ShipAlternative[];
  /** Where the run actually is, which can be lower than the chosen move's ideal. */
  quality: number;
  evidenceMinutes: number;
  evidenceShown: boolean;
}) {
  const t = useT();
  if (alternatives.length < 2) return null;

  const best = alternatives.reduce((a, b) => (b.quality > a.quality ? b : a));
  const chosen = alternatives.find((a) => a.chosen);
  const tookBest = Boolean(chosen?.best) && quality >= best.quality;

  const moveLabel: Record<ShipAlternative['key'], string> = {
    approve: t.scenarios.ship.moveApprove,
    reject: t.scenarios.ship.moveReject,
    repair: t.scenarios.ship.moveRepair,
  };

  let verdict: string;
  if (tookBest) {
    verdict = fmt(t.scenarios.ship.whatIfBest, { quality });
  } else if (chosen?.key === best.key && quality < best.quality) {
    verdict = fmt(t.scenarios.ship.whatIfRightMove, {
      label: moveLabel[best.key],
      best: best.quality,
      quality,
    });
  } else {
    verdict = fmt(t.scenarios.ship.whatIfMissed, {
      quality,
      label: moveLabel[best.key],
      best: best.quality,
    });
  }

  return (
    <div className="rounded-blob border-2 border-dashed border-line/60 bg-paper px-4 py-3">
      <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {t.scenarios.ship.whatIf}
      </div>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {alternatives.map((a) => (
          <li key={a.key} className="flex items-center justify-between gap-3 text-sm">
            <span className={a.best ? 'font-semibold' : 'text-ink-soft'}>{moveLabel[a.key]}</span>
            <span className="flex items-center gap-2">
              {a.best ? <Badge tint="mint">{t.scenarios.ship.bestMove}</Badge> : null}
              <span className="font-display font-bold">{a.quality}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-soft">{verdict}</p>
      {!evidenceShown && evidenceMinutes > 0 ? (
        <p className="mt-1 text-xs text-ink-soft">
          {fmt(t.scenarios.ship.evidenceCost, { minutes: evidenceMinutes })}
        </p>
      ) : null}
    </div>
  );
}
