// Status / visibility badges shared by the studio list, editor and home widget.
import type { CourseStatus, CourseVisibility } from '@/core/db/schema';
import { Badge, type Tint } from '@/components/ui';
import { getT, type Locale } from '@/i18n';

const STATUS_TINT: Record<CourseStatus, Tint> = {
  draft: 'paper',
  pending_review: 'butter',
  published: 'mint',
  archived: 'lilac',
};

export async function StatusBadge({ status }: { status: CourseStatus }) {
  const { t } = await getT();
  return <Badge tint={STATUS_TINT[status] ?? STATUS_TINT.draft}>{t.studio.status[status] ?? status}</Badge>;
}

export async function VisibilityBadge({ visibility }: { visibility: CourseVisibility }) {
  const { t } = await getT();
  return <Badge tint="sky">{t.studio.visibility[visibility] ?? visibility}</Badge>;
}

export function formatDate(date: Date, locale: Locale): string {
  return new Date(date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    year: 'numeric',
  });
}
