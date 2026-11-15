// /create/extension: build a new mini-course from chapters the learner already completed.
import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { EmptyState, PageHeader, buttonClasses } from '@/components/ui';
import { getT } from '@/i18n';
import { ExtensionForm } from '../components/extension-form';
import { listCompletedLessons } from '../queries';

export async function ExtensionPage({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const lessons = await listCompletedLessons(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        eyebrow={
          <Link href="/review" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.review.title}
          </Link>
        }
        title={t.selfLearn.extension.title}
        subtitle={t.selfLearn.extension.subtitle}
      />
      {lessons.length === 0 ? (
        <EmptyState title={t.selfLearn.extension.empty} mood="happy" action={
          <Link href="/courses" className={buttonClasses('secondary', 'sm')}>
            {t.selfLearn.extension.browseCourses}
          </Link>
        }>
          {t.selfLearn.extension.emptyHint}
        </EmptyState>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl border-2 border-line bg-butter-soft p-4 text-sm">
            <Sprout className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>{t.selfLearn.extension.intro}</p>
          </div>
          <ExtensionForm lessons={lessons} />
        </>
      )}
    </div>
  );
}
