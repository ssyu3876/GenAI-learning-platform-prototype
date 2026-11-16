import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AssignmentGradesPage } from '@/modules/assignments/pages/grades';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.assignments.grades.title };
}

export default async function Page() {
  const user = await requireUser(['learner']);
  return <AssignmentGradesPage user={user} />;
}
