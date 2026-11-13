'use client';

import { useActionState } from 'react';
import type { ActionResult } from '@/core/types';
import { Notice, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { saveCourseFeedback } from '../actions';

export function CourseFeedbackForm({ sessionId }: { sessionId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveCourseFeedback, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t.selfLearn.feedback.ratingLabel}
          <Select name="rating" defaultValue="4" disabled={pending}>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t.selfLearn.feedback.difficultyLabel}
          <Select name="difficulty" defaultValue="right" disabled={pending}>
            <option value="too_easy">{t.selfLearn.feedback.difficultyTooEasy}</option>
            <option value="right">{t.selfLearn.feedback.difficultyRight}</option>
            <option value="too_hard">{t.selfLearn.feedback.difficultyTooHard}</option>
          </Select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.selfLearn.feedback.commentLabel}
        <Textarea
          name="comment"
          rows={3}
          maxLength={800}
          placeholder={t.selfLearn.feedback.commentPlaceholder}
          disabled={pending}
        />
      </label>
      <SubmitButton variant="primary" pendingText={t.selfLearn.feedback.saving}>
        {t.selfLearn.feedback.submit}
      </SubmitButton>
    </form>
  );
}
