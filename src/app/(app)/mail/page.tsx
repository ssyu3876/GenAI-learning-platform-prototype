import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { MailInboxPage } from '@/modules/mail/pages/inbox';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.mail.metadata.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sent?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const tab =
    params.tab === 'sent' || params.tab === 'archived' || params.tab === 'trash' || params.tab === 'drafts'
      ? params.tab
      : 'inbox';
  return <MailInboxPage user={user} tab={tab} sent={params.sent === '1'} />;
}
