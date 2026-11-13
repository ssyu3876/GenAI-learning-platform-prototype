import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronLeft, Clock, Link2, ListChecks, Play, RefreshCw } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, Card, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { regenerateSeries, startSeriesPart } from '../actions';
import { getCourseSeries, listSeriesSessions } from '../queries';

export async function SeriesPage({
  user,
  seriesId,
  error,
}: {
  user: SessionUser;
  seriesId: string;
  error?: string;
}) {
  const { t } = await getT();
  const series = await getCourseSeries(user.id, seriesId);
  if (!series) notFound();
  const sessions = await listSeriesSessions(series.id);
  const byPart = new Map(sessions.map((session) => [session.seriesPart, session]));
  const totalMinutes = series.plan.courses.reduce((sum, course) => sum + course.estimatedMinutes, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <Link href="/create" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> {t.selfLearn.series.back}
      </Link>

      <div>
        <p className="text-sm font-bold text-ink-soft">{t.selfLearn.series.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold">{series.plan.title}</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">{series.plan.promise}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tint="mint">
            <Clock className="h-3 w-3" /> {Number((totalMinutes / 60).toFixed(1))} {t.selfLearn.form.customHoursUnit}
          </Badge>
          <Badge tint="paper">
            {fmt(t.selfLearn.series.courseCount, { count: series.plan.courses.length })}
          </Badge>
        </div>
      </div>

      {error === 'order' ? <Notice tone="error">{t.selfLearn.series.orderError}</Notice> : null}
      {error === 'part' ? <Notice tone="error">{t.selfLearn.series.partError}</Notice> : null}

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ListChecks className="h-5 w-5" /> {t.selfLearn.series.outcomesTitle}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {series.plan.outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4">
        {series.plan.courses.map((course, index) => {
          const session = byPart.get(index);
          const previousDone = index === 0 || byPart.get(index - 1)?.status === 'generated';
          return (
            <Card key={`${course.title}-${index}`} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-soft">
                    {fmt(t.selfLearn.series.courseLabel, { number: index + 1 })} · {course.estimatedMinutes} {t.courses.page.min} ·{' '}
                    {fmt(t.selfLearn.series.lessonCount, { count: course.lessonCount })}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold">{course.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{course.focus}</p>
                </div>
                {session?.status === 'generated' ? (
                  <Badge tint="mint">
                    <Check className="h-3 w-3" /> {t.selfLearn.series.done}
                  </Badge>
                ) : session?.status === 'generating' ? (
                  <Badge tint="sky">{t.selfLearn.series.inProgress}</Badge>
                ) : null}
              </div>

              <p className="mt-3 text-sm">{course.promise}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {course.chapters.map((chapter) => (
                  <li key={chapter} className="rounded-pill bg-butter-soft px-2.5 py-1 text-xs font-semibold">
                    {chapter}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-soft">
                <span className="font-semibold">{t.selfLearn.series.relationship}:</span> {course.relationship}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {session?.status === 'generated' ? (
                  <Link
                    href={`/create/feedback/${session.id}`}
                    className="inline-flex items-center gap-2 rounded-pill border-2 border-line bg-paper px-4 py-2 text-sm font-bold shadow-sticker-sm hover:bg-butter-soft"
                  >
                    <Check className="h-4 w-4" /> {t.selfLearn.series.openFeedback}
                  </Link>
                ) : session?.status === 'generating' ? (
                  <Link
                    href={`/create/generate/${session.id}`}
                    className="inline-flex items-center gap-2 rounded-pill border-2 border-line bg-paper px-4 py-2 text-sm font-bold shadow-sticker-sm hover:bg-butter-soft"
                  >
                    <Play className="h-4 w-4" /> {t.selfLearn.series.resume}
                  </Link>
                ) : (
                  <form action={startSeriesPart}>
                    <input type="hidden" name="seriesId" value={series.id} />
                    <input type="hidden" name="part" value={index} />
                    <SubmitButton variant="primary" disabled={!previousDone} pendingText={t.selfLearn.series.starting}>
                      <Play className="h-4 w-4" /> {t.selfLearn.series.startCourse}
                    </SubmitButton>
                  </form>
                )}
                {!previousDone && !session ? <span className="text-xs text-ink-soft">{t.selfLearn.series.afterPrevious}</span> : null}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <RefreshCw className="h-5 w-5" /> {t.selfLearn.series.regenerateTitle}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.series.regenerateNote}</p>
        <form action={regenerateSeries} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="seriesId" value={series.id} />
          <textarea
            name="comment"
            rows={3}
            maxLength={800}
            placeholder={t.selfLearn.series.regeneratePlaceholder}
            className="w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky"
          />
          <SubmitButton variant="butter" pendingText={t.selfLearn.series.regenerating}>
            {t.selfLearn.series.regenerateButton}
          </SubmitButton>
        </form>
      </Card>

      <p className="flex items-center gap-2 text-xs text-ink-soft">
        <Link2 className="h-4 w-4" /> {t.selfLearn.series.footer}
      </p>
    </div>
  );
}
