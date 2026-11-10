import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminAiUsagePage } from '@/modules/admin/pages/ai-usage-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.aiUsage };
}

export default async function Page() {
  await requireUser(['admin']);
  return <AdminAiUsagePage />;
}
