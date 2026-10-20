import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, EmptyState, ProgressBar } from '@/components/ui';
import { getScenarioCards } from '../queries';
import { lookFor } from './scenario-card';

/** Home widget: the two long scenarios, one line each, with a way in. */
export async function ScenarioHubWidget({ user }: HomeWidgetProps) {
  const cards = await getScenarioCards(user.id);
  const main = cards.filter((c) => !c.key.startsWith('interview:'));
  const started = main.some((c) => c.progress.started);

  return (
    <Card className="h-full">
      <CardHeader
        title="Scenarios"
        subtitle="Practice where your choices carry forward"
        action={
          <Link href="/scenarios" className={buttonClasses('ghost', 'sm')}>
            All <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <CardBody>
        {!started ? (
          <EmptyState
            title="Nothing started yet"
            mood="think"
            action={
              <Link href="/scenarios" className={buttonClasses('primary', 'sm')}>
                Pick a scenario
              </Link>
            }
          >
            Two long-form scenarios: supervise an AI agent, or run a team for three weeks.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {main.map((card) => {
              const look = lookFor(card.key);
              const Icon = look.icon;
              return (
                <li key={card.key}>
                  <Link
                    href={card.href}
                    className="flex items-center gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2 shadow-sticker-sm transition-transform hover:-translate-y-0.5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-line bg-cream">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-semibold">{card.title}</span>
                      <span className="mt-1 block">
                        <ProgressBar value={card.progress.percent} label={`${card.title} progress`} size="sm" tint={look.tint} />
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ink-soft">{card.progress.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
