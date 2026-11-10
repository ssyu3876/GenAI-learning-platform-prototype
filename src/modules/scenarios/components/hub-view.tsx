import Link from 'next/link';
import { Compass } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, Card, CardBody, CardHeader, PageHeader, PipSays, Stat } from '@/components/ui';
import { growthStage } from '@/core/progress/xp';
import { getUserStats } from '@/core/progress/service';
import { getScenarioCards, getScenarioStats } from '../queries';
import { ScenarioCard } from './scenario-card';
import { getT } from '@/i18n';
import { fmt, plural } from '@/i18n/format';

/** The /scenarios page: two long scenarios, then the interview formats. */
export async function ScenarioHubView({ user }: { user: SessionUser }) {
  const { t } = await getT();

  const [cards, stats, userStats] = await Promise.all([
    getScenarioCards(user.id),
    getScenarioStats(user.id),
    getUserStats(user.id),
  ]);
  const main = cards.filter((c) => !c.key.startsWith('interview:'));
  const interviews = cards.filter((c) => c.key.startsWith('interview:'));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t.scenarios.hub.eyebrow}
        title={t.scenarios.title}
        subtitle={t.scenarios.subtitle}
      />

      <PipSays mood={stats.finished > 0 ? 'cheer' : 'happy'} stage={growthStage(userStats.level.level)} size={76}>
        <p className="font-display text-lg font-bold">
          {stats.finished > 0
            ? fmt(plural(stats.finished, t.scenarios.hub.finishedOne, t.scenarios.hub.finishedMany), {
                count: stats.finished,
                best: stats.best,
              })
            : t.scenarios.hub.pipPrompt}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{t.scenarios.hub.pipNote}</p>
      </PipSays>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.scenarios.hub.statStarted} value={stats.started} icon={<Compass className="h-5 w-5" aria-hidden />} />
        <Stat label={t.scenarios.hub.statFinished} value={stats.finished} tint="mint" />
        <Stat label={t.scenarios.hub.statBest} value={stats.best} tint="butter" />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t.scenarios.hub.longScenarios}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {main.map((card) => (
            <ScenarioCard key={card.key} data={card} />
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader
            title={t.scenarios.hub.interviewsTitle}
            subtitle={t.scenarios.hub.interviewsSubtitle}
            action={<Badge tint="lilac">{t.scenarios.hub.coach}</Badge>}
          />
          <CardBody>
            <ul className="grid gap-2 sm:grid-cols-2">
              {interviews.map((card) => (
                <li key={card.key}>
                  <Link
                    href={card.href}
                    className="flex items-center justify-between gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2 shadow-sticker-sm transition-transform hover:-translate-y-0.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{card.title}</span>
                      <span className="block truncate text-xs text-ink-soft">{card.tagline}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ink-soft">{card.progress.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <p className="text-sm text-ink-soft">{t.scenarios.hub.footer}</p>
    </div>
  );
}
