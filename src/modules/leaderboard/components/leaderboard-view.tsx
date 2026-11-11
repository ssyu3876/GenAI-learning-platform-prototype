import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Button, Card, cn, EmptyState, Notice, PageHeader } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { localizeContent } from '@/i18n/content';
import { setClassBoard } from '../actions';
import { getBoard, getCourseRace, getPrefs, getRaceCourses, getScopes, PERIODS, type Period } from '../queries';
import { ChaseCard, Highlights, Podium, RaceTrack, RankRow } from './board-parts';
import { LiveRefresh } from './live-refresh';
import { PrivacyForm } from './privacy-form';

interface Params {
  scope?: string;
  period?: string;
  view?: string;
  course?: string;
}

function chip(active: boolean) {
  return cn(
    'rounded-pill border-2 border-line px-3 py-1 text-sm font-semibold whitespace-nowrap',
    active ? 'bg-butter shadow-sticker-sm' : 'bg-paper hover:bg-butter-soft',
  );
}

export async function LeaderboardView({ user, params }: { user: SessionUser; params: Params }) {
  const { locale, t } = await getT();
  const scopeLabel = (scope: { id: string; label: string }) => (scope.id === 'global' ? t.leaderboard.everyone : scope.label);
  const periodLabel = (period: Period) => t.leaderboard.periods[period];

  const scopes = await getScopes(user);
  const scope = scopes.find((s) => s.id === params.scope) ?? scopes[0]!;
  const period: Period = PERIODS.some((p) => p.id === params.period) ? (params.period as Period) : 'week';
  const view = params.view === 'race' ? 'race' : 'xp';
  const href = (patch: Partial<Params>) => {
    const q = new URLSearchParams({ scope: scope.id, period, view, ...(params.course ? { course: params.course } : {}), ...patch } as Record<string, string>);
    return `/leaderboard?${q.toString()}`;
  };
  const hiddenForLearner = scope.isClass && !scope.enabled && user.role === 'learner';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.leaderboard.title}
        subtitle={t.leaderboard.subtitle}
        action={<LiveRefresh />}
      />

      <div className="flex flex-col gap-3">
        <nav aria-label={t.leaderboard.scopesAria} className="flex gap-2 overflow-x-auto pb-1">
          {scopes.map((s) => (
            <Link key={s.id} href={`/leaderboard?scope=${s.id}&period=${period}&view=${view}`} className={chip(s.id === scope.id)} aria-current={s.id === scope.id ? 'page' : undefined}>
              {scopeLabel(s)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ view: 'xp' })} className={chip(view === 'xp')}>
            {t.leaderboard.views.xp}
          </Link>
          <Link href={href({ view: 'race' })} className={chip(view === 'race')}>
            {t.leaderboard.views.race}
          </Link>
          {view === 'xp' ? (
            <span className="ml-auto flex gap-2">
              {PERIODS.map((p) => (
                <Link key={p.id} href={href({ period: p.id })} className={chip(p.id === period)}>
                  {periodLabel(p.id)}
                </Link>
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {scope.canManage ? (
        <Card tint="sky" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">
            <strong>{t.leaderboard.instructor.setting}</strong>{' '}
            {fmt(scope.enabled ? t.leaderboard.instructor.visible : t.leaderboard.instructor.hidden, {
              scope: scopeLabel(scope),
            })}
          </p>
          <form action={setClassBoard}>
            <input type="hidden" name="classId" value={scope.id} />
            <input type="hidden" name="enabled" value={String(!scope.enabled)} />
            <Button type="submit" size="sm" variant="secondary">
              {scope.enabled ? t.leaderboard.instructor.hide : t.leaderboard.instructor.show}
            </Button>
          </form>
        </Card>
      ) : null}

      {hiddenForLearner ? (
        <EmptyState title={t.leaderboard.pausedTitle} mood="sleepy">
          {fmt(t.leaderboard.pausedBody, { everyone: t.leaderboard.everyone })}
        </EmptyState>
      ) : view === 'xp' ? (
        <XpBoard user={user} scope={scope} period={period} periodLabel={periodLabel(period)} scopeLabel={scopeLabel(scope)} />
      ) : (
        <Race
          user={user}
          scope={scope}
          courseId={params.course}
          hrefFor={(course) => href({ course })}
          locale={locale}
          t={t}
        />
      )}

      {user.role === 'learner' ? <Privacy userId={user.id} /> : null}
    </div>
  );
}

async function XpBoard({
  user,
  scope,
  period,
  periodLabel,
  scopeLabel,
}: {
  user: SessionUser;
  scope: Awaited<ReturnType<typeof getScopes>>[number];
  period: Period;
  periodLabel: string;
  scopeLabel: string;
}) {
  const { t } = await getT();
  const board = await getBoard(user, scope, period);
  if (!board.entries.length) {
    return <EmptyState title={t.leaderboard.emptyBoardTitle}>{t.leaderboard.emptyBoardBody}</EmptyState>;
  }
  const maxXp = board.entries[0]?.xp ?? 0;
  const rest = board.entries.slice(3);
  return (
    <div className="flex flex-col gap-5">
      {board.chase && user.role === 'learner' ? (
        <ChaseCard
          chase={board.chase}
          periodLabel={fmt(t.leaderboard.chase.periodLabel, { period: periodLabel, scope: scopeLabel })}
        />
      ) : null}
      <Card className="px-3 pb-4 sm:px-6">
        <Podium entries={board.entries} />
        <div className="h-0.5 rounded bg-line" />
        {rest.length ? (
          <ol className="mt-4 flex flex-col gap-1.5" aria-label={t.leaderboard.rankingsAria}>
            {rest.map((e) => (
              <RankRow key={e.userId} e={e} maxXp={maxXp} />
            ))}
          </ol>
        ) : null}
      </Card>
      <Highlights highlights={board.highlights} />
      {board.me === null && user.role === 'learner' ? (
        <Notice>
          <EyeOff className="mr-1 inline h-4 w-4" /> {t.leaderboard.hiddenNotice}
        </Notice>
      ) : null}
    </div>
  );
}

async function Race({
  user,
  scope,
  courseId,
  hrefFor,
  locale,
  t,
}: {
  user: SessionUser;
  scope: Awaited<ReturnType<typeof getScopes>>[number];
  courseId?: string;
  hrefFor: (courseId: string) => string;
  locale: Awaited<ReturnType<typeof getT>>['locale'];
  t: Awaited<ReturnType<typeof getT>>['t'];
}) {
  const rawOptions = await getRaceCourses(scope);
  if (!rawOptions.length) {
    return <EmptyState title={t.leaderboard.race.emptyTitle}>{t.leaderboard.race.emptyBody}</EmptyState>;
  }
  const options = rawOptions.map((o) => localizeContent(o, locale));
  const current = options.find((o) => o.id === courseId) ?? options[0]!;
  const race = await getCourseRace(user, scope, current.id);
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={t.leaderboard.race.pickCourseAria} className="flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => (
          <Link key={o.id} href={hrefFor(o.id)} className={chip(o.id === current.id)}>
            {o.emoji} {o.title}
          </Link>
        ))}
      </nav>
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {current.emoji} {current.title}
          </h2>
          <span className="text-sm text-ink-soft">{fmt(t.leaderboard.race.racing, { count: race.lanes.length })}</span>
        </div>
        {race.lanes.length ? (
          <RaceTrack total={race.total} lanes={race.lanes} />
        ) : (
          <EmptyState title={t.leaderboard.race.nobodyTitle}>{t.leaderboard.race.nobodyBody}</EmptyState>
        )}
      </Card>
    </div>
  );
}

async function Privacy({ userId }: { userId: string }) {
  const prefs = await getPrefs(userId);
  return <PrivacyForm displayMode={prefs.displayMode} nickname={prefs.nickname} />;
}
