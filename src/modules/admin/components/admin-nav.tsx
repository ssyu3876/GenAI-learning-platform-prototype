// Sub-navigation shared by the admin pages.
import Link from 'next/link';
import { buttonClasses } from '@/components/ui';
import { getT } from '@/i18n';

export const ADMIN_SECTIONS = [
  { href: '/admin', key: 'overview' },
  { href: '/admin/users', key: 'users' },
  { href: '/admin/courses', key: 'courses' },
  { href: '/admin/ai-usage', key: 'aiUsage' },
  { href: '/admin/modules', key: 'modules' },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number]['href'];

export async function AdminNav({ current }: { current: AdminSection }) {
  const { t } = await getT();
  return (
    <nav aria-label={t.admin.nav.label} className="mb-6 flex flex-wrap gap-2">
      {ADMIN_SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={s.href === current ? 'page' : undefined}
          className={buttonClasses(s.href === current ? 'butter' : 'secondary', 'sm')}
        >
          {t.admin.nav[s.key]}
        </Link>
      ))}
    </nav>
  );
}
