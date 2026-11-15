// /assignments: teacher management list or student deadline list.
import Link from 'next/link';
import { CalendarClock, ClipboardList, Plus, Settings2 } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT, type Translations } from '@/i18n';
import { listStudentAssignments, listTeacherAssignments, type StudentAssignmentSummary } from '../queries';
import type { AssignmentType } from '../schema';

function typeTint(type: AssignmentType) {
  return type === 'quiz' ? 'sky' : type === 'project' ? 'lilac' : 'butter';
}

function dateLabel(value: Date, locale: 'en' | 'zh') {
  return value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(t: Translations, type: AssignmentType) {
  return t.assignments.type[type];
}

export async function AssignmentsPage({ user }: { user: SessionUser }) {
  const { locale, t } = await getT();
  const isTeacher = user.role !== 'learner';
  const items = isTeacher ? await listTeacherAssignments(user) : await listStudentAssignments(user);
  const subtitle = isTeacher
    ? user.role === 'admin'
      ? t.assignments.subtitleAdmin
      : t.assignments.subtitleInstructor
    : t.assignments.subtitleStudent;

  return (
    <div>
      <PageHeader
        title={t.assignments.title}
        subtitle={subtitle}
        action={
          isTeacher ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/assignments/settings" className={buttonClasses('ghost', 'sm')}>
                <Settings2 className="h-4 w-4" aria-hidden /> {t.assignments.settingsLink}
              </Link>
              <Link href="/assignments/calendar" className={buttonClasses('secondary', 'sm')}>
                <CalendarClock className="h-4 w-4" aria-hidden /> {t.assignments.calendarLink}
              </Link>
              <Link href="/assignments/new" className={buttonClasses('primary')}>
                <Plus className="h-4 w-4" aria-hidden /> {t.assignments.new}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/assignments/calendar" className={buttonClasses('secondary', 'sm')}>
                <CalendarClock className="h-4 w-4" aria-hidden /> {t.assignments.calendarLink}
              </Link>
              <Link href="/assignments/grades" className={buttonClasses('secondary', 'sm')}>
                <CalendarClock className="h-4 w-4" aria-hidden /> {t.assignments.grades.title}
              </Link>
            </div>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState title={t.assignments.empty} mood="happy">
          {isTeacher ? t.assignments.emptyInstructor : t.assignments.emptyStudent}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-7">
          {[...new Set(items.map((item) => item.weekNo))]
            .sort((a, b) => a - b)
            .map((week) => (
              <section key={week} aria-labelledby={`assignment-week-${week}`}>
                <h2 id={`assignment-week-${week}`} className="mb-3 text-xl font-bold">
                  {fmt(t.assignments.week, { week })}
                </h2>
                <ul className="grid gap-3 lg:grid-cols-2">
                  {items
                    .filter((item) => item.weekNo === week)
                    .map((item) => {
                      const student =
                        'submissionStatus' in item ? (item as StudentAssignmentSummary) : null;
                      const status = student?.submissionStatus;
                      return (
                        <li key={item.id}>
                          <Link href={`/assignments/${item.id}`} className="block">
                            <Card interactive className="flex h-full flex-col gap-3 p-4">
                              <div className="flex items-start gap-3">
                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-line bg-butter-soft">
                                  <ClipboardList className="h-5 w-5" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge tint={typeTint(item.type)}>{typeLabel(t, item.type)}</Badge>
                                    {isTeacher ? (
                                      <Badge tint={item.publishedAt ? 'mint' : 'paper'}>
                                        {item.publishedAt ? t.assignments.published : t.assignments.draft}
                                      </Badge>
                                    ) : null}
                                    <span className="text-xs text-ink-soft">
                                      {t.assignments.source[item.source]}
                                    </span>
                                  </div>
                                  <p className="mt-2 font-display text-lg font-bold">{item.title}</p>
                                  <p className="text-sm text-ink-soft">
                                    {item.courseTitle}
                                    {item.lessonTitle ? ` · ${item.lessonTitle}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarClock className="h-4 w-4" aria-hidden />
                                  {fmt(t.assignments.due, { date: dateLabel(item.dueAt, locale) })}
                                </span>
                                <span>{fmt(t.assignments.points, { points: item.points })}</span>
                                {isTeacher ? (
                                  <span>{fmt(t.assignments.submissions, { count: item.submissionCount })}</span>
                                ) : (
                                  <Badge
                                    tint={
                                      student?.locked
                                        ? 'coral'
                                        : status === 'graded'
                                          ? 'mint'
                                          : status === 'submitted'
                                            ? 'sky'
                                            : new Date() > item.dueAt
                                              ? 'coral'
                                              : 'butter'
                                    }
                                  >
                                    {student?.locked
                                      ? fmt(t.assignments.detail.locked, { week: item.weekNo })
                                      : status
                                        ? t.assignments.submissionStatus[status]
                                        : new Date() > item.dueAt
                                          ? t.assignments.submissionStatus.missing
                                          : t.assignments.submissionStatus.none}
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
