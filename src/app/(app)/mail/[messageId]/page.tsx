import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { MailMessagePage } from '@/modules/mail/pages/message';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.mail.metadata.message };
}

export default async function Page({ params }: { params: Promise<{ messageId: string }> }) {
  const user = await requireUser();
  const { messageId } = await params;
  return <MailMessagePage user={user} messageId={messageId} />;
}
