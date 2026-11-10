import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, EmptyState, ProgressBar } from '@/components/ui';
import { getScenarioCards } from '../queries';
import { lookFor } from './scenario-card';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';

/** Home widget: the two long scenarios, one line each, with a way in. */
export async function ScenarioHubWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();
  const cards = await getScenarioCards(user.id);
  const main = cards.filter((c) => !c.key.startsWith('interview:'));
  const started = main.some((c) => c.progress.started);

  return (
    <Card className="h-full">
      <CardHeader
        title={t.scenarios.title}
        subtitle={t.scenarios.widget.subtitle}
        action={
          <Link href="/scenarios" className={buttonClasses('ghost', 'sm')}>
            {t.scenarios.widget.all} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <CardBody>
        {!started ? (
          <EmptyState
            title={t.scenarios.widget.emptyTitle}
            mood="think"
            action={
              <Link href="/scenarios" className={buttonClasses('primary', 'sm')}>
                {t.scenarios.widget.pickScenario}
              </Link>
            }
          >
            {t.scenarios.widget.emptyBody}
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
                        <ProgressBar
                          value={card.progress.percent}
                          label={fmt(t.scenarios.card.progressLabel, { title: card.title })}
                          size="sm"
                          tint={look.tint}
                        />
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
