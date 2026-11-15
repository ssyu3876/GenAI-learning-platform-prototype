// /assignments/calendar: teaching-week view of the assignment plan.
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { listStudentAssignments, listTeacherAssignments, type StudentAssignmentSummary } from '../queries';

export async function AssignmentCalendarPage({ user }: { user: SessionUser }) {
  const { locale, t } = await getT();
  const isTeacher = user.role !== 'learner';
  const items = isTeacher ? await listTeacherAssignments(user) : await listStudentAssignments(user);
  const maxWeek = Math.max(16, ...items.map((item) => item.weekNo));

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
          </Link>
        }
        title={t.assignments.calendar.title}
        subtitle={t.assignments.calendar.subtitle}
      />
      {items.length === 0 ? (
        <EmptyState title={t.assignments.empty} mood="happy">
          {isTeacher ? t.assignments.emptyInstructor : t.assignments.emptyStudent}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from({ length: maxWeek }, (_, index) => index + 1).map((week) => {
            const weekItems = items.filter((item) => item.weekNo === week);
            return (
              <Card key={week} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex w-28 shrink-0 items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-ink-soft" aria-hidden />
                    <div>
                      <p className="font-display font-bold">{fmt(t.assignments.week, { week })}</p>
                    </div>
                  </div>
                  <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-2">
                    {weekItems.length === 0 ? (
                      <p className="text-sm text-ink-soft">{t.assignments.calendar.emptyWeek}</p>
                    ) : (
                      weekItems.map((item) => {
                        const student = 'submissionStatus' in item ? (item as StudentAssignmentSummary) : null;
                        return (
                          <Link key={item.id} href={`/assignments/${item.id}`} className="block">
                            <div className="rounded-xl border-2 border-line/50 bg-paper p-3 hover:bg-butter-soft">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge
                                  tint={
                                    item.type === 'quiz' ? 'sky' : item.type === 'project' ? 'lilac' : 'butter'
                                  }
                                >
                                  {t.assignments.type[item.type]}
                                </Badge>
                                {student?.locked ? <Badge tint="coral">{t.assignments.submissionStatus.none}</Badge> : null}
                              </div>
                              <p className="mt-2 font-semibold">{item.title}</p>
                              <p className="text-sm text-ink-soft">{item.courseTitle}</p>
                              <p className="mt-1 text-xs text-ink-soft">
                                {fmt(t.assignments.due, {
                                  date: item.dueAt.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  }),
                                })}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
