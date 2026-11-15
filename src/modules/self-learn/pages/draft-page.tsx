// /create/draft/[draftId]: resume a saved setup after rejecting public-course matches.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, Notice, PageHeader } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { generateFromDraft } from '../actions';
import { getCourseRequestDraft } from '../queries';
import { formatsForRequest, totalMinutesForRequest } from '../types';

export async function CourseRequestDraftPage({
  user,
  draftId,
  error,
}: {
  user: SessionUser;
  draftId: string;
  error?: string;
}) {
  const { t } = await getT();
  const draft = await getCourseRequestDraft(user.id, draftId);
  if (!draft) notFound();
  const request = draft.request;
  const minutes = totalMinutesForRequest(request);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        eyebrow={
          <Link href="/create" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.selfLearn.title}
          </Link>
        }
        title={t.selfLearn.draft.title}
        subtitle={t.selfLearn.draft.subtitle}
      />
      {error === 'limit' ? <Notice tone="error">{t.selfLearn.outline.limitError}</Notice> : null}
      <Card tint="butter">
        <CardBody className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t.selfLearn.draft.topic}</p>
          <p className="font-display text-2xl font-bold">{request.topic}</p>
          {request.why ? <p className="text-sm text-ink-soft">{request.why}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Badge tint="paper">
              {request.timeBudget === 'custom'
                ? `${Math.round((minutes / 60) * 10) / 10} ${t.selfLearn.form.customHoursUnit}`
                : t.selfLearn.form.timeOptions[request.timeBudget]}
            </Badge>
            {formatsForRequest(request).map((format) => (
              <Badge key={format} tint="sky">
                {t.selfLearn.form.formatChoices[format]}
              </Badge>
            ))}
            <Badge tint="paper">{t.selfLearn.form.assessmentOptions[request.assessment]}</Badge>
          </div>
          <p className="text-sm text-ink-soft">{t.selfLearn.draft.savedNote}</p>
        </CardBody>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <form action={generateFromDraft}>
          <input type="hidden" name="draftId" value={draft.id} />
          <SubmitButton pendingText={t.selfLearn.draft.generating}>
            <Play className="h-4 w-4" aria-hidden /> {t.selfLearn.draft.continue}
          </SubmitButton>
        </form>
        <Link href="/create" className={buttonClasses('ghost', 'sm')}>
          <RotateCcw className="h-4 w-4" aria-hidden /> {t.selfLearn.draft.refill}
        </Link>
      </div>
    </div>
  );
}
