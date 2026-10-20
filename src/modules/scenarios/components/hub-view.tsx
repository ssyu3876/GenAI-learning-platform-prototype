import Link from 'next/link';
import { Compass } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, Card, CardBody, CardHeader, PageHeader, PipSays, Stat } from '@/components/ui';
import { growthStage } from '@/core/progress/xp';
import { getUserStats } from '@/core/progress/service';
import { getScenarioCards, getScenarioStats } from '../queries';
import { ScenarioCard } from './scenario-card';

/** The /scenarios page: two long scenarios, then the interview formats. */
export async function ScenarioHubView({ user }: { user: SessionUser }) {
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
        eyebrow="Practice"
        title="Scenarios"
        subtitle="Longer than an activity and shorter than a project. Your decisions stay with you, and the ending is built from them."
      />

      <PipSays mood={stats.finished > 0 ? 'cheer' : 'happy'} stage={growthStage(userStats.level.level)} size={76}>
        <p className="font-display text-lg font-bold">
          {stats.finished > 0
            ? `You finished ${stats.finished} scenario${stats.finished === 1 ? '' : 's'}. Best score ${stats.best}.`
            : 'Pick one and play it through. Nothing here is graded against other people.'}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          These do not replace the courses. They are where the courses add up.
        </p>
      </PipSays>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Started" value={stats.started} icon={<Compass className="h-5 w-5" aria-hidden />} />
        <Stat label="Finished" value={stats.finished} tint="mint" />
        <Stat label="Best score" value={stats.best} tint="butter" />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Two long scenarios</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {main.map((card) => (
            <ScenarioCard key={card.key} data={card} />
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Practice interviews"
            subtitle="Seven formats. One question at a time, with hints when you stall."
            action={<Badge tint="lilac">Coach</Badge>}
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

      <p className="text-sm text-ink-soft">
        Scenario scores add to your XP, so Pip grows from them too. They are not a hiring tool: nothing here is
        a judgement about you as a person, only about one attempt.
      </p>
    </div>
  );
}
