// /assignments/new: teacher creates a manual or AI-generated assignment draft.
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SessionUser } from '@/core/types';
import { buttonClasses, EmptyState, PageHeader } from '@/components/ui';
import { getT } from '@/i18n';
import { AssignmentCreateForm } from '../components/create-form';
import { listTeacherClasses, listTeacherCourses } from '../queries';

export async function NewAssignmentPage({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const [classes, courses] = await Promise.all([listTeacherClasses(user), listTeacherCourses(user)]);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
          </Link>
        }
        title={t.assignments.create.title}
        subtitle={t.assignments.create.subtitle}
      />
      {classes.length === 0 || courses.length === 0 ? (
        <EmptyState title={t.assignments.empty} mood="happy">
          {classes.length === 0 ? t.assignments.emptyInstructor : t.assignments.actions.courseUnavailable}
        </EmptyState>
      ) : (
        <AssignmentCreateForm classes={classes} courses={courses} />
      )}
    </div>
  );
}
