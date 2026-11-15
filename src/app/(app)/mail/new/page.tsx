import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { ComposeMailPage } from '@/modules/mail/pages/compose';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.mail.metadata.compose };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; forward?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  return <ComposeMailPage user={user} draftId={params.draft} forwardId={params.forward} />;
}
