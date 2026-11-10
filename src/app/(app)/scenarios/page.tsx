import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { ScenarioHubView } from '@/modules/scenarios/components/hub-view';
import { getT } from '@/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.scenarios.title };
}

export default async function ScenariosPage() {
  const user = await requireUser();
  return <ScenarioHubView user={user} />;
}
