import type { SessionUser } from '@/core/types';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PageHeader, PipSays, Stat, buttonClasses } from '@/components/ui';
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
  // A closed format stays in the catalogue but drops out of the picker count.
  const openInterviews = interviews.filter((c) => !c.closed);
  const startedInterviews = openInterviews.filter((c) => c.progress.started).length;
  const dungeon = main.find((c) => c.key === 'agent-dungeon');
  const others = main.filter((c) => c.key !== 'agent-dungeon');

  const interviewCard: ScenarioCardData = {
    key: 'interview',
    title: t.scenarios.hub.interviewsTitle,
    tagline: t.scenarios.interview.pickerSubtitle,
    summary: t.scenarios.hub.interviewsSubtitle,
    meta: fmt(t.scenarios.hub.formats, { count: openInterviews.length }),
    minutes: 10,
    href: '/scenarios/interview',
    closed: openInterviews.length === 0,
    progress: {
      started: startedInterviews > 0,
      label: fmt(t.scenarios.hub.formats, { count: openInterviews.length }),
      percent: Math.round((startedInterviews / Math.max(1, openInterviews.length)) * 100),
      best: Math.max(0, ...openInterviews.map((i) => i.progress.best)),
      completions: openInterviews.reduce((sum, i) => sum + i.progress.completions, 0),
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
          <p className="mt-0.5 text-sm text-ink-soft">{t.scenarios.hub.pipNote}</p>
        </PipSays>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={t.scenarios.hub.statStarted} value={stats.started} icon={<Compass className="h-4 w-4" aria-hidden />} />
        <Stat label={t.scenarios.hub.statFinished} value={stats.finished} tint="mint" />
        <Stat label={t.scenarios.hub.statBest} value={stats.best} tint="butter" />
      </div>

      {dungeon ? (
        <section className="relative overflow-hidden rounded-blob border-2 border-line bg-ink p-5 text-cream shadow-sticker md:grid md:grid-cols-[1fr_17rem] md:items-center md:gap-5">
          <span
            aria-hidden
            className="animate-hero-glow pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-coral/30 blur-2xl"
          />
          <span
            aria-hidden
            className="animate-hero-glow pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-mint/20 blur-2xl [animation-delay:1.5s]"
          />
          <div className="relative">
            <p className="text-sm font-bold tracking-[0.2em] text-cream/60 uppercase">
              {t.scenarios.hub.featured}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{dungeon.title}</h2>
            <p className="mt-1 text-sm text-cream/80">{dungeon.tagline}</p>
            <p className="mt-2 max-w-prose text-sm text-cream/70">{dungeon.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-pill border-2 border-cream/30 px-2.5 py-1 text-sm font-semibold">
                {dungeon.meta}
              </span>
              {dungeon.progress.started ? (
                <span className="rounded-pill border-2 border-cream/30 px-2.5 py-1 text-sm font-semibold">
                  {dungeon.progress.label}
                </span>
              ) : null}
            </div>
            {dungeon.closed ? (
              <span className={buttonClasses('ghost', 'md', 'mt-4 pointer-events-none opacity-60')}>
                {t.scenarios.card.closed}
              </span>
            ) : (
              <Link href={dungeon.href} className={buttonClasses('primary', 'md', 'mt-4')}>
                {t.scenarios.common.start}
              </Link>
            )}
          </div>
          <div className="relative mt-4 grid grid-cols-4 gap-1.5 rounded-blob border-2 border-cream/20 bg-cream/10 p-2.5 md:mt-0">
            {['?', '⚔️', '?', '👑', '?', '🎁', '?', '?', '?', '⚔️', '?', '?', '?', '?', '🏪', '?'].map(
              (cell, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${(i % 7) * 0.25}s` }}
                  className="animate-float-soft grid aspect-square place-items-center rounded-md border-2 border-cream/20 bg-ink/60 text-lg"
                >
                  {cell}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-lg font-bold">{t.scenarios.hub.moreWays}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[...others, interviewCard].map((card) => (
            <ScenarioCard key={card.key} data={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
