// /mail: inbox, sent, archived and drafts for every signed-in role.
import Link from 'next/link';
import { Archive, FileText, Inbox, Send, Settings2, Trash2 } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, EmptyState, Notice, PageHeader } from '@/components/ui';
import { fmt, getT, type Translations } from '@/i18n';
import { deleteDraft } from '../actions';
import {
  listMailDrafts,
  listMailbox,
  unreadMailCount,
  type MailListItem,
  type Mailbox,
} from '../queries';

type MailTab = Mailbox | 'drafts';

function dateLabel(value: Date, locale: 'en' | 'zh') {
  return value.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function MailRow({ item, locale, t }: { item: MailListItem; locale: 'en' | 'zh'; t: Translations }) {
  const unread = item.direction === 'received' && !item.readAt;
  const from = item.direction === 'received' ? t.mail.from : t.mail.toLabel;
  return (
    <li>
      <Link href={`/mail/${item.id}`} className="block">
        <Card tint={unread ? 'butter' : 'paper'} interactive className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-paper font-display font-bold">
              {item.correspondent.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {unread ? <span className="h-2.5 w-2.5 rounded-full bg-coral" aria-label={t.mail.unread} /> : null}
                <span className="font-display font-bold">
                  {from}: {item.correspondent.name}
                </span>
                <Badge tint="sky">{t.chrome.shell[item.correspondent.role]}</Badge>
              </div>
              <p className={unread ? 'mt-1 font-semibold' : 'mt-1'}>{item.subject}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.preview}</p>
            </div>
            <time className="shrink-0 text-xs font-semibold text-ink-soft" dateTime={item.createdAt.toISOString()}>
              {dateLabel(item.createdAt, locale)}
            </time>
          </div>
        </Card>
      </Link>
    </li>
  );
}

export async function MailInboxPage({
  user,
  tab,
  sent,
}: {
  user: SessionUser;
  tab: MailTab;
  sent?: boolean;
}) {
  const { locale, t } = await getT();
  const [items, unread, drafts] = await Promise.all([
    tab === 'drafts' ? Promise.resolve([]) : listMailbox(user.id, tab),
    unreadMailCount(user.id),
    tab === 'drafts' ? listMailDrafts(user.id) : Promise.resolve([]),
  ]);
  const empty =
    tab === 'inbox'
      ? t.mail.emptyInbox
      : tab === 'sent'
        ? t.mail.emptySent
        : tab === 'archived'
          ? t.mail.emptyArchived
          : tab === 'trash'
            ? t.mail.emptyTrash
            : t.mail.emptyDrafts;
  const emptyBody =
    tab === 'inbox'
      ? t.mail.emptyInboxBody
      : tab === 'sent'
        ? t.mail.emptySentBody
        : tab === 'archived'
          ? t.mail.emptyArchivedBody
          : tab === 'trash'
            ? t.mail.emptyTrashBody
            : t.mail.emptyDraftsBody;

  return (
    <div>
      <PageHeader
        title={t.mail.title}
        subtitle={t.mail.subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/mail/settings" className={buttonClasses('ghost', 'sm')}>
              <Settings2 className="h-4 w-4" aria-hidden /> {t.mail.settingsLink}
            </Link>
            <Link href="/mail/new" className={buttonClasses('primary')}>
              <Send className="h-4 w-4" aria-hidden /> {t.mail.compose}
            </Link>
          </div>
        }
      />

      {sent ? <Notice tone="success" className="mb-4">{t.mail.sent}</Notice> : null}

      <nav aria-label={t.mail.title} className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/mail" className={buttonClasses(tab === 'inbox' ? 'primary' : 'secondary', 'sm')}>
          <Inbox className="h-4 w-4" aria-hidden /> {t.mail.tabs.inbox}
          {unread > 0 ? <span className="rounded-pill bg-coral px-1.5 text-xs text-paper">{unread}</span> : null}
        </Link>
        <Link href="/mail?tab=sent" className={buttonClasses(tab === 'sent' ? 'primary' : 'secondary', 'sm')}>
          <Send className="h-4 w-4" aria-hidden /> {t.mail.tabs.sent}
        </Link>
        <Link href="/mail?tab=archived" className={buttonClasses(tab === 'archived' ? 'primary' : 'secondary', 'sm')}>
          <Archive className="h-4 w-4" aria-hidden /> {t.mail.tabs.archived}
        </Link>
        <Link href="/mail?tab=trash" className={buttonClasses(tab === 'trash' ? 'primary' : 'secondary', 'sm')}>
          <Trash2 className="h-4 w-4" aria-hidden /> {t.mail.tabs.trash}
        </Link>
        <Link href="/mail?tab=drafts" className={buttonClasses(tab === 'drafts' ? 'primary' : 'secondary', 'sm')}>
          <FileText className="h-4 w-4" aria-hidden /> {t.mail.tabs.drafts}
          {drafts.length > 0 ? <span className="rounded-pill bg-line px-1.5 text-xs text-paper">{drafts.length}</span> : null}
        </Link>
      </nav>

      {tab === 'drafts' ? (
        drafts.length === 0 ? (
          <EmptyState title={empty} mood="happy">
            {emptyBody}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-display font-bold">{draft.subject || t.mail.draft}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {fmt(t.mail.recipientsSelected, {
                        count:
                          draft.recipientIds.length +
                          draft.ccIds.length +
                          draft.bccIds.length +
                          (draft.classId ? 1 : 0),
                      })}{' '}
                      · {dateLabel(draft.updatedAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/mail/new?draft=${draft.id}`} className={buttonClasses('secondary', 'sm')}>
                      <FileText className="h-4 w-4" aria-hidden /> {t.mail.editDraft}
                    </Link>
                    <form action={deleteDraft}>
                      <input type="hidden" name="draftId" value={draft.id} />
                      <button type="submit" className="text-sm font-semibold text-danger underline underline-offset-2">
                        {t.mail.deleteDraft}
                      </button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <EmptyState title={empty} mood="happy">
          {emptyBody}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <MailRow key={item.id} item={item} locale={locale} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}
