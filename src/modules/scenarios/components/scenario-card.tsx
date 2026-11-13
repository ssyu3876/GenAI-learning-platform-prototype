import Link from 'next/link';
import { ArrowRight, Flag, Mic, Ship } from 'lucide-react';
import { Badge, buttonClasses, Card, ProgressBar, cn, type Tint } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import type { ScenarioCardData } from '../queries';

export const SCENARIO_LOOK: Record<string, { icon: typeof Ship; tint: Tint; solid: string }> = {
  'ship-it': { icon: Ship, tint: 'coral', solid: 'bg-coral' },
  'sprint-zero': { icon: Flag, tint: 'sky', solid: 'bg-sky' },
  interview: { icon: Mic, tint: 'lilac', solid: 'bg-lilac' },
};

export function lookFor(key: string) {
  if (key.startsWith('interview:')) return SCENARIO_LOOK.interview!;
  return SCENARIO_LOOK[key] ?? SCENARIO_LOOK['ship-it']!;
}

/** One scenario, as a sticker card. Used on the hub page and the home widget. */
export async function ScenarioCard({ data }: { data: ScenarioCardData }) {
  const { t } = await getT();
  const look = lookFor(data.key);
  const Icon = look.icon;
  const { progress } = data;

  return (
    <Card tint={look.tint} interactive className="flex h-full flex-col">
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-paper')}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight font-bold">{data.title}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">{data.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-2 pb-4">
        <p className="line-clamp-2 text-sm text-ink-soft">{data.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tint="paper">{data.meta}</Badge>
          <Badge tint="paper">{fmt(t.scenarios.card.minutes, { minutes: data.minutes })}</Badge>
          {progress.completions > 0 ? (
            <Badge tint="mint">{fmt(t.scenarios.card.best, { score: progress.best })}</Badge>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-1 flex justify-between text-sm font-semibold text-ink-soft">
            <span>{progress.label}</span>
            {progress.percent > 0 ? <span>{progress.percent}%</span> : null}
          </div>
          <ProgressBar
            value={progress.percent}
            label={fmt(t.scenarios.card.progressLabel, { title: data.title })}
            size="sm"
          />
          <Link
            href={data.href}
            aria-disabled={data.closed || undefined}
            className={cn(
              buttonClasses(data.closed ? 'ghost' : progress.started ? 'secondary' : 'primary', 'sm', 'mt-2 w-full'),
              data.closed && 'pointer-events-none opacity-60',
            )}
          >
            {data.closed ? t.scenarios.card.closed : progress.started ? t.scenarios.common.continue : t.scenarios.common.start}{' '}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
}
