// Home widget for admins: a quick look at the platform with a link to the console.
import Link from 'next/link';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, Stat } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { getAdminOverview } from '../queries';

export async function PlatformWidget(_props: HomeWidgetProps) {
  const { t } = await getT();
  const o = await getAdminOverview();
  const totalUsers = o.usersByRole.learner + o.usersByRole.instructor + o.usersByRole.admin;
  const pending = o.coursesByStatus.pending_review;
  return (
    <Card tint="lilac" className="h-full">
      <CardHeader
        title={t.admin.widget.title}
        subtitle={t.admin.widget.subtitle}
        action={
          <Link href="/admin" className={buttonClasses('secondary', 'sm')}>
            {t.admin.widget.admin}
          </Link>
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat label={t.admin.widget.users} value={totalUsers} />
          <Stat label={t.admin.widget.events7Days} value={o.eventsLast7Days} />
          <Stat label={t.admin.widget.aiCallsToday} value={o.aiToday.real + o.aiToday.mock} />
          <Stat label={t.admin.widget.waitingReview} value={pending} tint={pending ? 'butter' : 'paper'} />
        </div>
        {pending ? (
          <Link href="/admin/courses" className="text-sm font-semibold text-coral-deep underline underline-offset-2">
            {fmt(plural(pending, t.admin.widget.reviewOne, t.admin.widget.reviewMany), { count: pending })}
          </Link>
        ) : null}
      </CardBody>
    </Card>
  );
}
