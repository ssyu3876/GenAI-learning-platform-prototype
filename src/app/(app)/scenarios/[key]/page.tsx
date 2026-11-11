import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { ScenarioView } from '@/modules/scenarios/components/scenario-view';
import { getT } from '@/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.scenarios.metadata.scenario };
}

export default async function ScenarioPage({ params }: { params: Promise<{ key: string }> }) {
  const user = await requireUser();
  const { key } = await params;
  return <ScenarioView user={user} scenarioKey={key} />;
}
