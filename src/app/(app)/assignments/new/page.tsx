import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { NewAssignmentPage } from '@/modules/assignments/pages/new';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.assignments.create.title };
}

export default async function Page() {
  const user = await requireUser(['instructor', 'admin']);
  return <NewAssignmentPage user={user} />;
}
