// /library: public course catalogue with search, tags, heat ranking and engagement metrics.
import Link from 'next/link';
import { Flame, Heart, Search, Share2, Star } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { fmt, getT, type Translations } from '@/i18n';
import { getPublicLibrary, type LibraryCourse, type LibrarySort } from '../library';

const SORTS: Array<{ key: LibrarySort; label: keyof ReturnType<typeof labels> }> = [
  { key: 'heat', label: 'heat' },
  { key: 'likes', label: 'likes' },
  { key: 'favorites', label: 'favorites' },
  { key: 'shares', label: 'shares' },
];

function labels(t: Awaited<ReturnType<typeof getT>>['t']) {
  return {
    heat: t.courses.library.sortHeat,
    likes: t.courses.library.sortLikes,
    favorites: t.courses.library.sortFavorites,
    shares: t.courses.library.sortShares,
  };
}

function LibraryCard({ item, t }: { item: LibraryCourse; t: Translations }) {
  return (
    <Link href={`/courses/${item.course.slug}`} className="group block">
      <Card interactive className="flex h-full flex-col p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-line bg-butter-soft text-2xl">
            {item.course.emoji}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <Badge tint="paper">{item.course.subject}</Badge>
              {item.course.source === 'ai' || item.course.source === 'learner_ai' ? (
                <Badge tint="lilac">{t.courses.library.aiGenerated}</Badge>
              ) : null}
            </div>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug">{item.course.title}</h3>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{item.course.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-pill bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft">
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {item.stats.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {fmt(t.courses.library.likes, { count: item.stats.likes })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> {fmt(t.courses.library.shares, { count: item.stats.shares })}
          </span>
          <span>{fmt(t.courses.library.views, { count: item.stats.views })}</span>
        </div>
      </Card>
    </Link>
  );
}

export async function LibraryView({
  user,
  q,
  tag,
  sort,
}: {
  user: SessionUser;
  q?: string;
  tag?: string;
  sort?: LibrarySort;
}) {
  const { t } = await getT();
  const selectedSort: LibrarySort = sort ?? 'heat';
  const data = await getPublicLibrary(user, { q, tag, sort: selectedSort });
  const sortLabels = labels(t);
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (tag) query.set('tag', tag);

  return (
    <div>
      <PageHeader title={t.courses.library.title} subtitle={t.courses.library.subtitle} />
      <div className="mb-5 flex flex-col gap-3">
        <form action="/library" className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="library-search">{t.courses.library.searchPlaceholder}</label>
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <Input
              id="library-search"
              name="q"
              defaultValue={q ?? ''}
              placeholder={t.courses.library.searchPlaceholder}
              className="pl-9"
            />
          </div>
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          {selectedSort !== 'heat' ? <input type="hidden" name="sort" value={selectedSort} /> : null}
          <button type="submit" className={buttonClasses('primary')}>
            {t.courses.library.search}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/library${query.toString() ? `?${query.toString()}` : ''}`}
            className={buttonClasses(tag ? 'ghost' : 'secondary', 'sm')}
          >
            {t.courses.library.allTags}
          </Link>
          {data.tags.map((item) => {
            const next = new URLSearchParams(query);
            next.set('tag', item);
            return (
              <Link
                key={item}
                href={`/library?${next.toString()}`}
                className={buttonClasses(tag === item ? 'secondary' : 'ghost', 'sm')}
              >
                #{item}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{t.courses.library.title}</h2>
            <div className="flex flex-wrap gap-1">
              {SORTS.map(({ key }) => {
                const next = new URLSearchParams(query);
                if (key !== 'heat') next.set('sort', key);
                else next.delete('sort');
                return (
                  <Link
                    key={key}
                    href={`/library?${next.toString()}`}
                    className={buttonClasses(selectedSort === key ? 'secondary' : 'ghost', 'sm')}
                  >
                    {sortLabels[key]}
                  </Link>
                );
              })}
            </div>
          </div>
          {data.courses.length === 0 ? (
            <EmptyState title={t.courses.library.empty} mood="happy">
              {t.courses.library.emptyHint}
            </EmptyState>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {data.courses.map((item) => (
                <li key={item.course.id}>
                  <LibraryCard item={item} t={t} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="library-hot">
          <Card tint="butter">
            <CardBody className="flex flex-col gap-3">
              <h2 id="library-hot" className="flex items-center gap-2 font-display text-lg font-bold">
                <Flame className="h-5 w-5" aria-hidden /> {t.courses.library.hotTitle}
              </h2>
              <p className="text-sm text-ink-soft">{t.courses.library.hotSubtitle}</p>
              <ol className="flex flex-col gap-3">
                {data.hot.map((item, index) => (
                  <li key={item.course.id}>
                    <Link href={`/courses/${item.course.slug}`} className="flex gap-3 rounded-xl p-1 hover:bg-paper">
                      <span className="font-display text-lg font-bold">{index + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{item.course.title}</span>
                        <span className="block text-xs text-ink-soft">
                          {fmt(t.courses.library.views, { count: item.stats.views })} ·{' '}
                          {fmt(t.courses.library.shares, { count: item.stats.shares })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
