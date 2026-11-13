// /create: "Learn anything" form plus the learner's own generated courses.
import Link from 'next/link';
import type { SessionUser } from '@/core/types';
import { asTint, Card, EmptyState, PageHeader, PipSays, TINT_SOLID } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { localizeContent } from '@/i18n/content';
import { LearnForm } from '../components/learn-form';
import { countCoursesGeneratedToday, DAILY_COURSE_LIMIT, listOwnCourses } from '../queries';

export async function CreatePage({ user }: { user: SessionUser }) {
  const { locale, t } = await getT();

  const [rawOwn, today] = await Promise.all([listOwnCourses(user.id), countCoursesGeneratedToday(user.id)]);
  const own = localizeContent(rawOwn, locale);
  const firstName = user.name.split(' ')[0] ?? user.name;
  const whatCuriousText = fmt(t.selfLearn.curiousAbout, { name: firstName });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={t.selfLearn.title}
        subtitle={t.selfLearn.subtitle}
      />
      <PipSays mood="cheer" size={76}>
        <p className="font-display text-lg font-bold">{whatCuriousText}</p>
        <p className="text-sm text-ink-soft">{t.selfLearn.anythingGoes}</p>
      </PipSays>

      <LearnForm remaining={Math.max(DAILY_COURSE_LIMIT - today, 0)} limit={DAILY_COURSE_LIMIT} />

      <section aria-labelledby="own-courses" className="flex flex-col gap-3">
        <h2 id="own-courses" className="text-xl font-bold">
          {t.selfLearn.yourOwnCourses}
        </h2>
        {own.length === 0 ? (
          <EmptyState title={t.selfLearn.nothingHereYet} mood="happy">
            {t.selfLearn.coursesShowHere}
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {own.map((course) => (
              <li key={course.id}>
                <Card className="flex h-full flex-col p-4">
                  <Link href={`/courses/${course.slug}`} className="flex items-start gap-3 rounded-xl">
                    <span
                      aria-hidden
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-line text-2xl ${TINT_SOLID[asTint(course.color)]}`}
                    >
                      {course.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg leading-tight font-bold">{course.title}</span>
                      <span className="mt-1 block text-sm text-ink-soft">
                        {fmt(course.lessonCount === 1 ? t.selfLearn.lessonCountOne : t.selfLearn.lessonCountMany, {
                          count: course.lessonCount,
                        })}
                      </span>
                    </span>
                  </Link>
                  {course.sessionId ? (
                    <Link
                      href={`/create/feedback/${course.sessionId}`}
                      className="mt-3 inline-flex w-fit items-center gap-1 rounded-pill bg-butter-soft px-2.5 py-1 text-xs font-semibold hover:bg-butter"
                    >
                      {t.selfLearn.reviseCourse}
                    </Link>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
