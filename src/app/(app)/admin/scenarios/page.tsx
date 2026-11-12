import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminNav } from '@/modules/admin/components/admin-nav';
// The panel lives in the scenarios module, which owns the table and the scenario names;
// a module must not import another module, but a route may compose both.
import { ScenarioOps } from '@/modules/scenarios/admin/scenario-ops';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.scenarios };
}

export default async function Page() {
  await requireUser(['admin']);
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t.admin.scenarios.title} subtitle={t.admin.scenarios.subtitle} />
      <AdminNav current="/admin/scenarios" />
      <ScenarioOps />
    </div>
  );
}
