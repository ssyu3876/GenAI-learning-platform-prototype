// Shown instead of a scenario an admin has closed. It is a normal page, not a 404: the
// scenario still exists and the learner's history for it is intact.
import Link from 'next/link';
import { PageHeader, buttonClasses } from '@/components/ui';
import { getT } from '@/i18n';

export async function ClosedNotice() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <PageHeader eyebrow={t.scenarios.title} title={t.scenarios.closed.title} subtitle={t.scenarios.closed.body} />
      <Link href="/scenarios" className={buttonClasses('secondary', 'md', 'self-start')}>
        {t.scenarios.closed.back}
      </Link>
    </div>
  );
}
