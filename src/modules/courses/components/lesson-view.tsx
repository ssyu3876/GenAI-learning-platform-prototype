import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { learnerProfiles } from '@/core/db/schema';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, Markdown, ProgressBar } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { markLessonDone } from '../actions';
import { getCoursePageData } from '../queries';
import type { AdaptationVariant } from '../schema';
import { AdaptPanel } from './adapt-panel';
import { LessonRunner } from './lesson-runner';

export async function LessonView({ user, slug, lessonId }: { user: SessionUser; slug: string; lessonId: string }) {
  const { t } = await getT();

  const data = await getCoursePageData(user, slug);
  if (!data) notFound();
  const { outline, completed, best } = data;
  const index = outline.lessons.findIndex((l) => l.id === lessonId);
  const lesson = outline.lessons[index];
  if (!lesson) notFound();
  const prev = outline.lessons[index - 1];
  const next = outline.lessons[index + 1];
  const done = completed.has(lesson.id);

  const db = await getDb();
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, user.id)).limit(1);
  const suggested: AdaptationVariant | undefined = profile
    ? profile.background === 'non_cs' || profile.codingLevel === 0
      ? 'simpler'
      : profile.track === 'builder'
        ? 'technical'
        : 'example'
    : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={`/courses/${outline.slug}`} className="flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> {outline.emoji} {outline.title}
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-semibold whitespace-nowrap text-ink-soft">
            {fmt(t.courses.lesson.lessonOf, { current: index + 1, total: outline.lessons.length })}
          </span>
          <ProgressBar
            value={(completed.size / outline.lessons.length) * 100}
            label={t.courses.lesson.courseProgress}
            size="sm"
            className="flex-1"
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tint="paper">
            <Clock className="h-3 w-3" /> {fmt(t.courses.lesson.minutes, { minutes: lesson.estimatedMinutes })}
          </Badge>
          {done ? (
            <Badge tint="mint">
              <Check className="h-3 w-3" /> {t.courses.lesson.done}
            </Badge>
          ) : null}
        </div>
        <h1 className="mb-4 text-3xl font-bold">{lesson.title}</h1>
        <Markdown videos>{lesson.content}</Markdown>
      </Card>

      <AdaptPanel lessonId={lesson.id} suggested={suggested} />

      {lesson.activities.length ? (
        <section aria-label={t.courses.lesson.activities} className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t.courses.lesson.yourTurn}</h2>
          <LessonRunner
            activities={lesson.activities.map((a) => ({
              id: a.id,
              type: a.type,
              title: a.title,
              xpReward: a.xpReward,
              config: a.config,
              bestScore: best.get(a.id) ?? null,
            }))}
          />
        </section>
      ) : !done ? (
        <form action={markLessonDone} className="flex justify-center">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <SubmitButton variant="mint" size="lg" pendingText={t.courses.lesson.saving}>
            <Check className="h-5 w-5" /> {t.courses.lesson.readThis}
          </SubmitButton>
        </form>
      ) : null}

      <nav className="flex items-center justify-between gap-3 border-t-2 border-line/20 pt-5" aria-label={t.courses.lesson.navigation}>
        {prev ? (
          <Link href={`/courses/${outline.slug}/lessons/${prev.id}`} className={buttonClasses('secondary')}>
            <ChevronLeft className="h-4 w-4" /> {t.courses.lesson.previous}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/courses/${outline.slug}/lessons/${next.id}`} className={buttonClasses(done ? 'primary' : 'secondary')}>
            {t.courses.lesson.nextLesson} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href={`/courses/${outline.slug}`} className={buttonClasses('mint')}>
            {t.courses.lesson.doneCourse} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}
