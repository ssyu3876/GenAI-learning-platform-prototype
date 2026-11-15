// /assignments/grades: weighted course results for a learner.
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { buttonClasses, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { getStudentGrades } from '../queries';

export async function AssignmentGradesPage({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const grades = await getStudentGrades(user);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
          </Link>
        }
        title={t.assignments.grades.title}
        subtitle={t.assignments.grades.subtitle}
        action={
          grades.overall !== null ? (
            <p className="rounded-pill border-2 border-line bg-mint-soft px-4 py-2 font-display font-bold">
              {t.assignments.grades.overall}: {grades.overall.toFixed(1)}
            </p>
          ) : undefined
        }
      />
      {grades.courses.length === 0 ? (
        <EmptyState title={t.assignments.grades.empty} mood="happy">
          {t.assignments.grades.emptyBody}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grades.courses.map((course) => (
            <Card key={`${course.classId}:${course.courseId}`}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-line bg-butter-soft">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold">{course.courseTitle}</h2>
                    <p className="text-sm text-ink-soft">{course.className}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {t.assignments.grades.percent}
                    </p>
                    <p className="font-display text-3xl font-bold">{course.percent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">GPA</p>
                    <p className="font-display text-3xl font-bold">{course.gpa.toFixed(1)}</p>
                  </div>
                </div>
                <p className="text-xs text-ink-soft">
                  {fmt(t.assignments.grades.graded, { count: course.gradedCount })}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
