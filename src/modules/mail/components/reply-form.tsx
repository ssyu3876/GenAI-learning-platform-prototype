'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Card, CardBody, Notice, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { sendReply } from '../actions';

export function ReplyForm({ messageId }: { messageId: string }) {
  const t = useT();
  const router = useRouter();
  const [state, formAction] = useActionState(sendReply, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card tint="sky">
      <CardBody>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="messageId" value={messageId} />
          <h3 className="font-display text-lg font-bold">{t.mail.reply}</h3>
          {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
          {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
          <Textarea name="body" required maxLength={5000} rows={4} placeholder={t.mail.replyPlaceholder} />
          <div>
            <SubmitButton pendingText={t.mail.sendingReply}>
              <Send className="h-4 w-4" aria-hidden /> {t.mail.sendReply}
            </SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
