import { Pip, ProgressBar, Card, CardBody, CardHeader, Badge, cn, type PipStage } from '@/components/ui';
import { Leaf, Lock, Sparkles } from 'lucide-react';
import { getLevel } from '@/core/progress/xp';
import { growthProgress } from '../queries';
import type { BadgeSnapshot } from '../definitions';

const STAGES: Array<{ stage: PipStage; name: string; xp: number; note: string }> = [
  { stage: 0, name: 'Seed', xp: 0, note: 'Just planted' },
  { stage: 1, name: 'Sprout', xp: 100, note: 'First leaf' },
  { stage: 2, name: 'Seedling', xp: 250, note: 'Two leaves' },
  { stage: 3, name: 'Young tree', xp: 900, note: 'Three leaves' },
  { stage: 4, name: 'Grove', xp: 2100, note: 'In flower' },
];

/** The growth journey: XP in, leaves out. Shown on the badges page. */
export function GrowthCard({ snapshot }: { snapshot: BadgeSnapshot }) {
  const level = getLevel(snapshot.totalXp);
  const growth = growthProgress(snapshot);
  const current = STAGES[growth.stage]!;
  const next = STAGES[growth.stage + 1];
  const remaining = next ? Math.max(0, next.xp - snapshot.totalXp) : 0;

  return (
    <Card tint="mint">
      <CardHeader
        title="Pip is growing"
        subtitle={`Level ${level.level}: ${level.name}`}
        action={<Badge tint="paper">{snapshot.totalXp} XP</Badge>}
      />

      <CardBody className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-line bg-paper shadow-sticker">
              <Pip stage={growth.stage} mood={growth.percent >= 90 ? 'cheer' : 'happy'} size={84} float />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="font-display text-xl font-bold">{current.name}</div>
                <div className="text-sm text-ink-soft">{current.note}</div>
              </div>
              {next ? (
                <div className="text-right text-sm font-semibold text-ink-soft">
                  {remaining} XP to {next.name}
                </div>
              ) : (
                <div className="text-right text-sm font-semibold text-ink-soft">Fully grown</div>
              )}
            </div>

            <div className="mt-2">
              <ProgressBar
                value={growth.percent}
                label={next ? `Progress to ${next.name}` : 'Fully grown'}
                tint={growth.percent >= 90 ? 'coral' : 'mint'}
              />
            </div>

            <p className="mt-2 text-sm text-ink-soft">
              {next
                ? 'Every finished activity, lesson, course and scenario adds XP. Pip grows at set thresholds, so the next leaf is always a target you can see.'
                : 'Pip has every leaf. There is nothing left to grow, so the numbers are only there for the leaderboard now.'}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <Leaf className="h-3.5 w-3.5" aria-hidden /> The five stages
          </div>
          <ol className="grid gap-2 sm:grid-cols-5">
            {STAGES.map((s) => {
              const reached = growth.stage >= s.stage;
              const isNow = growth.stage === s.stage;
              return (
                <li
                  key={s.stage}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-blob border-2 border-line px-2 py-3 text-center',
                    isNow ? 'bg-paper shadow-sticker' : reached ? 'bg-paper' : 'bg-cream opacity-70',
                  )}
                >
                  <Pip stage={s.stage} size={40} mood={isNow ? 'happy' : reached ? 'happy' : 'sleepy'} />
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
                    {!reached ? <Lock className="h-3 w-3" aria-hidden /> : null}
                    {s.name}
                  </div>
                  <div className="text-[0.68rem] text-ink-soft">{s.xp} XP</div>
                  {isNow ? (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-pill bg-butter px-2 py-0.5 text-[0.65rem] font-bold">
                      <Sparkles className="h-2.5 w-2.5" aria-hidden /> now
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </CardBody>
    </Card>
  );
}
