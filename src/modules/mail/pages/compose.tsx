// /mail/new: compose, reply-forward prefill, or continue a draft.
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SessionUser } from '@/core/types';
import { buttonClasses, EmptyState, PageHeader } from '@/components/ui';
import { getT } from '@/i18n';
import { ComposeMailForm, type ComposeDefaults } from '../components/compose-form';
import { getMailDraft, getMailMessage, listMailClasses, listMailRecipients } from '../queries';

export async function ComposeMailPage({
  user,
  draftId,
  forwardId,
}: {
  user: SessionUser;
  draftId?: string;
  forwardId?: string;
}) {
  const { locale, t } = await getT();
  const [recipients, classes] = await Promise.all([listMailRecipients(user.id), listMailClasses(user)]);
  const draft = draftId ? await getMailDraft(user.id, draftId) : null;
  const forward = forwardId ? await getMailMessage(user, forwardId) : null;
  let defaults: ComposeDefaults = {};
  if (draft) {
    defaults = {
      draftId: draft.id,
      recipientIds: draft.recipientIds,
      ccIds: draft.ccIds,
      bccIds: draft.bccIds,
      classId: draft.classId,
      subject: draft.subject,
      body: draft.body,
    };
  } else if (forward) {
    const date = forward.createdAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    defaults = {
      subject: forward.subject.startsWith('Fwd:') ? forward.subject : `Fwd: ${forward.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${forward.sender.name}\nDate: ${date}\n\n${forward.body}`,
    };
  }

  return (
    <div>
      <PageHeader
        title={t.mail.composeTitle}
        subtitle={t.mail.composeSubtitle}
        action={
          <Link href="/mail" className={buttonClasses('ghost', 'sm')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.mail.backToInbox}
          </Link>
        }
      />
      {recipients.length === 0 && classes.length === 0 ? (
        <EmptyState title={t.mail.emptyInbox} mood="happy">
          {t.mail.composeSubtitle}
        </EmptyState>
      ) : (
        <ComposeMailForm recipients={recipients} classes={classes} defaults={defaults} />
      )}
    </div>
  );
}
