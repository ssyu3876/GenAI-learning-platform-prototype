import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminActivityPage } from '@/modules/admin/pages/activity-page';
import type { AuditFilters } from '@/modules/admin/queries';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.activity };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; action?: string; actor?: string; since?: string }>;
}) {
  await requireUser(['admin']);
  const { page, action, actor, since } = await searchParams;
  const raw = Array.isArray(page) ? page[0] : page;
  const filters: AuditFilters = {
    action: typeof action === 'string' && action.length <= 60 ? action : undefined,
    actor: typeof actor === 'string' && actor.trim() ? actor.trim().slice(0, 60) : undefined,
    since: since === 'day' || since === 'week' || since === 'month' ? since : undefined,
  };
  return <AdminActivityPage page={Number(raw) || 1} filters={filters} />;
}
