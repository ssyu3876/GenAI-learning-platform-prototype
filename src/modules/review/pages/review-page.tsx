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
import { boxProgress, formatDue, MASTERED_BOX } from '../logic';
import { getReviewOverview, type ReviewCard } from '../queries';

export async function ReviewPage({ user }: { user: SessionUser }) {
  const data = await getReviewOverview(user.id);
  const now = new Date();
  const hasCards = data.notebook.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review"
        subtitle="Quiz questions you missed come back here, spaced out over a few days so they stick."
      />

      {!hasCards ? (
        <EmptyState
          title="Nothing to review yet"
          mood="happy"
          action={
            <Link href="/courses" className={buttonClasses('secondary', 'sm')}>
              Browse courses
            </Link>
          }
        >
          When you miss a quiz question, it lands here and comes back a day later, then a few days
          after that, until you get it right {MASTERED_BOX} times in a row.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Due now" value={data.dueCount} icon={<CalendarClock className="h-5 w-5" aria-hidden />} tint="butter" />
            <Stat label="In rotation" value={data.inRotation} icon={<Layers className="h-5 w-5" aria-hidden />} tint="sky" />
            <Stat label="Mastered" value={data.masteredCount} icon={<Sprout className="h-5 w-5" aria-hidden />} tint="mint" />
          </div>

          {data.session.length > 0 ? (
            <section aria-label="Review session">
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
                  {data.dueCount - data.session.length} more due after this round.
                </p>
              ) : null}
            </section>
          ) : (
            <EmptyState title="All caught up" mood="cheer">
              {data.nextDueAt
                ? `Your next card is due ${formatDue(data.nextDueAt, now)}.`
                : 'Every question you missed is mastered. Nice.'}
            </EmptyState>
          )}

          <Card>
            <CardHeader
              title="Mistake notebook"
              subtitle="Every quiz question you missed, and how close it is to mastered."
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

function NotebookLine({ card, now }: { card: ReviewCard; now: Date }) {
  const isDue = !card.masteredAt && card.dueAt.getTime() <= now.getTime();
  const dueLabel = formatDue(card.dueAt, now);
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
          label="Progress towards mastered"
          size="sm"
          className="w-20"
        />
        {card.masteredAt ? (
          <Badge tint="mint">Mastered</Badge>
        ) : isDue ? (
          <Badge tint="butter">Due now</Badge>
        ) : (
          <Badge tint="paper">Back {dueLabel === 'today' ? 'later today' : dueLabel}</Badge>
        )}
      </div>
    </li>
  );
}
