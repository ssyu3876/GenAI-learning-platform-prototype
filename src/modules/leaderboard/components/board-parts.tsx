'use client';

// Presentational pieces of the leaderboard: podium, ranked rows, chase card, highlights, race.
import { ArrowDown, ArrowUp, Crown, Flame, Minus, Swords, TrendingUp, Zap } from 'lucide-react';
import { Avatar, Badge, Card, cn, Pip } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt, plural } from '@/i18n/format';
import type { BoardEntry } from '../queries';

export function Movement({ value }: { value: number | null }) {
  const t = useT();
  if (value === null || value === 0) {
    return (
      <span className="inline-flex items-center text-ink-soft" aria-label={t.leaderboard.movement.noChange}>
        <Minus className="h-4 w-4" />
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-sm font-bold', up ? 'text-mint-deep' : 'text-coral-deep')}
      aria-label={up ? fmt(t.leaderboard.movement.up, { value }) : fmt(t.leaderboard.movement.down, { value: -value })}
    >
      {up ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      {Math.abs(value)}
    </span>
  );
}

const PODIUM = [
  { place: 2, height: 'h-24', tint: 'bg-sky', order: 'order-1' },
  { place: 1, height: 'h-32', tint: 'bg-butter', order: 'order-2' },
  { place: 3, height: 'h-16', tint: 'bg-coral', order: 'order-3' },
];

export function Podium({ entries }: { entries: BoardEntry[] }) {
  const t = useT();
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="flex items-end justify-center gap-2 pt-6 sm:gap-4" aria-label={t.leaderboard.podium.topThree}>
      {PODIUM.map(({ place, height, tint, order }) => {
        const e = top[place - 1];
        if (!e) return <div key={place} className={cn('w-24 sm:w-32', order)} />;
        return (
          <div key={place} className={cn('flex w-24 flex-col items-center sm:w-32', order)}>
            {place === 1 ? <Crown className="mb-1 h-6 w-6 text-warning" aria-hidden /> : null}
            <Avatar seed={e.avatarSeed} name={e.name} size={place === 1 ? 64 : 52} className={cn(place === 1 && 'animate-float')} />
            <div className={cn('mt-1 max-w-full truncate text-center font-display font-bold', e.isMe && 'text-coral-deep')}>
              {e.isMe ? t.chrome.common.you : e.name}
            </div>
            <div className="text-xs font-semibold text-ink-soft">
              {e.xp} {t.chrome.common.xp}
            </div>
            <div className={cn('mt-2 grid w-full place-items-center rounded-t-2xl border-2 border-b-0 border-line font-display text-3xl font-bold', height, tint)}>
              {place}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RankRow({ e, maxXp }: { e: BoardEntry; maxXp: number }) {
  const t = useT();
  const levelName = t.chrome.levels[e.levelName as keyof typeof t.chrome.levels] ?? e.levelName;
  return (
    <li
      className={cn(
        'grid grid-cols-[2.5rem_auto_1fr_auto] items-center gap-3 rounded-xl border-2 px-3 py-2 sm:grid-cols-[2.5rem_auto_1fr_8rem_4rem_3rem]',
        e.isMe ? 'border-line bg-butter-soft shadow-sticker-sm' : 'border-transparent bg-paper/70',
      )}
    >
      <span className="text-center font-display text-lg font-bold">{e.rank}</span>
      <Avatar seed={e.avatarSeed} name={e.name} size={36} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-display font-semibold">
            {e.isMe ? fmt(t.leaderboard.rows.nameYou, { name: e.name }) : e.name}
          </span>
          {e.streak >= 3 ? (
            <span
              className="inline-flex items-center gap-0.5 text-xs font-bold text-coral-deep"
              title={fmt(t.leaderboard.rows.streakTitle, { count: e.streak })}
            >
              <Flame className="h-3.5 w-3.5" />
              {e.streak}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-ink-soft">
          {t.chrome.shell.level} {e.level} {levelName}
        </div>
      </div>
      {/* XP bar relative to the leader: makes gaps visible at a glance */}
      <div className="hidden sm:block" aria-hidden>
        <div className="h-3 overflow-hidden rounded-pill border-2 border-line bg-paper">
          <div className="h-full bg-mint" style={{ width: `${maxXp ? Math.max(4, (e.xp / maxXp) * 100) : 0}%` }} />
        </div>
      </div>
      <span className="text-right font-display font-bold whitespace-nowrap">
        {e.xp} {t.chrome.common.xp}
      </span>
      <span className="hidden justify-self-end sm:inline-flex">
        <Movement value={e.movement} />
      </span>
    </li>
  );
}

export function ChaseCard({
  chase,
  periodLabel,
}: {
  chase: {
    me: BoardEntry;
    ahead: BoardEntry | null;
    xpToPass: number | null;
    activitiesToPass: number | null;
    behind: BoardEntry | null;
    lead: number | null;
  };
  periodLabel: string;
}) {
  const t = useT();
  const { me, ahead, xpToPass, activitiesToPass, behind, lead } = chase;
  const moreActivities = activitiesToPass ?? 1;
  return (
    <Card tint="butter" className="p-5">
      <div className="flex items-start gap-4">
        <Pip mood={me.rank === 1 ? 'cheer' : 'wow'} size={64} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-soft">{periodLabel}</div>
          <div className="font-display text-3xl font-bold">
            #{me.rank} <span className="text-lg">{fmt(t.leaderboard.chase.withXp, { xp: me.xp })}</span>
          </div>
          {ahead && xpToPass ? (
            <p className="mt-1">
              <Swords className="mr-1 inline h-4 w-4" aria-hidden />
              <strong>{fmt(t.leaderboard.chase.xpChunk, { xp: xpToPass })}</strong>
              {t.leaderboard.chase.toPass}
              <strong>{ahead.name}</strong>
              {fmt(plural(moreActivities, t.leaderboard.chase.aboutOne, t.leaderboard.chase.aboutMany), {
                count: moreActivities,
              })}
            </p>
          ) : (
            <p className="mt-1 font-semibold">{t.leaderboard.chase.inLead}</p>
          )}
          {behind && lead !== null ? (
            <p className="text-sm text-ink-soft">
              {lead === 0
                ? fmt(t.leaderboard.chase.tied, { name: behind.name })
                : fmt(t.leaderboard.chase.behindXp, { name: behind.name, xp: lead })}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function Highlights({
  highlights,
}: {
  highlights: { climber: BoardEntry | null; streak: BoardEntry | null; busiest: BoardEntry | null };
}) {
  const t = useT();
  const items = [
    highlights.climber && {
      icon: TrendingUp,
      label: t.leaderboard.highlights.climb,
      who: highlights.climber,
      value: `▲ ${highlights.climber.movement}`,
      tint: 'mint' as const,
    },
    highlights.streak && {
      icon: Flame,
      label: t.leaderboard.highlights.streak,
      who: highlights.streak,
      value: fmt(t.leaderboard.highlights.days, { count: highlights.streak.streak }),
      tint: 'coral' as const,
    },
    highlights.busiest && {
      icon: Zap,
      label: t.leaderboard.highlights.activities,
      who: highlights.busiest,
      value: fmt(t.leaderboard.highlights.done, { count: highlights.busiest.activities }),
      tint: 'sky' as const,
    },
  ].filter(Boolean) as { icon: typeof Flame; label: string; who: BoardEntry; value: string; tint: 'mint' | 'coral' | 'sky' }[];
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, label, who, value, tint }) => (
        <Card key={label} tint={tint} className="flex items-center gap-3 p-3">
          <Avatar seed={who.avatarSeed} name={who.name} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-bold text-ink-soft uppercase">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="truncate font-display font-semibold">{who.isMe ? t.chrome.common.you : who.name}</div>
            <Badge tint="paper">{value}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function RaceTrack({
  total,
  lanes,
}: {
  total: number;
  lanes: { userId: string; name: string; avatarSeed: string; done: number; percent: number; isMe: boolean }[];
}) {
  const t = useT();
  return (
    <ol className="flex flex-col gap-2" aria-label={t.leaderboard.views.race}>
      {lanes.map((l, i) => (
        <li key={l.userId} className={cn('rounded-xl border-2 px-3 py-2', l.isMe ? 'border-line bg-butter-soft' : 'border-transparent bg-paper/70')}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-display font-semibold">
              {i + 1}. {l.isMe ? fmt(t.leaderboard.rows.nameYou, { name: l.name }) : l.name}
            </span>
            <span className="font-semibold text-ink-soft">
              {fmt(t.leaderboard.race.lessons, { done: l.done, total })}
              {l.percent === 100 ? ' 🏁' : ''}
            </span>
          </div>
          {/* the lane: dashed track with the avatar sitting at its progress point */}
          <div className="relative h-9" role="img" aria-label={`${l.name}: ${l.percent}%`}>
            <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-line/40" />
            <div className="absolute top-1/2 right-0 h-6 w-1.5 -translate-y-1/2 rounded bg-line/70" />
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700"
              style={{ left: `calc(1rem + (100% - 2rem) * ${l.percent / 100})` }}
            >
              <Avatar seed={l.avatarSeed} name={l.name} size={32} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
