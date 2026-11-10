import Link from 'next/link';
import { ChevronRight, Swords } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { Avatar, buttonClasses, Card, CardBody, CardHeader, cn } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { getBoard, getScopes } from '../queries';
import { Movement } from './board-parts';

export async function LeaderboardWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();

  const scopes = await getScopes(user);
  const scope = scopes.find((s) => s.isClass && s.enabled) ?? scopes.find((s) => !s.isClass)!;
  const board = await getBoard(user, scope, 'week');
  const me = board.me;
  // Show the top 3 plus a window around the viewer
  const around = me ? board.entries.filter((e) => Math.abs(e.rank - me.rank) <= 1 && e.rank > 3) : [];
  const rows = [...board.entries.slice(0, 3), ...around];

  return (
    <Card className="h-full">
      <CardHeader
        title={t.leaderboard.periods.week}
        subtitle={scope.label}
        action={
          <Link href={`/leaderboard?scope=${scope.id}`} className={buttonClasses('ghost', 'sm')}>
            {t.leaderboard.widget.fullBoard} <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <CardBody className="flex flex-col gap-3">
        <ol className="flex flex-col gap-1">
          {rows.map((e, i) => (
            <li key={e.userId}>
              {i === 3 && rows[2] && e.rank > rows[2].rank + 1 ? <div className="py-0.5 text-center text-ink-soft" aria-hidden>⋯</div> : null}
              <div className={cn('flex items-center gap-2 rounded-lg px-2 py-1', e.isMe && 'border-2 border-line bg-butter-soft')}>
                <span className="w-6 text-center font-display font-bold">{e.rank}</span>
                <Avatar seed={e.avatarSeed} name={e.name} size={26} />
                <span className="flex-1 truncate text-sm font-semibold">{e.isMe ? t.chrome.common.you : e.name}</span>
                <span className="text-sm font-bold">{e.xp}</span>
                <Movement value={e.movement} />
              </div>
            </li>
          ))}
        </ol>
        {board.chase?.ahead && board.chase.xpToPass ? (
          <p className="rounded-xl border-2 border-dashed border-line/50 px-3 py-2 text-sm">
            <Swords className="mr-1 inline h-4 w-4" aria-hidden />
            {fmt(t.leaderboard.widget.xpToPass, { xp: board.chase.xpToPass })} <strong>{board.chase.ahead.name}</strong>
            {t.leaderboard.widget.oneActivity}
          </p>
        ) : me?.rank === 1 ? (
          <p className="text-sm font-semibold">{t.leaderboard.widget.topOfBoard}</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
