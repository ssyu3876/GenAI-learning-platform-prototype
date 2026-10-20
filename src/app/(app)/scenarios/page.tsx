import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { ScenarioHubView } from '@/modules/scenarios/components/hub-view';

export const metadata: Metadata = { title: 'Scenarios' };

export default async function ScenariosPage() {
  const user = await requireUser();
  return <ScenarioHubView user={user} />;
}
