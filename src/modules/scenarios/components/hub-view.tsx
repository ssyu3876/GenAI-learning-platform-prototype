import type { SessionUser } from '@/core/types';
import { Compass } from 'lucide-react';
import { PageHeader, PipSays, Stat } from '@/components/ui';
import { growthStage } from '@/core/progress/xp';
import { getUserStats } from '@/core/progress/service';
import { getScenarioCards, getScenarioStats } from '../queries';
import { ScenarioCard } from './scenario-card';
import { getT } from '@/i18n';
import { fmt, plural } from '@/i18n/format';
import type { ScenarioCardData } from '../queries';

/** The /scenarios page: four cards in a 2x2 grid, interview formats behind one card. */
export async function ScenarioHubView({ user }: { user: SessionUser }) {
  const { t } = await getT();

  const [cards, stats, userStats] = await Promise.all([
    getScenarioCards(user.id),
    getScenarioStats(user.id),
    getUserStats(user.id),
  ]);
  const main = cards.filter((c) => !c.key.startsWith('interview:'));
  const interviews = cards.filter((c) => c.key.startsWith('interview:'));
  const startedInterviews = interviews.filter((c) => c.progress.started).length;

  const interviewCard: ScenarioCardData = {
    key: 'interview',
    title: t.scenarios.hub.interviewsTitle,
    tagline: t.scenarios.interview.pickerSubtitle,
    summary: t.scenarios.hub.interviewsSubtitle,
    meta: fmt(t.scenarios.hub.formats, { count: interviews.length }),
    minutes: 10,
    href: '/scenarios/interview',
    progress: {
      started: startedInterviews > 0,
      label: fmt(t.scenarios.hub.formats, { count: interviews.length }),
      percent: Math.round((startedInterviews / Math.max(1, interviews.length)) * 100),
      best: Math.max(0, ...interviews.map((i) => i.progress.best)),
      completions: interviews.reduce((sum, i) => sum + i.progress.completions, 0),
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={t.scenarios.hub.eyebrow}
        title={t.scenarios.title}
        subtitle={t.scenarios.subtitle}
      />

      <div className="flex items-start gap-3">
        <PipSays mood={stats.finished > 0 ? 'cheer' : 'happy'} stage={growthStage(userStats.level.level)} size={56}>
          <p className="font-display text-sm font-bold sm:text-base">
            {stats.finished > 0
              ? fmt(plural(stats.finished, t.scenarios.hub.finishedOne, t.scenarios.hub.finishedMany), {
                  count: stats.finished,
                  best: stats.best,
                })
              : t.scenarios.hub.pipPrompt}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">{t.scenarios.hub.pipNote}</p>
        </PipSays>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={t.scenarios.hub.statStarted} value={stats.started} icon={<Compass className="h-4 w-4" aria-hidden />} />
        <Stat label={t.scenarios.hub.statFinished} value={stats.finished} tint="mint" />
        <Stat label={t.scenarios.hub.statBest} value={stats.best} tint="butter" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[...main, interviewCard].map((card) => (
          <ScenarioCard key={card.key} data={card} />
        ))}
      </div>
    </div>
  );
}
