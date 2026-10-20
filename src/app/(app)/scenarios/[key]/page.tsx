import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { ScenarioView } from '@/modules/scenarios/components/scenario-view';

export const metadata: Metadata = { title: 'Scenario' };

export default async function ScenarioPage({ params }: { params: Promise<{ key: string }> }) {
  const user = await requireUser();
  const { key } = await params;
  return <ScenarioView user={user} scenarioKey={key} />;
}
