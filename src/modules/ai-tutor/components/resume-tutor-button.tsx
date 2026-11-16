'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/i18n/client';
import { TUTOR_RESUME_EVENT, type TutorResumePayload } from '../shared';

export function ResumeTutorButton({ payload }: { payload: TutorResumePayload }) {
  const t = useT();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(TUTOR_RESUME_EVENT, { detail: payload }));
      }}
    >
      <MessageCircle className="h-4 w-4" aria-hidden /> {t.aiTutor.historyPage.continue}
    </Button>
  );
}
