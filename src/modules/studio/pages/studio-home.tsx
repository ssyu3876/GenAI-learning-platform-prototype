// /studio: the instructor's own courses plus published courses they can duplicate.
import Link from 'next/link';
import { Copy, Pencil, Plus, Search, WandSparkles } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { asTint, Button, buttonClasses, Card, EmptyState, Input, PageHeader, TINT_SOLID } from '@/components/ui';
import { fmt, getT, plural, type Translations } from '@/i18n';
import { duplicateCourse } from '../actions';
import { ActionButton } from '../components/action-button';
import { formatDate, StatusBadge, VisibilityBadge } from '../components/course-badges';
import { listForkableCourses, listStudioCourses, type StudioCourse } from '../queries';

function CourseEmoji({ course }: { course: StudioCourse }) {
  return (
    <div
      aria-hidden
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-line text-2xl ${TINT_SOLID[asTint(course.color)]}`}
    >
      {course.emoji}
    </div>
  );
}

function lessonsLabel(t: Translations, n: number) {
  return fmt(plural(n, t.studio.common.lessonsOne, t.studio.common.lessonsMany), { count: n });
}

export async function StudioHomePage({ user, q }: { user: SessionUser; q?: string }) {
  const { locale, t } = await getT();
  const query = q?.trim() ?? '';
  const [mine, catalog] = await Promise.all([
    listStudioCourses(user, query),
    query ? Promise.resolve([]) : listForkableCourses(user),
  ]);
  return (
    <div>
      <PageHeader
        title={t.studio.home.title}
        subtitle={user.role === 'admin' ? t.studio.home.subtitleAdmin : t.studio.home.subtitleInstructor}
        action={
          <>
            <Link href="/studio/new?mode=blank" className={buttonClasses('secondary')}>
              <Plus className="h-4 w-4" aria-hidden /> {t.studio.home.newCourse}
            </Link>
            <Link href="/studio/new" className={buttonClasses('primary')}>
              <WandSparkles className="h-4 w-4" aria-hidden /> {t.studio.common.generateWithAi}
            </Link>
          </>
        }
      />

      <form action="/studio" method="get" role="search" className="mt-5 flex flex-wrap items-center gap-2">
        <label htmlFor="studio-search" className="min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">{t.studio.home.searchLabel}</span>
          <Input
            id="studio-search"
            name="q"
            defaultValue={query}
            placeholder={t.studio.home.searchPlaceholder}
            aria-label={t.studio.home.searchLabel}
          />
        </label>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" aria-hidden /> {t.studio.home.searchButton}
        </Button>
        {query ? (
          <Link href="/studio" className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink">
            {t.studio.home.clearSearch}
          </Link>
        ) : null}
      </form>
      {query ? (
        <p className="mt-2 text-sm text-ink-soft">{fmt(t.studio.home.searchResults, { count: mine.length, query })}</p>
      ) : null}

      <section aria-labelledby="my-courses" className="mt-6 flex flex-col gap-3">
        <h2 id="my-courses" className="text-xl font-bold">
          {user.role === 'admin' ? t.studio.home.allStaffCourses : t.studio.home.myCourses}
        </h2>
        {mine.length === 0 ? (
          query ? (
            <EmptyState
              title={t.studio.home.noSearchResults}
              action={
                <Link href="/studio" className={buttonClasses('secondary', 'sm')}>
                  {t.studio.home.clearSearch}
                </Link>
              }
            >
              {t.studio.home.searchHint}
            </EmptyState>
          ) : (
            <EmptyState
              title={t.studio.home.emptyTitle}
              mood="happy"
              action={
                <Link href="/studio/new" className={buttonClasses('primary', 'sm')}>
                  {t.studio.home.emptyAction}
                </Link>
              }
            >
              {t.studio.home.emptyBody}
            </EmptyState>
          )
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {mine.map((course) => (
              <li key={course.id}>
                <Card className="flex h-full items-start gap-3 p-4">
                  <CourseEmoji course={course} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/studio/${course.id}`}
                      className="font-display text-lg leading-tight font-bold hover:underline"
                    >
                      {course.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {course.code ? (
                        <span
                          className="rounded-pill border-2 border-line bg-butter-soft px-2 py-0.5 font-mono text-xs font-bold tracking-widest"
                          title={t.studio.home.courseCode}
                        >
                          #{course.code}
                        </span>
                      ) : null}
                      <StatusBadge status={course.status} />
                      <VisibilityBadge visibility={course.visibility} />
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      {lessonsLabel(t, course.lessonCount)} ·{' '}
                      {fmt(t.studio.home.edited, { date: formatDate(course.updatedAt, locale) })}
                      {course.source === 'ai' ? ` · ${t.studio.home.draftedByPip}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/studio/${course.id}`}
                    className={buttonClasses('secondary', 'sm')}
                    aria-label={fmt(t.studio.home.editCourse, { title: course.title })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden /> {t.chrome.common.edit}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!query ? (
        <section aria-labelledby="catalog" className="mt-10 flex flex-col gap-3">
          <div>
            <h2 id="catalog" className="text-xl font-bold">
              {t.studio.home.catalogTitle}
            </h2>
            <p className="text-sm text-ink-soft">{t.studio.home.catalogSubtitle}</p>
          </div>
          {catalog.length === 0 ? (
            <EmptyState title={t.studio.home.catalogEmptyTitle}>{t.studio.home.catalogEmptyBody}</EmptyState>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {catalog.map((course) => (
                <li key={course.id}>
                  <Card className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <CourseEmoji course={course} />
                      <div className="min-w-0">
                        <Link href={`/courses/${course.slug}`} className="font-display font-bold hover:underline">
                          {course.title}
                        </Link>
                        <p className="text-sm text-ink-soft">
                          {course.subject} · {lessonsLabel(t, course.lessonCount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <ActionButton
                        action={duplicateCourse}
                        fields={{ courseId: course.id }}
                        pendingText={t.studio.common.copying}
                        ariaLabel={fmt(t.studio.home.duplicateCourse, { title: course.title })}
                      >
                        <Copy className="h-4 w-4" aria-hidden /> {t.studio.common.duplicate}
                      </ActionButton>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
