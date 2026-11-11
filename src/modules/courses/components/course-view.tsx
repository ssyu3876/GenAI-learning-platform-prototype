import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronLeft, Clock, Lock, Play } from 'lucide-react';
import { getActivityType } from '@/registry/activities';
import type { SessionUser } from '@/core/types';
import { asTint, Badge, buttonClasses, Card, cn, ProgressBar, TINT_SOLID } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import type { Translations } from '@/i18n';
import { startCourse } from '../actions';
import { getCoursePageData } from '../queries';
import { courseDuration } from './duration';

const ACTIVITY_LABEL_KEY: Record<string, keyof Translations['activities']['types']> = {
  slides: 'slides',
  sequence: 'sequence',
  sort: 'sort',
  quiz: 'quiz',
  roleplay: 'roleplay',
  coding: 'coding',
  'release-run': 'releaseRun',
};

export async function CourseView({ user, slug }: { user: SessionUser; slug: string }) {
  const { t } = await getT();

  const data = await getCoursePageData(user, slug);
  if (!data) notFound();
  const { outline, completed, best, enrollment, nextLesson } = data;
  const tint = asTint(outline.color);
  const percent = outline.lessons.length ? Math.round((completed.size / outline.lessons.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/courses" className="flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> {t.courses.page.allCourses}
      </Link>

      <Card tint={tint} className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl border-2 border-line text-5xl shadow-sticker-sm ${TINT_SOLID[tint]}`} aria-hidden>
            {outline.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-soft">{outline.subject}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{outline.title}</h1>
            <p className="mt-2 max-w-2xl">{outline.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tint="paper">
                {outline.lessons.length} {t.chrome.common.lessons}
              </Badge>
              <Badge tint="paper">
                <Clock className="h-3 w-3" /> {t.courses.page.about}{courseDuration(outline.estimatedMinutes, t)}
              </Badge>
              {outline.tags.map((tag) => (
                <Badge key={tag} tint="paper">
                  #{tag}
                </Badge>
              ))}
              {outline.status !== 'published' ? (
                <Badge tint="coral">{t.courses.page.status[outline.status] ?? outline.status}</Badge>
              ) : null}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-56">
            {enrollment ? (
              <div className="mb-3">
                <div className="mb-1 text-sm font-semibold">
                  {percent}% {t.courses.page.complete}
                </div>
                <ProgressBar value={percent} label={t.courses.page.courseProgress} />
              </div>
            ) : null}
            {nextLesson ? (
              <form action={startCourse}>
                <input type="hidden" name="courseId" value={outline.id} />
                <input type="hidden" name="lessonId" value={nextLesson.id} />
                <SubmitButton size="lg" className="w-full" pendingText={t.courses.page.opening}>
                  <Play className="h-5 w-5" />
                  {!enrollment
                    ? t.courses.page.startCourse
                    : percent === 100
                      ? t.courses.page.review
                      : t.courses.page.continue}
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t.courses.page.lessonsTitle}</h2>
        <ol className="flex flex-col gap-3">
          {outline.lessons.map((lesson, i) => {
            const done = completed.has(lesson.id);
            const isNext = nextLesson?.id === lesson.id && !done;
            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${outline.slug}/lessons/${lesson.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm transition hover:-translate-y-0.5 hover:shadow-sticker',
                    isNext && 'bg-butter-soft',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line font-display font-bold',
                      done ? 'bg-mint' : isNext ? 'bg-butter' : 'bg-paper',
                    )}
                  >
                    {done ? <Check className="h-5 w-5" aria-label={t.courses.page.done} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-semibold">{lesson.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {lesson.activities.map((a) => {
                        const def = getActivityType(a.type);
                        const score = best.get(a.id);
                        const Icon = def?.icon ?? Lock;
                        const key = ACTIVITY_LABEL_KEY[a.type];
                        const activityLabel = key ? t.activities.types[key] : (def?.label ?? a.type);
                        return (
                          <span key={a.id} className="inline-flex items-center gap-1 rounded-pill border border-line/40 bg-cream px-2 py-0.5 text-xs font-semibold">
                            <Icon className="h-3 w-3" /> {activityLabel}
                            {score != null ? <span className="text-mint-deep">· {score}%</span> : null}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <span className="hidden text-sm text-ink-soft sm:block">{lesson.estimatedMinutes} {t.courses.page.min}</span>
                  {isNext ? <span className={buttonClasses('primary', 'sm', 'hidden sm:inline-flex')}>{t.courses.page.upNext}</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
