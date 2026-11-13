import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { MODULES } from '@/registry/modules';
import { AdminOverviewPage } from '@/modules/admin/pages/overview-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.overview };
}

export default async function Page() {
  await requireUser(['admin']);
  // The build list at the bottom of the overview is the one piece that needs the registry.
  const modules = MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    owner: m.owner ?? null,
    navLabels: (m.navItems ?? []).map((n) => n.label),
    widgetCount: m.homeWidgets?.length ?? 0,
    addonCount: m.shellAddons?.length ?? 0,
  }));
  return <AdminOverviewPage modules={modules} />;
}
