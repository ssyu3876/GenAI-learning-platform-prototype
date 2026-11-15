import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AssignmentTermPage } from '@/modules/assignments/pages/settings';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.assignments.term.title };
}

export default async function Page() {
  const user = await requireUser(['instructor', 'admin']);
  return <AssignmentTermPage user={user} />;
}
