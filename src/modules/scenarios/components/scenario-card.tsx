import Link from 'next/link';
import { ArrowRight, Flag, Mic, Ship } from 'lucide-react';
import { Badge, buttonClasses, Card, ProgressBar, cn, type Tint } from '@/components/ui';
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
export function ScenarioCard({ data }: { data: ScenarioCardData }) {
  const look = lookFor(data.key);
  const Icon = look.icon;
  const { progress } = data;

  return (
    <Card tint={look.tint} interactive className="flex h-full flex-col">
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-line bg-paper')}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight font-bold">{data.title}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">{data.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-3 pb-5">
        <p className="text-sm text-ink-soft">{data.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tint="paper">{data.meta}</Badge>
          <Badge tint="paper">{data.minutes} min</Badge>
          {progress.completions > 0 ? <Badge tint="mint">Best {progress.best}</Badge> : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
            <span>{progress.label}</span>
            {progress.percent > 0 ? <span>{progress.percent}%</span> : null}
          </div>
          <ProgressBar value={progress.percent} label={`${data.title} progress`} size="sm" />
          <Link
            href={data.href}
            className={buttonClasses(progress.started ? 'secondary' : 'primary', 'sm', 'mt-3 w-full')}
          >
            {progress.started ? 'Continue' : 'Start'} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
}
