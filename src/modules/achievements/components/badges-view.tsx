import type { SessionUser } from '@/core/types';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, ProgressBar, Stat, Pip, cn } from '@/components/ui';
import { Flame, Lock, Trophy, Zap } from 'lucide-react';
import { getBadgeStates } from '../queries';
import { GROUP_LABEL, GROUP_ORDER } from '../definitions';
import { GrowthCard } from './growth-card';

/** /badges: the growth journey first, then every badge grouped by why you earn it. */
export async function BadgesView({ user }: { user: SessionUser }) {
  const { snapshot, badges, earnedCount } = await getBadgeStates(user.id);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Progress"
        title="Badges and growth"
        subtitle="Badges mark what you have done. Pip shows how far the practice has taken you."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Badges" value={`${earnedCount} / ${badges.length}`} icon={<Trophy className="h-5 w-5" aria-hidden />} tint="butter" />
        <Stat label="Total XP" value={snapshot.totalXp} icon={<Zap className="h-5 w-5" aria-hidden />} tint="butter" />
        <Stat label="Streak" value={`${snapshot.streak}d`} icon={<Flame className="h-5 w-5" aria-hidden />} tint="coral" />
        <Stat label="Scenarios" value={snapshot.scenariosFinished} tint="lilac" />
      </div>

      <GrowthCard snapshot={snapshot} />

      {GROUP_ORDER.map((group) => {
        const groupBadges = badges.filter((b) => b.def.group === group);
        const earnedHere = groupBadges.filter((b) => b.earned).length;
        return (
          <section key={group}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">{GROUP_LABEL[group]}</h2>
              <span className="text-sm font-semibold text-ink-soft">
                {earnedHere} of {groupBadges.length}
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupBadges.map(({ def, earned, have, need, percent }) => {
                const Icon = def.icon;
                return (
                  <li key={def.id}>
                    <Card tint={earned ? def.tint : 'paper'} className={cn('h-full', !earned && 'opacity-90')}>
                      <div className="flex items-start gap-3 px-4 pt-4">
                        <div
                          className={cn(
                            'grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-line',
                            earned ? 'bg-paper shadow-sticker-sm' : 'bg-cream',
                          )}
                        >
                          {earned ? (
                            <Icon className="h-5 w-5" aria-hidden />
                          ) : (
                            <Lock className="h-4 w-4 text-ink-soft" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-sm font-bold">{def.name}</h3>
                            {earned ? <Badge tint="mint">earned</Badge> : null}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-soft">{def.description}</p>
                        </div>
                      </div>
                      <div className="px-4 pt-3 pb-4">
                        <div className="mb-1 flex justify-between text-[0.7rem] font-semibold text-ink-soft">
                          <span>
                            {earned ? 'Done' : `${have} / ${need}`}
                          </span>
                          {!earned ? <span>{percent}%</span> : null}
                        </div>
                        <ProgressBar
                          value={earned ? 100 : percent}
                          label={`${def.name} progress`}
                          size="sm"
                          tint={earned ? 'mint' : 'butter'}
                        />
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <Card>
        <CardHeader title="Closest to earned" subtitle="Finish one of these next" />
        <CardBody>
          {locked.length === 0 ? (
            <EmptyState title="Every badge is yours" mood="cheer">
              Nothing left to collect. Try a harder scenario, or help someone else get here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...locked]
                .sort((a, b) => b.percent - a.percent)
                .slice(0, 4)
                .map((b) => (
                  <li
                    key={b.def.id}
                    className="flex items-center gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2"
                  >
                    <Pip size={36} mood="think" stage={0} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{b.def.name}</div>
                      <div className="text-xs text-ink-soft">{b.def.description}</div>
                    </div>
                    <div className="shrink-0 text-xs font-bold text-ink-soft">
                      {b.have} / {b.need}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
