import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { ClassesPage } from '@/modules/classes/pages/classes-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.classes.metadata.title };
}

export default async function Page() {
  const user = await requireUser();
  return <ClassesPage user={user} />;
}
