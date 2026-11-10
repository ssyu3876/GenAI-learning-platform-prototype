// /studio/[courseId]: course details, lesson list and the publishing panel.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { COURSE_COLORS } from '@/core/content/draft';
import { canEditCourse, getCourseOutline, type CourseOutline } from '@/core/content/queries';
import type { SessionUser } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, EmptyState, Notice, PageHeader } from '@/components/ui';
import { fmt, getT, plural, type Translations } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { addLesson, deleteLesson, moveLesson, setCourseStatus } from '../actions';
import { ActionButton } from '../components/action-button';
import { StatusBadge, VisibilityBadge } from '../components/course-badges';
import { CourseMetaForm } from '../components/course-meta-form';

function lessonsLabel(t: Translations, n: number) {
  return fmt(plural(n, t.studio.common.lessonsOne, t.studio.common.lessonsMany), { count: n });
}

async function LessonList({ course }: { course: CourseOutline }) {
  const { t } = await getT();
  const last = course.lessons.length - 1;
  return (
    <Card>
      <CardHeader
        title={t.studio.course.lessons}
        subtitle={`${lessonsLabel(t, course.lessons.length)} · ${fmt(t.studio.course.aboutMinutes, {
          minutes: course.estimatedMinutes,
        })}`}
        action={
          <ActionButton
            action={addLesson}
            fields={{ courseId: course.id }}
            variant="mint"
            pendingText={t.studio.common.adding}
          >
            <Plus className="h-4 w-4" aria-hidden /> {t.studio.course.addLesson}
          </ActionButton>
        }
      />
      <CardBody>
        {course.lessons.length === 0 ? (
          <EmptyState title={t.studio.course.emptyLessonsTitle}>{t.studio.course.emptyLessonsBody}</EmptyState>
        ) : (
          <ol className="flex flex-col gap-2">
            {course.lessons.map((lesson, i) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-line bg-paper px-3 py-2"
              >
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-butter-soft font-display font-bold"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/studio/${course.id}/lessons/${lesson.id}`}
                    className="font-semibold hover:underline"
                  >
                    <span className="sr-only">{fmt(t.studio.course.lessonSr, { current: i + 1 })}</span>
                    {lesson.title}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {fmt(plural(lesson.activities.length, t.studio.course.lessonMetaOne, t.studio.course.lessonMetaMany), {
                      minutes: lesson.estimatedMinutes,
                      count: lesson.activities.length,
                    })}
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  <ActionButton
                    action={moveLesson}
                    fields={{ lessonId: lesson.id, direction: 'up' }}
                    variant="ghost"
                    disabled={i === 0}
                    ariaLabel={fmt(t.studio.common.moveUp, { title: lesson.title })}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </ActionButton>
                  <ActionButton
                    action={moveLesson}
                    fields={{ lessonId: lesson.id, direction: 'down' }}
                    variant="ghost"
                    disabled={i === last}
                    ariaLabel={fmt(t.studio.common.moveDown, { title: lesson.title })}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </ActionButton>
                  <Link
                    href={`/studio/${course.id}/lessons/${lesson.id}`}
                    className={buttonClasses('secondary', 'sm')}
                    aria-label={fmt(t.studio.common.editItem, { title: lesson.title })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                  <ActionButton
                    action={deleteLesson}
                    fields={{ lessonId: lesson.id }}
                    variant="danger"
                    confirmText={fmt(t.studio.course.deleteLessonConfirm, { title: lesson.title })}
                    ariaLabel={fmt(t.studio.common.deleteItem, { title: lesson.title })}
                    disabled={course.lessons.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </ActionButton>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

async function PublishPanel({ course }: { course: CourseOutline }) {
  const { t } = await getT();
  const fields = (intent: string) => ({ courseId: course.id, intent });
  const isLive = course.status === 'published';
  return (
    <Card tint="sky">
      <CardHeader title={t.studio.publish.title} subtitle={t.studio.publish.subtitle} />
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={course.status} />
          <VisibilityBadge visibility={course.visibility} />
        </div>
        {course.status === 'pending_review' ? <Notice>{t.studio.publish.pendingNotice}</Notice> : null}
        {course.status === 'archived' ? <Notice>{t.studio.publish.archivedNotice}</Notice> : null}

        <div className="flex flex-col items-stretch gap-2">
          {!(isLive && course.visibility === 'class') ? (
            <ActionButton
              action={setCourseStatus}
              fields={fields('publish_class')}
              variant="primary"
              size="md"
              pendingText={t.studio.publish.publishing}
              showMessage
            >
              {t.studio.publish.publishClass}
            </ActionButton>
          ) : null}
          {course.status !== 'pending_review' && !(isLive && course.visibility === 'public') ? (
            <ActionButton
              action={setCourseStatus}
              fields={fields('submit_public')}
              variant="secondary"
              size="md"
              pendingText={t.chrome.common.sending}
              showMessage
            >
              {t.studio.publish.submitPublic}
            </ActionButton>
          ) : null}
          {course.status !== 'draft' ? (
            <ActionButton
              action={setCourseStatus}
              fields={fields('unpublish')}
              variant="secondary"
              pendingText={t.chrome.common.saving}
              showMessage
            >
              {t.studio.publish.unpublish}
            </ActionButton>
          ) : null}
          {course.status !== 'archived' ? (
            <ActionButton
              action={setCourseStatus}
              fields={fields('archive')}
              variant="ghost"
              pendingText={t.studio.publish.archiving}
              confirmText={t.studio.publish.archiveConfirm}
              showMessage
            >
              {t.studio.publish.archive}
            </ActionButton>
          ) : null}
        </div>

        <div className="rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm">
          <p className="font-semibold">{t.studio.publish.courseLink}</p>
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1 break-all text-coral-deep underline underline-offset-2"
          >
            /courses/{course.slug} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </Link>
          <p className="mt-1 text-ink-soft">{t.studio.publish.courseLinkHint}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export async function CourseEditorPage({
  user,
  courseId,
  isDemo,
}: {
  user: SessionUser;
  courseId: string;
  isDemo: boolean;
}) {
  const { locale, t } = await getT();
  const rawCourse = await getCourseOutline(courseId);
  if (!rawCourse || !(await canEditCourse(user, rawCourse))) notFound();
  // Display only: saving an untouched field writes the original English back (see actions).
  const course = localizeContent(rawCourse, locale);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/studio" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.chrome.nav.studio}
          </Link>
        }
        title={
          <span>
            <span aria-hidden>{course.emoji} </span>
            {course.title}
          </span>
        }
        subtitle={course.summary || t.studio.course.summaryPlaceholder}
      />

      {isDemo ? <Notice className="mb-6">{t.studio.course.demoNotice}</Notice> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title={t.studio.course.details} />
            <CardBody>
              <CourseMetaForm
                colors={COURSE_COLORS}
                course={{
                  id: course.id,
                  title: course.title,
                  summary: course.summary,
                  subject: course.subject,
                  level: course.level,
                  audience: course.audience,
                  tags: course.tags,
                  emoji: course.emoji,
                  color: course.color,
                }}
              />
            </CardBody>
          </Card>
          <LessonList course={course} />
        </div>
        <PublishPanel course={course} />
      </div>
    </div>
  );
}
