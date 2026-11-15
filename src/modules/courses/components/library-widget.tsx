// Home-page entry point for the public library: search, topics and the current heat top 3.
import Link from 'next/link';
import { Flame, Search } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { buttonClasses, Card, CardBody, Input } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { getPublicLibrary } from '../library';

export async function LibraryWidget({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const data = await getPublicLibrary(user, {});
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold">{t.courses.library.title}</h2>
            <p className="text-sm text-ink-soft">{t.courses.library.subtitle}</p>
          </div>
          <Link href="/library" className={buttonClasses('secondary', 'sm')}>
            {t.courses.library.open}
          </Link>
        </div>
        <form action="/library" className="flex flex-wrap gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <Input name="q" placeholder={t.courses.library.searchPlaceholder} className="pl-9" />
          </div>
          <button type="submit" className={buttonClasses('primary', 'sm')}>
            {t.courses.library.search}
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {data.tags.slice(0, 6).map((tag) => (
            <Link key={tag} href={`/library?tag=${encodeURIComponent(tag)}`} className={buttonClasses('ghost', 'sm')}>
              #{tag}
            </Link>
          ))}
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <Flame className="h-4 w-4" aria-hidden /> {t.courses.library.hotTitle}
          </p>
          <ol className="flex flex-col gap-2">
            {data.hot.slice(0, 3).map((item, index) => (
              <li key={item.course.id}>
                <Link href={`/courses/${item.course.slug}`} className="flex items-center gap-2 rounded-lg p-1 hover:bg-butter-soft">
                  <span className="font-display font-bold">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.course.title}</span>
                  <span className="text-xs text-ink-soft">{fmt(t.courses.library.views, { count: item.stats.views })}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </CardBody>
    </Card>
  );
}
