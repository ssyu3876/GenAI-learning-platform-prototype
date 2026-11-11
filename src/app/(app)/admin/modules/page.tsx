import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { MODULES } from '@/registry/modules';
import { AdminModulesPage } from '@/modules/admin/pages/modules-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.modules };
}

export default async function Page() {
  await requireUser(['admin']);
  const modules = MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    owner: m.owner ?? null,
    navLabels: (m.navItems ?? []).map((n) => n.label),
    widgetCount: m.homeWidgets?.length ?? 0,
    addonCount: m.shellAddons?.length ?? 0,
  }));
  return <AdminModulesPage modules={modules} />;
}
