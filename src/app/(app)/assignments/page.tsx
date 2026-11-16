import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AssignmentsPage } from '@/modules/assignments/pages/list';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.assignments.metadata.title };
}

export default async function Page() {
  const user = await requireUser();
  return <AssignmentsPage user={user} />;
}
