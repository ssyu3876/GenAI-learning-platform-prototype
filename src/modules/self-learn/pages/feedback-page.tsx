import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, ChevronLeft, Clock, RotateCcw, Sparkles } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, Card, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { regenerateLesson } from '../actions';
import { getGeneratedCourse, getGenerationSession } from '../queries';
import { CourseFeedbackForm } from '../components/course-feedback-form';

export async function FeedbackPage({
  user,
  sessionId,
  saved,
  revised,
}: {
  user: SessionUser;
  sessionId: string;
  saved?: string;
  revised?: string;
}) {
  const { t } = await getT();
  const session = await getGenerationSession(user.id, sessionId);
  if (!session) notFound();
  if (!session.courseId) redirect(`/create/outline/${session.id}`);
  const generated = await getGeneratedCourse(session);
  if (!generated) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href="/create" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> {t.selfLearn.feedback.back}
      </Link>

      <div>
        <p className="text-sm font-bold text-ink-soft">{t.selfLearn.feedback.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold">{generated.course.title}</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">{generated.course.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tint="paper">
            <Clock className="h-3 w-3" /> {generated.course.estimatedMinutes} {t.courses.page.min}
          </Badge>
          <Badge tint="paper">{t.selfLearn.feedback.lessonsCount.replace('{count}', String(generated.lessons.length))}</Badge>
        </div>
      </div>

      {saved ? <Notice tone="success">{t.selfLearn.feedback.saved}</Notice> : null}
      {revised ? <Notice tone="success">{t.selfLearn.feedback.revised}</Notice> : null}

      <Card tint="mint" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5" /> {t.selfLearn.feedback.readyTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.feedback.readyNote}</p>
        </div>
        <Link
          href={`/courses/${generated.course.slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-line bg-paper px-4 py-2 font-display font-bold shadow-sticker-sm hover:bg-butter-soft"
        >
          {t.selfLearn.feedback.openCourse} <Sparkles className="h-4 w-4" />
        </Link>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-bold">{t.selfLearn.feedback.title}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.feedback.subtitle}</p>
        <div className="mt-4">
          <CourseFeedbackForm sessionId={session.id} />
        </div>
      </Card>

      <section aria-labelledby="feedback-lessons">
        <h2 id="feedback-lessons" className="mb-3 text-xl font-bold">
          {t.selfLearn.feedback.lessonsTitle}
        </h2>
        <div className="flex flex-col gap-3">
          {generated.lessons.map((lesson, index) => (
            <Card key={lesson.id} className="p-4 sm:p-5">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-bold">
                    {fmt(t.selfLearn.feedback.lesson, { number: index + 1 })} · {lesson.title}
                  </span>
                  <Badge tint="paper">
                    <Clock className="h-3 w-3" /> {lesson.estimatedMinutes} {t.courses.page.min}
                  </Badge>
                </summary>
                <form action={regenerateLesson} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <label className="text-sm font-semibold" htmlFor={`comment-${lesson.id}`}>
                    {t.selfLearn.feedback.lessonFeedbackLabel}
                  </label>
                  <textarea
                    id={`comment-${lesson.id}`}
                    name="comment"
                    rows={2}
                    maxLength={800}
                    placeholder={t.selfLearn.feedback.lessonFeedbackPlaceholder}
                    className="w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky"
                  />
                  <SubmitButton variant="butter" size="sm" pendingText={t.selfLearn.feedback.regeneratingLesson}>
                    <RotateCcw className="h-4 w-4" /> {t.selfLearn.feedback.regenerateLesson}
                  </SubmitButton>
                </form>
              </details>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
