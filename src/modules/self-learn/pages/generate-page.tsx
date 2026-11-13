import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { getT } from '@/i18n';
import { LessonGenerator } from '../components/lesson-generator';
import { getGeneratedCourse, getGenerationSession } from '../queries';

export async function GeneratePage({ user, sessionId }: { user: SessionUser; sessionId: string }) {
  const { t } = await getT();
  const session = await getGenerationSession(user.id, sessionId);
  if (!session) notFound();
  if (session.status === 'generated') redirect(`/create/feedback/${session.id}`);
  if (!session.courseId) redirect(`/create/outline/${session.id}`);
  const generated = await getGeneratedCourse(session);
  if (!generated) notFound();
  if (generated.lessons.length >= session.outline.lessons.length) redirect(`/create/feedback/${session.id}`);
  const backHref = session.seriesId ? `/create/series/${session.seriesId}` : `/create/outline/${session.id}`;
  const backLabel = session.seriesId ? t.selfLearn.series.backSeries : t.selfLearn.generate.back;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <LessonGenerator
        sessionId={session.id}
        lessonTitles={session.outline.lessons.map((lesson) => lesson.title)}
        initialGenerated={generated.lessons.length}
      />
    </div>
  );
}
