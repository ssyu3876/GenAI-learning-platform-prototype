'use client';

import { Card, CardBody, Input, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { submitPeerReview } from '../actions';
import type { PeerReviewTarget, PeerReviewView } from '../queries';

export function PeerReviewPanel({
  assignmentId,
  targets,
  reviews,
}: {
  assignmentId: string;
  targets: PeerReviewTarget[];
  reviews: PeerReviewView[];
}) {
  const t = useT();
  if (targets.length === 0) return null;
  return (
    <Card tint="lilac">
      <CardBody className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold">{t.assignments.peerReview.title}</h2>
        <p className="text-sm text-ink-soft">{t.assignments.peerReview.subtitle}</p>
        {targets.map((target) => {
          const review = reviews.find((item) => item.submissionId === target.submissionId);
          return (
            <div key={target.submissionId} className="rounded-xl border-2 border-line/40 bg-paper p-3">
              <p className="font-semibold">{target.studentName}</p>
              {target.textContent ? <p className="mt-2 whitespace-pre-wrap text-sm">{target.textContent}</p> : null}
              {target.fileName ? (
                <a
                  href={`/api/assignments/submissions/${target.submissionId}/file`}
                  className="mt-2 inline-block text-sm font-semibold text-coral-deep underline"
                >
                  {target.fileName}
                </a>
              ) : null}
              <form action={submitPeerReview} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="assignmentId" value={assignmentId} />
                <input type="hidden" name="submissionId" value={target.submissionId} />
                <label className="text-sm font-semibold">
                  {t.assignments.peerReview.score}
                  <Input name="score" type="number" min={0} max={100} defaultValue={review?.score ?? ''} required className="mt-1 w-24" />
                </label>
                <label className="min-w-48 flex-1 text-sm font-semibold">
                  {t.assignments.peerReview.feedback}
                  <Textarea name="feedback" rows={2} defaultValue={review?.feedback ?? ''} className="mt-1 min-h-10" />
                </label>
                <SubmitButton pendingText={t.chrome.common.saving} size="sm">
                  {t.assignments.peerReview.save}
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
