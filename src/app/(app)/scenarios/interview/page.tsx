import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { InterviewView } from '@/modules/scenarios/components/interview-view';
import { getT } from '@/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.scenarios.metadata.interview };
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const { type } = await searchParams;
  return <InterviewView user={user} typeId={type} />;
}
