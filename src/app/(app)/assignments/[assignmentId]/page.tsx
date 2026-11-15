import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AssignmentDetailPage } from '@/modules/assignments/pages/detail';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.assignments.title };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ reminded?: string }>;
}) {
  const user = await requireUser();
  const [{ assignmentId }, query] = await Promise.all([params, searchParams]);
  const reminded = query.reminded ? Number(query.reminded) : undefined;
  return (
    <AssignmentDetailPage
      user={user}
      assignmentId={assignmentId}
      reminded={reminded !== undefined && Number.isFinite(reminded) ? reminded : undefined}
    />
  );
}
