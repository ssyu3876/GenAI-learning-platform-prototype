import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, Pip } from '@/components/ui';
import { getT } from '@/i18n';
import type { Translations } from '@/i18n';
import { fmt, plural } from '@/i18n/format';
import { getReviewOverview } from '../queries';

const DAY_MS = 24 * 60 * 60 * 1000;

/** "today" / "tomorrow" / "in 3 days", in the active locale (mirrors logic.formatDue). */
function dueIn(dueAt: Date, now: Date, t: Translations): string {
  const days = Math.floor(dueAt.getTime() / DAY_MS) - Math.floor(now.getTime() / DAY_MS);
  if (days <= 0) return t.review.relative.today;
  if (days === 1) return t.review.relative.tomorrow;
  return fmt(t.review.relative.inDays, { count: days });
}

export async function ReviewWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();
  const data = await getReviewOverview(user.id);
  const now = new Date();
  const hasCards = data.notebook.length > 0;

  return (
    <Card tint={data.dueCount > 0 ? 'butter' : 'paper'} className="h-full">
      <CardHeader
        title={t.review.title}
        subtitle={
          hasCards
            ? fmt(t.review.widget.rotation, { rotation: data.inRotation, mastered: data.masteredCount })
            : undefined
        }
      />
      <CardBody className="flex items-center gap-4">
        <Pip mood={data.dueCount > 0 ? 'think' : 'happy'} size={64} />
        <div className="flex min-w-0 flex-col gap-2">
          {data.dueCount > 0 ? (
            <>
              <p className="font-display text-xl font-bold">
                {fmt(plural(data.dueCount, t.review.widget.questionOne, t.review.widget.questionMany), {
                  count: data.dueCount,
                })}
              </p>
              <p className="text-sm text-ink-soft">{t.review.widget.missedHint}</p>
              <Link href="/review" className={buttonClasses('mint', 'sm', 'self-start')}>
                <RotateCcw className="h-4 w-4" aria-hidden /> {t.review.widget.startReview}
              </Link>
            </>
          ) : hasCards ? (
            <p className="text-sm">
              {data.nextDueAt
                ? fmt(t.review.widget.caughtUpDue, { time: dueIn(data.nextDueAt, now, t) })
                : t.review.widget.caughtUpMastered}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">{t.review.widget.emptyHint}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
