// /admin/courses: the review queue (pending_review) and a filterable list of every course.
import Form from 'next/form';
import Link from 'next/link';
import { z } from 'zod';
import { Badge, Button, buttonClasses, Card, CardBody, CardHeader, EmptyState, PageHeader, Select, type Tint } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { ReviewButtons } from '../components/review-buttons';
import {
  COURSE_SOURCES,
  COURSE_STATUSES,
  listCourseOwners,
  listCourses,
  listPendingCourses,
  type CourseFilters,
} from '../queries';

const STATUS_TINT: Record<(typeof COURSE_STATUSES)[number], Tint> = {
  draft: 'paper',
  pending_review: 'butter',
  published: 'mint',
  archived: 'coral',
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const filtersSchema = z.object({
  status: z.enum(COURSE_STATUSES).optional().catch(undefined),
  source: z.enum(COURSE_SOURCES).optional().catch(undefined),
  ownerId: z.string().max(40).optional().catch(undefined),
});

export function parseCourseFilters(params: Record<string, string | string[] | undefined>): CourseFilters {
  return filtersSchema.parse({ status: first(params.status), source: first(params.source), ownerId: first(params.owner) });
}

export async function AdminCoursesPage({ filters }: { filters: CourseFilters }) {
  const { locale, t } = await getT();
  const [pending, all, owners] = await Promise.all([listPendingCourses(), listCourses(filters), listCourseOwners()]);
  const isFiltered = Boolean(filters.status || filters.source || filters.ownerId);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const dateLabel = (d: Date) => d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
  const VISIBILITY_LABEL = {
    public: t.admin.visibility.public,
    class: t.admin.visibility.class,
    private: t.admin.visibility.private,
  } as const;

  return (
    <div>
      <PageHeader title={t.admin.courses.title} subtitle={t.admin.courses.subtitle} />
      <AdminNav current="/admin/courses" />

      <section aria-labelledby="queue-heading" className="mb-8">
        <h2 id="queue-heading" className="mb-3 text-xl font-bold">
          {t.admin.courses.reviewQueue} <Badge tint={pending.length ? 'butter' : 'paper'}>{pending.length}</Badge>
        </h2>
        {pending.length === 0 ? (
          <EmptyState title={t.admin.courses.queueEmptyTitle} mood="happy">
            {t.admin.courses.queueEmptyBody}
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((c) => (
              <Card key={c.id} tint="butter">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{c.emoji}</span>
                      {c.title}
                    </span>
                  }
                  subtitle={fmt(t.admin.courses.pendingMeta, {
                    subject: c.subject,
                    lessons: fmt(plural(c.lessonCount, t.admin.courses.lessonsOne, t.admin.courses.lessonsMany), {
                      count: c.lessonCount,
                    }),
                    owner: c.ownerName ?? t.admin.common.unknown,
                  })}
                />
                <CardBody className="flex flex-col gap-3">
                  {c.summary ? <p className="text-sm">{c.summary}</p> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tint="paper">{t.admin.source[c.source]}</Badge>
                    <Link href={`/courses/${c.slug}`} className="text-sm font-semibold underline underline-offset-2">
                      {t.admin.courses.preview}
                    </Link>
                  </div>
                  <ReviewButtons courseId={c.id} title={c.title} />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="mb-3 text-xl font-bold">
          {t.admin.courses.allCourses}
        </h2>
        <Form action="/admin/courses" className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="f-status" className="font-display text-sm font-semibold">{t.admin.courses.filters.status}</label>
            <Select id="f-status" name="status" defaultValue={filters.status ?? ''} className="w-44">
              <option value="">{t.admin.common.anyStatus}</option>
              {COURSE_STATUSES.map((s) => (
                <option key={s} value={s}>{t.admin.status[s]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-source" className="font-display text-sm font-semibold">{t.admin.courses.filters.source}</label>
            <Select id="f-source" name="source" defaultValue={filters.source ?? ''} className="w-44">
              <option value="">{t.admin.common.anySource}</option>
              {COURSE_SOURCES.map((s) => (
                <option key={s} value={s}>{t.admin.source[s]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-owner" className="font-display text-sm font-semibold">{t.admin.courses.filters.owner}</label>
            <Select id="f-owner" name="owner" defaultValue={filters.ownerId ?? ''} className="w-44">
              <option value="">{t.admin.common.anyone}</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">{t.admin.courses.filters.apply}</Button>
          {isFiltered ? (
            <Link href="/admin/courses" className={buttonClasses('ghost')}>{t.admin.courses.filters.clear}</Link>
          ) : null}
        </Form>
        <Card>
          <CardBody className="pt-5">
            {all.length === 0 ? (
              <EmptyState title={t.admin.courses.emptyTitle}>{t.admin.courses.emptyBody}</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead className="font-display text-ink-soft">
                    <tr>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.course}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.status}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.visibility}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.source}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.owner}</th>
                      <th scope="col" className="py-2 pr-3">{t.admin.courses.columns.lessons}</th>
                      <th scope="col" className="py-2">{t.admin.courses.columns.updated}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.map((c) => (
                      <tr key={c.id} className="border-t-2 border-line/15">
                        <td className="py-2.5 pr-3">
                          <Link href={`/courses/${c.slug}`} className="flex items-center gap-2 font-semibold hover:underline">
                            <span aria-hidden>{c.emoji}</span>
                            {c.title}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3"><Badge tint={STATUS_TINT[c.status]}>{t.admin.status[c.status]}</Badge></td>
                        <td className="py-2.5 pr-3 capitalize">
                          {VISIBILITY_LABEL[c.visibility as keyof typeof VISIBILITY_LABEL] ?? c.visibility}
                        </td>
                        <td className="py-2.5 pr-3">{t.admin.source[c.source]}</td>
                        <td className="py-2.5 pr-3">{c.ownerName ?? '–'}</td>
                        <td className="py-2.5 pr-3">{c.lessonCount}</td>
                        <td className="py-2.5">{dateLabel(c.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
