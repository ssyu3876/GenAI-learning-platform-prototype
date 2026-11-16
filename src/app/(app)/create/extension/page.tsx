import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { ExtensionPage } from '@/modules/self-learn/pages/extension-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.selfLearn.extension.title };
}

export default async function Page() {
  const user = await requireUser(['learner']);
  return <ExtensionPage user={user} />;
}
