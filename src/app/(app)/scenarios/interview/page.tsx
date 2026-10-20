import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { InterviewView } from '@/modules/scenarios/components/interview-view';

export const metadata: Metadata = { title: 'Practice interview' };

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const { type } = await searchParams;
  return <InterviewView user={user} typeId={type} />;
}
