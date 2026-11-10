// /review: today's review session plus the full mistake notebook.
import Link from 'next/link';
import { CalendarClock, Layers, Sprout } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import {
  Badge,
  buttonClasses,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
  Stat,
} from '@/components/ui';
import { ReviewSession } from '../components/review-session';
import { boxProgress, MASTERED_BOX } from '../logic';
import { getReviewOverview, type ReviewCard } from '../queries';
import { getT } from '@/i18n';
import type { Translations } from '@/i18n';
import { fmt } from '@/i18n/format';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Same calendar-day math as logic.formatDue(), in the active locale. */
function dueIn(dueAt: Date, now: Date, t: Translations, sameDay = t.review.relative.today): string {
  const days = Math.floor(dueAt.getTime() / DAY_MS) - Math.floor(now.getTime() / DAY_MS);
  if (days <= 0) return sameDay;
  if (days === 1) return t.review.relative.tomorrow;
  return fmt(t.review.relative.inDays, { count: days });
}

export async function ReviewPage({ user }: { user: SessionUser }) {
  const { t } = await getT();

  const data = await getReviewOverview(user.id);
  const now = new Date();
  const hasCards = data.notebook.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.review.title}
        subtitle={t.review.subtitle}
      />

      {!hasCards ? (
        <EmptyState
          title={t.review.nothingToReview}
          mood="happy"
          action={
            <Link href="/courses" className={buttonClasses('secondary', 'sm')}>
              {t.review.browseCourses}
            </Link>
          }
        >
          {fmt(t.review.whenMissQuestion, { count: MASTERED_BOX })}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={t.review.dueNow} value={data.dueCount} icon={<CalendarClock className="h-5 w-5" aria-hidden />} tint="butter" />
            <Stat label={t.review.inRotation} value={data.inRotation} icon={<Layers className="h-5 w-5" aria-hidden />} tint="sky" />
            <Stat label={t.review.mastered} value={data.masteredCount} icon={<Sprout className="h-5 w-5" aria-hidden />} tint="mint" />
          </div>

          {data.session.length > 0 ? (
            <section aria-label={t.review.sessionAria}>
              <ReviewSession
                key={data.session.map((c) => c.id).join(',')}
                cards={data.session.map((c) => ({
                  id: c.id,
                  prompt: c.prompt,
                  options: c.options,
                  wrongAnswer: c.wrongAnswer,
                  courseEmoji: c.course.emoji,
                  courseTitle: c.course.title,
                  lessonTitle: c.lessonTitle,
                }))}
              />
              {data.dueCount > data.session.length ? (
                <p className="mt-2 text-sm text-ink-soft">
                  {fmt(t.review.moreDueAfter, { count: data.dueCount - data.session.length })}
                </p>
              ) : null}
            </section>
          ) : (
            <EmptyState title={t.review.allCaughtUp} mood="cheer">
              {data.nextDueAt
                ? fmt(t.review.nextCardDue, { time: dueIn(data.nextDueAt, now, t) })
                : t.review.everyMastered}
            </EmptyState>
          )}

          <Card>
            <CardHeader
              title={t.review.mistakeNotebook}
              subtitle={t.review.mistakeNotebookSubtitle}
            />
            <CardBody className="flex flex-col gap-5">
              {data.notebook.map(({ course, cards }) => (
                <div key={course.id}>
                  <h4 className="mb-1 flex items-center gap-2 font-display font-bold">
                    <span aria-hidden>{course.emoji}</span> {course.title}
                  </h4>
                  <ul>
                    {cards.map((c) => (
                      <NotebookLine key={c.id} card={c} now={now} />
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

async function NotebookLine({ card, now }: { card: ReviewCard; now: Date }) {
  const { t } = await getT();

  const isDue = !card.masteredAt && card.dueAt.getTime() <= now.getTime();
  const dueLabel = dueIn(card.dueAt, now, t, t.review.relative.laterToday);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line/15 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{card.prompt}</p>
        <Link
          href={`/courses/${card.course.slug}/lessons/${card.lessonId}`}
          className="text-xs text-ink-soft hover:underline"
        >
          {card.lessonTitle} · {card.activityTitle}
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ProgressBar
          value={card.masteredAt ? 100 : boxProgress(card.box)}
          label={t.review.progressToMastered}
          size="sm"
          className="w-20"
        />
        {card.masteredAt ? (
          <Badge tint="mint">{t.review.mastered}</Badge>
        ) : isDue ? (
          <Badge tint="butter">{t.review.dueNow}</Badge>
        ) : (
          <Badge tint="paper">{fmt(t.review.backLater, { time: dueLabel })}</Badge>
        )}
      </div>
    </li>
  );
}
