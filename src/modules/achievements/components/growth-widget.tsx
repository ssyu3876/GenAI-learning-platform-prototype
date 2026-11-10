import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, CardHeader, Pip, ProgressBar } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { getBadgeHighlights, growthProgress } from '../queries';

const STAGE_LEVELS = ['Seed', 'Sprout', 'Seedling', 'Young Tree', 'Grove'] as const;

/** Home widget: how Pip is doing, plus the two badges within reach. */
export async function GrowthWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();

  const { next, earnedCount, total, snapshot } = await getBadgeHighlights(user.id);
  const growth = growthProgress(snapshot);
  const nextLevel = STAGE_LEVELS[growth.stage + 1];
  const nextName = nextLevel ? t.chrome.levels[nextLevel] : undefined;
  const remaining = growth.to ? Math.max(0, growth.to - snapshot.totalXp) : 0;

  return (
    <Card tint="mint" className="h-full">
      <CardHeader
        title={t.achievements.widget.title}
        subtitle={fmt(t.achievements.widget.subtitle, { xp: snapshot.totalXp, earned: earnedCount, total })}
        action={
          <Link href="/badges" className={buttonClasses('ghost', 'sm')}>
            {t.achievements.widget.badgesLink} <ArrowRight className="h-4 w-4" aria-hidden />
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
              <span className="font-display text-lg font-bold">{t.chrome.levels[STAGE_LEVELS[growth.stage]]}</span>
              {nextName ? (
                <span className="text-xs font-semibold text-ink-soft">
                  {fmt(t.achievements.remainingToNext, { xp: remaining, next: nextName })}
                </span>
              ) : (
                <span className="text-xs font-semibold text-ink-soft">{t.achievements.widget.fullyGrown}</span>
              )}
            </div>
            <div className="mt-1.5">
              <ProgressBar value={growth.percent} label={t.achievements.widget.growthProgress} size="sm" />
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              <Leaf className="mr-1 inline h-3 w-3" aria-hidden />
              {nextName
                ? fmt(t.achievements.widget.newLeaf, { xp: growth.to ?? 0 })
                : t.achievements.widget.allLeaves}
            </p>
          </div>
        </div>

        {next.length > 0 ? (
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
              {t.achievements.widget.withinReach}
            </div>
            <ul className="flex flex-col gap-2">
              {next.map((b) => {
                const Icon = b.def.icon;
                const name = t.achievements.badges[b.def.id].name;
                return (
                  <li
                    key={b.def.id}
                    className="flex items-center gap-2 rounded-blob border-2 border-line bg-paper px-3 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{name}</span>
                      <span className="mt-1 block">
                        <ProgressBar value={b.percent} label={fmt(t.achievements.badgeProgress, { name })} size="sm" tint="butter" />
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
