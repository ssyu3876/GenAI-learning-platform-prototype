'use client';
// Approve / reject buttons for one course in the review queue.

import { useActionState } from 'react';
import { Check, X } from 'lucide-react';
import { Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { approveCourse, rejectCourse } from '../actions';

export function ReviewButtons({ courseId, title }: { courseId: string; title: string }) {
  const t = useT();
  const [approved, approve] = useActionState(approveCourse, null);
  const [rejected, reject] = useActionState(rejectCourse, null);
  const result = approved ?? rejected;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={approve}>
          <input type="hidden" name="courseId" value={courseId} />
          <SubmitButton variant="mint" size="sm" pendingText={t.admin.review.approvePending} aria-label={fmt(t.admin.review.approveLabel, { title })}>
            <Check className="h-4 w-4" aria-hidden /> {t.admin.review.approve}
          </SubmitButton>
        </form>
        <form
          action={reject}
          onSubmit={(e) => {
            if (!window.confirm(fmt(t.admin.review.sendBackConfirm, { title }))) e.preventDefault();
          }}
        >
          <input type="hidden" name="courseId" value={courseId} />
          <SubmitButton variant="danger" size="sm" pendingText={t.admin.review.sendBackPending} aria-label={fmt(t.admin.review.rejectLabel, { title })}>
            <X className="h-4 w-4" aria-hidden /> {t.admin.review.sendBack}
          </SubmitButton>
        </form>
      </div>
      {result ? <Notice tone={result.ok ? 'success' : 'error'}>{result.ok ? result.message : result.error}</Notice> : null}
    </div>
  );
}
