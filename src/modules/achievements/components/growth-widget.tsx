import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, CardHeader, Pip, ProgressBar } from '@/components/ui';
import { getBadgeHighlights, growthProgress } from '../queries';

const STAGE_NAME = ['Seed', 'Sprout', 'Seedling', 'Young tree', 'Grove'];

/** Home widget: how Pip is doing, plus the two badges within reach. */
export async function GrowthWidget({ user }: HomeWidgetProps) {
  const { next, earnedCount, total, snapshot } = await getBadgeHighlights(user.id);
  const growth = growthProgress(snapshot);
  const nextName = STAGE_NAME[growth.stage + 1];
  const remaining = growth.to ? Math.max(0, growth.to - snapshot.totalXp) : 0;

  return (
    <Card tint="mint" className="h-full">
      <CardHeader
        title="Your sprout"
        subtitle={`${snapshot.totalXp} XP · ${earnedCount} of ${total} badges`}
        action={
          <Link href="/badges" className={buttonClasses('ghost', 'sm')}>
            Badges <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-line bg-paper shadow-sticker-sm">
            <Pip stage={growth.stage} size={62} float mood={growth.percent >= 90 ? 'cheer' : 'happy'} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-bold">{STAGE_NAME[growth.stage]}</span>
              {nextName ? (
                <span className="text-xs font-semibold text-ink-soft">{remaining} XP to {nextName}</span>
              ) : (
                <span className="text-xs font-semibold text-ink-soft">fully grown</span>
              )}
            </div>
            <div className="mt-1.5">
              <ProgressBar value={growth.percent} label="Growth progress" size="sm" />
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              <Leaf className="mr-1 inline h-3 w-3" aria-hidden />
              {nextName
                ? `A new leaf appears at ${growth.to} XP.`
                : 'Every leaf is out. Nicely done.'}
            </p>
          </div>
        </div>

        {next.length > 0 ? (
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
              Within reach
            </div>
            <ul className="flex flex-col gap-2">
              {next.map((b) => {
                const Icon = b.def.icon;
                return (
                  <li
                    key={b.def.id}
                    className="flex items-center gap-2 rounded-blob border-2 border-line bg-paper px-3 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{b.def.name}</span>
                      <span className="mt-1 block">
                        <ProgressBar value={b.percent} label={`${b.def.name} progress`} size="sm" tint="butter" />
                      </span>
                    </span>
                    <Badge tint="butter" className="shrink-0">
                      {b.have} / {b.need}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
