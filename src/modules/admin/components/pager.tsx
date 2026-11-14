// Shared pager for the admin lists. It keeps the current filters in the URL and only moves the
// page number, so a search stays applied while paging.
import Link from 'next/link';
import { buttonClasses } from '@/components/ui';
import { fmt } from '@/i18n';

export interface PagerProps {
  basePath: string;
  page: number;
  pageCount: number;
  total: number;
  /** Query parameters to keep, for example the search term. */
  params?: Record<string, string>;
  labels: { showing: string; pageOf: string; previous: string; next: string };
}

export function Pager({ basePath, page, pageCount, total, params = {}, labels }: PagerProps) {
  if (total === 0) return null;

  const pageSize = Math.max(1, Math.ceil(total / pageCount));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const href = (target: number): string => {
    const search = new URLSearchParams(params);
    if (target > 1) search.set('page', String(target));
    else search.delete('page');
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label={labels.pageOf}
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <span className="text-ink-soft tabular-nums" role="status">
        {fmt(labels.showing, { from, to, total })}
      </span>
      <span className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={buttonClasses('ghost', 'sm')} rel="prev">
            {labels.previous}
          </Link>
        ) : (
          <span className={buttonClasses('ghost', 'sm', 'pointer-events-none opacity-40')} aria-hidden>
            {labels.previous}
          </span>
        )}
        <span className="px-1 text-ink-soft tabular-nums">{fmt(labels.pageOf, { page, pages: pageCount })}</span>
        {page < pageCount ? (
          <Link href={href(page + 1)} className={buttonClasses('ghost', 'sm')} rel="next">
            {labels.next}
          </Link>
        ) : (
          <span className={buttonClasses('ghost', 'sm', 'pointer-events-none opacity-40')} aria-hidden>
            {labels.next}
          </span>
        )}
      </span>
    </nav>
  );
}
