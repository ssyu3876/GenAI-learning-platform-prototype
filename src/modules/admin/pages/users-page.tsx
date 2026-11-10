// /admin/users: search people by name or email and change their role.
import Form from 'next/form';
import { Search } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Avatar, Button, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { RoleForm } from '../components/role-form';
import { searchUsers, USER_LIST_LIMIT } from '../queries';

export async function AdminUsersPage({ user, q }: { user: SessionUser; q: string }) {
  const { locale, t } = await getT();
  const rows = await searchUsers(q);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const formatDate = (d: Date | null): string =>
    d ? d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : t.admin.users.never;

  return (
    <div>
      <PageHeader title={t.admin.users.title} subtitle={t.admin.users.subtitle} />
      <AdminNav current="/admin/users" />
      <Form action="/admin/users" role="search" className="mb-4 flex max-w-xl gap-2">
        <label htmlFor="user-search" className="sr-only">
          {t.admin.users.searchLabel}
        </label>
        <Input id="user-search" name="q" type="search" defaultValue={q} placeholder={t.admin.users.searchPlaceholder} />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" aria-hidden /> {t.chrome.common.search}
        </Button>
      </Form>
      <Card>
        <CardBody className="pt-5">
          {rows.length === 0 ? (
            <EmptyState title={t.admin.users.emptyTitle}>{t.admin.users.emptyBody}</EmptyState>
          ) : (
            <>
              <p className="mb-2 text-sm text-ink-soft" role="status">
                {q
                  ? fmt(plural(rows.length, t.admin.users.matchOne, t.admin.users.matchMany), { count: rows.length, query: q })
                  : fmt(t.admin.users.newest, { count: rows.length })}
                {rows.length === USER_LIST_LIMIT ? fmt(t.admin.users.showingFirst, { limit: USER_LIST_LIMIT }) : ''}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="font-display text-ink-soft">
                    <tr>
                      <th scope="col" className="py-2 pr-3">{t.admin.users.columns.person}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.users.columns.joined}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.users.columns.lastLogin}</th>
                      <th scope="col" className="py-2">{t.admin.users.columns.role}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className="border-t-2 border-line/15 align-top">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar seed={u.avatarSeed} name={u.name} size={32} />
                            <div className="min-w-0">
                              <div className="font-semibold">{u.name}</div>
                              <div className="text-xs text-ink-soft">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">{formatDate(u.createdAt)}</td>
                        <td className="py-2.5 pr-3">{formatDate(u.lastActiveAt)}</td>
                        <td className="py-2.5">
                          <RoleForm userId={u.id} userName={u.name} role={u.role} isSelf={u.id === user.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
