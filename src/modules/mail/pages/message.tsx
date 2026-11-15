// /mail/[messageId]: whole conversation, reply, forward and mailbox actions.
import Link from 'next/link';
import { Archive, ArrowLeft, Download, Forward, Mail, MailOpen, Paperclip } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { getT } from '@/i18n';
import { setMailState } from '../actions';
import { MailDeleteButton } from '../components/delete-button';
import { MailBody } from '../components/mail-body';
import { ReplyForm } from '../components/reply-form';
import { getMailThread } from '../queries';

export async function MailMessagePage({ user, messageId }: { user: SessionUser; messageId: string }) {
  const { locale, t } = await getT();
  const thread = await getMailThread(user, messageId);

  if (!thread) {
    return (
      <div>
        <PageHeader
          title={t.mail.messageNotFound}
          eyebrow={
            <Link href="/mail" className={buttonClasses('ghost', 'sm', '-ml-3')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t.mail.backToInbox}
            </Link>
          }
        />
        <EmptyState title={t.mail.messageNotFound} mood="happy">
          {t.mail.messageNotFoundBody}
        </EmptyState>
      </div>
    );
  }

  const latest = thread.messages[thread.messages.length - 1]!;
  const actionId = thread.messages[0]!.id;
  const unreadId = [...thread.messages].reverse().find((message) => message.isRecipient)?.id ?? actionId;
  const canMarkUnread = thread.messages.some((message) => message.isRecipient);
  const date = (value: Date) =>
    value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const fileSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/mail" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.mail.backToInbox}
          </Link>
        }
        title={thread.subject}
        subtitle={`${t.mail.conversation} · ${thread.messages.length}`}
        action={
          <Link href="/mail/new" className={buttonClasses('primary', 'sm')}>
            <Mail className="h-4 w-4" aria-hidden /> {t.mail.compose}
          </Link>
        }
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-2">
          {thread.state.trashed ? (
            <>
              <form action={setMailState} className="inline-flex">
                <input type="hidden" name="messageId" value={actionId} />
                <button type="submit" name="action" value="restore" className={buttonClasses('secondary', 'sm')}>
                  <MailOpen className="h-4 w-4" aria-hidden /> {t.mail.restore}
                </button>
              </form>
              <MailDeleteButton
                messageId={actionId}
                action="purge"
                label={t.mail.deleteForever}
                title={t.mail.deleteForeverTitle}
                body={t.mail.deleteForeverConfirm}
              />
            </>
          ) : (
            <>
              <form action={setMailState} className="inline-flex">
                <input type="hidden" name="messageId" value={actionId} />
                <button type="submit" name="action" value={thread.state.archived ? 'unarchive' : 'archive'} className={buttonClasses('secondary', 'sm')}>
                  {thread.state.archived ? <MailOpen className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
                  {thread.state.archived ? t.mail.unarchive : t.mail.archive}
                </button>
              </form>
              {canMarkUnread ? (
                <form action={setMailState} className="inline-flex">
                  <input type="hidden" name="messageId" value={unreadId} />
                  <button type="submit" name="action" value="markUnread" className={buttonClasses('ghost', 'sm')}>
                    <Mail className="h-4 w-4" aria-hidden /> {t.mail.markUnread}
                  </button>
                </form>
              ) : null}
              <Link href={`/mail/new?forward=${latest.id}`} className={buttonClasses('ghost', 'sm')}>
                <Forward className="h-4 w-4" aria-hidden /> {t.mail.forward}
              </Link>
              <div className="ml-auto">
                <MailDeleteButton
                  messageId={actionId}
                  action="delete"
                  label={t.mail.trash}
                  title={t.mail.trashTitle}
                  body={t.mail.trashConfirm}
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <ol className="flex flex-col gap-4">
        {thread.messages.map((message) => {
          const mine = message.sender.id === user.id;
          return (
            <li key={message.id}>
              <Card tint={mine ? 'paper' : 'sky'}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line/30 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {mine ? t.mail.toLabel : t.mail.from}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 font-display font-bold">
                        {mine ? message.recipient.name : message.sender.name}
                        <Badge tint={mine ? 'lilac' : 'sky'}>
                          {t.chrome.shell[mine ? message.recipient.role : message.sender.role]}
                        </Badge>
                      </p>
                    </div>
                    <time className="text-xs font-semibold text-ink-soft" dateTime={message.createdAt.toISOString()}>
                      {date(message.createdAt)}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                    <span>
                      <strong>{t.mail.toLabel}:</strong> {message.recipient.name}
                    </span>
                    {message.cc.length > 0 ? (
                      <span>
                        <strong>{t.mail.cc}:</strong> {message.cc.map((person) => person.name).join(', ')}
                      </span>
                    ) : null}
                    {mine && message.bcc.length > 0 ? (
                      <span>
                        <strong>{t.mail.bcc}:</strong> {message.bcc.map((person) => person.name).join(', ')}
                      </span>
                    ) : null}
                  </div>
                  <MailBody body={message.body} />
                  {message.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2 rounded-xl border-2 border-line/30 bg-paper/60 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        <Paperclip className="h-3.5 w-3.5" aria-hidden /> {t.mail.attachments}
                      </p>
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`/api/mail/attachments/${attachment.id}`}
                          className="flex items-center gap-2 text-sm font-semibold text-coral-deep underline underline-offset-2"
                        >
                          <Download className="h-4 w-4 shrink-0" aria-hidden />
                          {attachment.filename}
                          <span className="font-normal text-ink-soft">({fileSize(attachment.size)})</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ol>

      {!thread.state.trashed ? (
        <div className="mt-4">
          <ReplyForm messageId={latest.id} />
        </div>
      ) : null}
    </div>
  );
}
