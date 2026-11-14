// /admin/users: search people by name or email and change their role.
import Form from 'next/form';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Avatar, Button, buttonClasses, Card, CardBody, EmptyState, Input, PageHeader, Select } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { Pager } from '../components/pager';
import { RoleForm } from '../components/role-form';
import { searchUsers, type UserFilters } from '../queries';
import { USER_ROLES } from '@/core/db/schema';

export async function AdminUsersPage({
  user,
  q,
  page,
  role,
  sort,
}: {
  user: SessionUser;
  q: string;
  page: number;
  role?: UserFilters['role'];
  sort?: UserFilters['sort'];
}) {
  const { locale, t } = await getT();
  const result = await searchUsers(q, page, { role, sort });
  const rows = result.rows;
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const formatDate = (d: Date | null): string =>
    d ? d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : t.admin.users.never;

  const exportHref = q ? `/admin/users/export?q=${encodeURIComponent(q)}` : '/admin/users/export';

  return (
    <div>
      <PageHeader title={t.admin.users.title} subtitle={t.admin.users.subtitle} />
      <AdminNav current="/admin/users" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Form action="/admin/users" role="search" className="flex max-w-xl flex-1 gap-2">
          <label htmlFor="user-search" className="sr-only">
            {t.admin.users.searchLabel}
          </label>
          <Input id="user-search" name="q" type="search" defaultValue={q} placeholder={t.admin.users.searchPlaceholder} />
          <label htmlFor="user-role" className="sr-only">{t.admin.users.filterRole}</label>
          <Select id="user-role" name="role" defaultValue={role ?? ""} className="w-36">
            <option value="">{t.admin.users.anyRole}</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>{t.admin.roles[r]}</option>
            ))}
          </Select>
          <label htmlFor="user-sort" className="sr-only">{t.admin.users.sortLabel}</label>
          <Select id="user-sort" name="sort" defaultValue={sort ?? "newest"} className="w-44">
            <option value="newest">{t.admin.users.sortNewest}</option>
            <option value="active">{t.admin.users.sortActive}</option>
          </Select>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" aria-hidden /> {t.chrome.common.search}
          </Button>
        </Form>
        <Link href={exportHref} className={buttonClasses('ghost')} prefetch={false}>
          <Download className="h-4 w-4" aria-hidden /> {t.admin.users.exportCsv}
        </Link>
      </div>
      <Card>
        <CardBody className="pt-5">
          {rows.length === 0 ? (
            <EmptyState title={t.admin.users.emptyTitle}>{t.admin.users.emptyBody}</EmptyState>
          ) : (
            <>
              {q ? (
                <p className="mb-2 text-sm text-ink-soft" role="status">
                  {fmt(plural(result.total, t.admin.users.matchOne, t.admin.users.matchMany), {
                    count: result.total,
                    query: q,
                  })}
                </p>
              ) : null}
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
              <Pager
                basePath="/admin/users"
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                params={{
                  ...(q ? { q } : {}),
                  ...(role ? { role } : {}),
                  ...(sort ? { sort } : {}),
                }}
                labels={t.admin.list}
              />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
