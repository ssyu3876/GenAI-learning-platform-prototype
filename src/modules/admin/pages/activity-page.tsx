// /admin/activity: what admins have changed, newest first.
//
// The rows store a stable action key and structured facts, never a rendered sentence: the
// console is bilingual and the reader's language is not known when the row is written.
import { Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { getAuditLog } from '../queries';

/** Actions with no template in the dictionary fall back to the raw key. */
type ActionCopy = Record<string, string>;

export async function AdminActivityPage() {
  const { locale, t } = await getT();
  const rows = await getAuditLog();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const copy = t.admin.activity.actions as unknown as ActionCopy;

  return (
    <div>
      <PageHeader title={t.admin.activity.title} subtitle={t.admin.activity.subtitle} />
      <AdminNav current="/admin/activity" />
      <Card>
        <CardBody className="pt-5">
          {rows.length === 0 ? (
            <EmptyState title={t.admin.activity.emptyTitle}>{t.admin.activity.emptyBody}</EmptyState>
          ) : (
            <ul className="flex flex-col divide-y-2 divide-line/15">
              {rows.map((row) => {
                const template = copy[row.action];
                const role =
                  row.detail && typeof row.detail.to === 'string'
                    ? (t.admin.roles as Record<string, string>)[row.detail.to] ?? row.detail.to
                    : '';
                const sentence = template
                  ? fmt(template, { target: row.targetName, role })
                  : `${row.action} · ${row.targetName}`;
                return (
                  <li key={row.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5 text-sm">
                    <span className="font-semibold">{row.actorName}</span>
                    <span>{sentence}</span>
                    <time
                      dateTime={row.createdAt.toISOString()}
                      className="ml-auto text-xs text-ink-soft tabular-nums"
                    >
                      {row.createdAt.toLocaleString(dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
