// /admin/activity: what admins have changed, newest first.
//
// The rows store a stable action key and structured facts, never a rendered sentence: the
// console is bilingual and the reader's language is not known when the row is written.
import Form from 'next/form';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Button, buttonClasses, Card, CardBody, EmptyState, Input, PageHeader, Select } from '@/components/ui';
import { getT } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { Pager } from '../components/pager';
import { getAuditLog, listAuditActions, type AuditFilters } from '../queries';
import { auditSentence, type ActionCopy, type RoleNames } from '../sentence';

export async function AdminActivityPage({
  page,
  filters,
}: {
  page: number;
  filters: AuditFilters;
}) {
  const { locale, t } = await getT();
  const [result, actions] = await Promise.all([getAuditLog(page, filters), listAuditActions()]);
  const rows = result.rows;
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const copy = t.admin.activity.actions as unknown as ActionCopy;
  const roles = t.admin.roles as unknown as RoleNames;

  const exportParams = new URLSearchParams();
  if (filters.action) exportParams.set('action', filters.action);
  if (filters.actor) exportParams.set('actor', filters.actor);
  if (filters.since) exportParams.set('since', filters.since);
  const exportHref = exportParams.size
    ? `/admin/activity/export?${exportParams.toString()}`
    : '/admin/activity/export';

  const filterParams = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.actor ? { actor: filters.actor } : {}),
    ...(filters.since ? { since: filters.since } : {}),
  };
  const isFiltered = Object.keys(filterParams).length > 0;

  return (
    <div>
      <PageHeader title={t.admin.activity.title} subtitle={t.admin.activity.subtitle} />
      <AdminNav current="/admin/activity" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Form action="/admin/activity" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="a-action" className="font-display text-sm font-semibold">
              {t.admin.activity.filters.action}
            </label>
            <Select id="a-action" name="action" defaultValue={filters.action ?? ''} className="w-52">
              <option value="">{t.admin.activity.filters.anyAction}</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="a-actor" className="font-display text-sm font-semibold">
              {t.admin.activity.filters.actor}
            </label>
            <Input
              id="a-actor"
              name="actor"
              defaultValue={filters.actor ?? ''}
              placeholder={t.admin.activity.filters.actorPlaceholder}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="a-since" className="font-display text-sm font-semibold">
              {t.admin.activity.filters.period}
            </label>
            <Select id="a-since" name="since" defaultValue={filters.since ?? ''} className="w-40">
              <option value="">{t.admin.activity.filters.anyTime}</option>
              <option value="day">{t.admin.activity.filters.day}</option>
              <option value="week">{t.admin.activity.filters.week}</option>
              <option value="month">{t.admin.activity.filters.month}</option>
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            {t.admin.activity.filters.apply}
          </Button>
          {isFiltered ? (
            <Link href="/admin/activity" className={buttonClasses('ghost')}>
              {t.admin.activity.filters.clear}
            </Link>
          ) : null}
        </Form>
        <Link href={exportHref} className={buttonClasses('ghost')} prefetch={false}>
          <Download className="h-4 w-4" aria-hidden /> {t.admin.activity.exportCsv}
        </Link>
      </div>

      <Card>
        <CardBody className="pt-5">
          {rows.length === 0 ? (
            <EmptyState title={t.admin.activity.emptyTitle}>{t.admin.activity.emptyBody}</EmptyState>
          ) : (
            <ul className="flex flex-col divide-y-2 divide-line/15">
              {rows.map((row) => {
                const sentence = auditSentence(row, copy, roles);
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
          <Pager
            basePath="/admin/activity"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            params={filterParams}
            labels={t.admin.list}
          />
        </CardBody>
      </Card>
    </div>
  );
}
