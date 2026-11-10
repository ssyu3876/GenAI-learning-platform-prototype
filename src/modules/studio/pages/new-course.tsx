// /studio/new: page frame around the generate / blank course forms.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonClasses, PageHeader } from '@/components/ui';
import { getT } from '@/i18n';
import { NewCourseForms } from '../components/new-course-forms';

export async function NewCoursePage({ mode }: { mode?: string }) {
  const { t } = await getT();
  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/studio" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.chrome.nav.studio}
          </Link>
        }
        title={t.studio.newCourse.title}
        subtitle={t.studio.newCourse.subtitle}
      />
      <NewCourseForms initialMode={mode === 'blank' ? 'blank' : 'ai'} />
    </div>
  );
}
