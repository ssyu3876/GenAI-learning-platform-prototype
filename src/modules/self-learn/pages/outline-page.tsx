import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Check, ChevronLeft, Clock, ListChecks, Sparkles } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, Card, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { approveOutline, regenerateOutline } from '../actions';
import { getGenerationSession } from '../queries';
import { totalMinutesForRequest } from '../types';

const ACTIVITY_KEYS = {
  quiz: 'quiz',
  sort: 'sort',
  sequence: 'sequence',
  slides: 'slides',
  coding: 'coding',
  roleplay: 'roleplay',
  'release-run': 'releaseRun',
} as const;

export async function OutlinePage({
  user,
  sessionId,
  error,
}: {
  user: SessionUser;
  sessionId: string;
  error?: string;
}) {
  const { t } = await getT();
  const session = await getGenerationSession(user.id, sessionId);
  if (!session) notFound();
  if (session.status === 'generated' && session.courseId) redirect(`/create/feedback/${session.id}`);
  if (session.status === 'generating' && session.courseId) redirect(`/create/generate/${session.id}`);

  const { outline, request } = session;
  const timeLabel =
    request.timeBudget === 'custom'
      ? `${Number((totalMinutesForRequest(request) / 60).toFixed(1))} ${t.selfLearn.form.customHoursUnit}`
      : t.selfLearn.form.timeOptions[request.timeBudget];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href="/create" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> {t.selfLearn.outline.back}
      </Link>

      <div>
        <p className="text-sm font-bold text-ink-soft">{t.selfLearn.outline.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold">{outline.title}</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">{outline.promise}</p>
      </div>

      {error === 'limit' ? <Notice tone="error">{t.selfLearn.outline.limitError}</Notice> : null}

      <div className="flex flex-wrap gap-2">
        <Badge tint="mint">
          <Clock className="h-3 w-3" /> {timeLabel}
        </Badge>
        <Badge tint="paper">{t.selfLearn.outline.lessonsCount.replace('{count}', String(outline.lessons.length))}</Badge>
        <Badge tint="paper">{t.selfLearn.form.styleOptions[request.explanationStyle]}</Badge>
        <Badge tint="paper">{t.selfLearn.form.formatOptions[request.contentFormat]}</Badge>
        <Badge tint="paper">{t.selfLearn.form.assessmentOptions[request.assessment]}</Badge>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5" /> {t.selfLearn.outline.outcomesTitle}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {outline.outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="outline-lessons">
        <h2 id="outline-lessons" className="mb-3 flex items-center gap-2 text-xl font-bold">
          <ListChecks className="h-5 w-5" /> {t.selfLearn.outline.lessonsTitle}
        </h2>
        <ol className="flex flex-col gap-3">
          {outline.lessons.map((lesson, index) => (
            <li key={`${lesson.title}-${index}`}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink-soft">{fmt(t.selfLearn.outline.lesson, { number: index + 1 })}</p>
                    <h3 className="font-display text-lg font-bold">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{lesson.objective}</p>
                  </div>
                  <Badge tint="paper">
                    <Clock className="h-3 w-3" /> {lesson.estimatedMinutes} {t.courses.page.min}
                  </Badge>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {lesson.keyPoints.map((point) => (
                    <li key={point} className="rounded-pill bg-butter-soft px-2.5 py-1 text-xs font-semibold">
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-ink-soft">
                  {lesson.activityTypes
                    .map((type) => t.activities.types[ACTIVITY_KEYS[type as keyof typeof ACTIVITY_KEYS] ?? 'quiz'])
                    .join(' · ')}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <Card tint="sky" className="p-5">
        <h2 className="text-lg font-bold">{t.selfLearn.outline.assessmentTitle}</h2>
        <p className="mt-1 text-sm">{outline.assessment}</p>
        {outline.videoPlan ? (
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-semibold">{t.selfLearn.outline.videoTitle}:</span> {outline.videoPlan}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold">{t.selfLearn.outline.approveTitle}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.outline.approveNote}</p>
          <form action={approveOutline} className="mt-4">
            <input type="hidden" name="sessionId" value={session.id} />
            <SubmitButton variant="primary" size="lg" pendingText={t.selfLearn.outline.approving}>
              <Sparkles className="h-4 w-4" /> {t.selfLearn.outline.approveButton}
            </SubmitButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold">{t.selfLearn.outline.adjustTitle}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.outline.adjustNote}</p>
          <form action={regenerateOutline} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="sessionId" value={session.id} />
            <textarea
              name="comment"
              rows={3}
              maxLength={800}
              placeholder={t.selfLearn.outline.adjustPlaceholder}
              className="w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky"
            />
            <SubmitButton variant="butter" pendingText={t.selfLearn.outline.regenerating}>
              {t.selfLearn.outline.regenerateButton}
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
