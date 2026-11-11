// /studio/[courseId]/lessons/[lessonId]: lesson text, AI rewrite and the lesson's activities.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { canEditCourse, getCourseOutline } from '@/core/content/queries';
import type { SessionUser } from '@/core/types';
import { buttonClasses, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { ActivityEditor } from '../components/activity-editor';
import { AddActivityPanel } from '../components/add-activity-panel';
import { LessonEditor } from '../components/lesson-editor';

export async function LessonEditorPage({
  user,
  courseId,
  lessonId,
}: {
  user: SessionUser;
  courseId: string;
  lessonId: string;
}) {
  const { locale, t } = await getT();
  const rawCourse = await getCourseOutline(courseId);
  if (!rawCourse || !(await canEditCourse(user, rawCourse))) notFound();
  // Display only: saving an untouched field writes the original English back (see actions).
  const course = localizeContent(rawCourse, locale);
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  const lesson = course.lessons[index];
  if (!lesson) notFound();
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href={`/studio/${course.id}`} className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {course.title}
          </Link>
        }
        title={lesson.title}
        subtitle={fmt(t.studio.lessonEditor.lessonOf, { current: index + 1, total: course.lessons.length })}
        action={
          <>
            {prev ? (
              <Link href={`/studio/${course.id}/lessons/${prev.id}`} className={buttonClasses('secondary', 'sm')}>
                <ArrowLeft className="h-4 w-4" aria-hidden /> {t.studio.lessonEditor.previous}
              </Link>
            ) : null}
            {next ? (
              <Link href={`/studio/${course.id}/lessons/${next.id}`} className={buttonClasses('secondary', 'sm')}>
                {t.studio.lessonEditor.next} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-8">
        {/* key: remount with fresh values when moving between lessons */}
        <LessonEditor
          key={lesson.id}
          lesson={{
            id: lesson.id,
            title: lesson.title,
            estimatedMinutes: lesson.estimatedMinutes,
            content: lesson.content,
          }}
        />

        <section aria-labelledby="activities-heading" className="flex flex-col gap-4">
          <h2 id="activities-heading" className="text-xl font-bold">
            {t.studio.lessonEditor.activities}
          </h2>
          {lesson.activities.length === 0 ? (
            <EmptyState title={t.studio.lessonEditor.emptyTitle}>{t.studio.lessonEditor.emptyBody}</EmptyState>
          ) : (
            lesson.activities.map((activity, i) => (
              <ActivityEditor
                key={activity.id}
                index={i}
                isFirst={i === 0}
                isLast={i === lesson.activities.length - 1}
                activity={{
                  id: activity.id,
                  type: activity.type,
                  title: activity.title,
                  xpReward: activity.xpReward,
                  configJson: JSON.stringify(activity.config, null, 2),
                }}
              />
            ))
          )}
          <AddActivityPanel lessonId={lesson.id} />
        </section>
      </div>
    </div>
  );
}
