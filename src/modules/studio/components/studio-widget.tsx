// Home widget for instructors and admins: course counts and quick links into the studio.
import Link from 'next/link';
import { Pencil, WandSparkles } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, Stat } from '@/components/ui';
import { getT } from '@/i18n';
import { getStudioOverview } from '../queries';
import { formatDate } from './course-badges';

export async function StudioWidget({ user }: HomeWidgetProps) {
  const { locale, t } = await getT();
  const overview = await getStudioOverview(user);
  return (
    <Card className="h-full">
      <CardHeader
        title={t.studio.home.title}
        subtitle={user.role === 'admin' ? t.studio.home.allStaffCourses : t.studio.widget.subtitle}
      />
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t.studio.widget.drafts} value={overview.drafts} className="px-3" />
          <Stat label={t.studio.status.published} value={overview.published} tint="mint" className="px-3" />
          <Stat label={t.studio.widget.inReview} value={overview.pending} tint="butter" className="px-3" />
        </div>
        {overview.lastEdited ? (
          <p className="text-sm">
            <span className="text-ink-soft">{t.studio.widget.lastEdited}</span>
            <Link href={`/studio/${overview.lastEdited.id}`} className="font-semibold underline underline-offset-2">
              {overview.lastEdited.emoji} {overview.lastEdited.title}
            </Link>
            <span className="text-ink-soft"> · {formatDate(overview.lastEdited.updatedAt, locale)}</span>
          </p>
        ) : (
          <p className="text-sm text-ink-soft">{t.studio.widget.empty}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/studio" className={buttonClasses('secondary', 'sm')}>
            <Pencil className="h-4 w-4" aria-hidden /> {t.studio.widget.openStudio}
          </Link>
          <Link href="/studio/new" className={buttonClasses('mint', 'sm')}>
            <WandSparkles className="h-4 w-4" aria-hidden /> {t.studio.widget.generate}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
