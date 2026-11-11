// /classes/[classId]: one class for its instructor (or an admin), split into tabs.
// Students = roster + CSV import, Courses = assignments, Engagement = the dashboard,
// Insights = error rate per quiz question + AI summary of common misconceptions.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Gauge, Target, Trash2, UserCheck } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
  Stat,
} from '@/components/ui';
import { fmt, getT, type Locale, type Translations } from '@/i18n';
import { assignCourse, removeStudent, unassignCourse } from '../actions';
import { CopyButton } from '../components/copy-button';
import { EngagementChart } from '../components/engagement-chart';
import { ImportStudentsForm } from '../components/import-students-form';
import { InlineActionForm } from '../components/inline-action-form';
import { QuestionInsights } from '../components/question-insights';
import { daysSince, INACTIVE_DAYS, type NudgeReason } from '../logic';
import {
  getClassEngagement,
  getManagedClass,
  listAssignedCourses,
  listClassMembers,
  listCourseCandidates,
  type ClassCourseRow,
} from '../queries';

export const CLASS_TABS = [
  { id: 'students' },
  { id: 'courses' },
  { id: 'engagement' },
  { id: 'insights' },
] as const;
export type ClassTab = (typeof CLASS_TABS)[number]['id'];

const NUDGE_KEY: Record<NudgeReason, 'noActivity' | 'inactive' | 'behind'> = {
  no_activity: 'noActivity',
  inactive: 'inactive',
  behind: 'behind',
};

/** "Today" / "Yesterday" / "3 days ago" / "Never", then a date once it is over a month old. */
function lastActiveLabel(date: Date | null, t: Translations, locale: Locale): string {
  if (!date) return t.classes.time.never;
  const days = daysSince(date);
  if (days === null || days <= 0) return t.classes.time.today;
  if (days === 1) return t.classes.time.yesterday;
  if (days < 30) return fmt(t.classes.time.daysAgo, { days });
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function nudgeLabel(reason: NudgeReason, t: Translations): string {
  return fmt(t.classes.nudge[NUDGE_KEY[reason]], { days: INACTIVE_DAYS });
}

export function parseClassTab(value: string | string[] | undefined): ClassTab {
  const v = Array.isArray(value) ? value[0] : value;
  return CLASS_TABS.some((t) => t.id === v) ? (v as ClassTab) : 'students';
}

export async function ClassDetailPage({ user, classId, tab }: { user: SessionUser; classId: string; tab: ClassTab }) {
  const { t } = await getT();
  const cls = await getManagedClass(user, classId);
  if (!cls) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/classes" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.classes.detail.allClasses}
          </Link>
        }
        title={cls.name}
        subtitle={cls.description || undefined}
        action={
          <span className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">{t.classes.detail.inviteCode}</span>
            <code className="rounded-lg border-2 border-line bg-butter-soft px-2 py-0.5 font-mono font-bold tracking-widest">
              {cls.inviteCode}
            </code>
            <CopyButton value={cls.inviteCode} label={t.classes.detail.copyCode} />
          </span>
        }
      />
      <nav aria-label={t.classes.detail.sectionsLabel} className="mb-6 flex flex-wrap gap-2">
        {CLASS_TABS.map((item) => (
          <Link
            key={item.id}
            href={`/classes/${cls.id}?tab=${item.id}`}
            aria-current={item.id === tab ? 'page' : undefined}
            className={buttonClasses(item.id === tab ? 'butter' : 'secondary', 'sm')}
          >
            {t.classes.tabs[item.id]}
          </Link>
        ))}
      </nav>
      {tab === 'students' ? <StudentsTab classId={cls.id} /> : null}
      {tab === 'courses' ? <CoursesTab user={user} classId={cls.id} /> : null}
      {tab === 'engagement' ? <EngagementTab classId={cls.id} /> : null}
      {tab === 'insights' ? <QuestionInsights classId={cls.id} /> : null}
    </div>
  );
}

async function StudentsTab({ classId }: { classId: string }) {
  const { t, locale } = await getT();
  const members = await listClassMembers(classId);
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title={fmt(t.classes.students.title, { count: members.length })}
          subtitle={t.classes.students.subtitle}
        />
        <CardBody>
          {members.length === 0 ? (
            <EmptyState title={t.classes.students.emptyTitle}>
              {t.classes.students.emptyBody}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="font-display text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-3">{t.classes.students.tableStudent}</th>
                    <th scope="col" className="py-2 pr-3">{t.chrome.common.xp}</th>
                    <th scope="col" className="py-2 pr-3">{t.chrome.common.level}</th>
                    <th scope="col" className="py-2 pr-3">{t.classes.students.tableLastActive}</th>
                    <th scope="col" className="py-2 pr-3">{t.classes.students.tableCoursesDone}</th>
                    <th scope="col" className="py-2"><span className="sr-only">{t.classes.students.tableActions}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t-2 border-line/15 align-middle">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar seed={m.avatarSeed} name={m.name} size={32} />
                          <div className="min-w-0">
                            <div className="font-semibold">{m.name}</div>
                            <div className="text-xs text-ink-soft">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold">{m.totalXp}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tint="mint">
                          {t.chrome.levels[m.levelName as keyof typeof t.chrome.levels] ?? m.levelName}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3">{lastActiveLabel(m.lastActiveAt, t, locale)}</td>
                      <td className="py-2.5 pr-3">{m.coursesCompleted}</td>
                      <td className="py-2.5 text-right">
                        <InlineActionForm
                          action={removeStudent}
                          fields={{ classId, userId: m.id }}
                          pendingText={t.classes.students.removing}
                          confirmText={fmt(t.classes.students.confirmRemove, { name: m.name })}
                          variant="danger"
                          ariaLabel={fmt(t.classes.students.removeLabel, { name: m.name })}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden /> {t.classes.students.remove}
                        </InlineActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <Card tint="sky">
        <CardHeader title={t.classes.importForm.cardTitle} subtitle={t.classes.importForm.cardSubtitle} />
        <CardBody>
          <ImportStudentsForm classId={classId} />
        </CardBody>
      </Card>
    </div>
  );
}

async function CourseLine({ course, children }: { course: ClassCourseRow; children: ReactNode }) {
  const { t } = await getT();
  const statusLabel =
    t.classes.courseStatus[course.status as keyof typeof t.classes.courseStatus] ?? course.status;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line/15 py-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-2xl" aria-hidden>{course.emoji}</span>
        <div className="min-w-0">
          <div className="font-semibold">{course.title}</div>
          <div className="text-xs text-ink-soft">
            {course.lessonCount} {course.lessonCount === 1 ? t.chrome.common.lesson : t.chrome.common.lessons}
            {course.status !== 'published' ? ` · ${statusLabel}` : ''}
          </div>
        </div>
      </div>
      {children}
    </li>
  );
}

async function CoursesTab({ user, classId }: { user: SessionUser; classId: string }) {
  const { t } = await getT();
  const [assigned, candidates] = await Promise.all([listAssignedCourses(classId), listCourseCandidates(user, classId)]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card tint="mint">
        <CardHeader
          title={fmt(t.classes.coursesTab.assignedTitle, { count: assigned.length })}
          subtitle={t.classes.coursesTab.assignedSubtitle}
        />
        <CardBody>
          {assigned.length === 0 ? (
            <EmptyState title={t.classes.coursesTab.emptyAssignedTitle}>
              {t.classes.coursesTab.emptyAssignedBody}
            </EmptyState>
          ) : (
            <ul>
              {assigned.map((c) => (
                <CourseLine key={c.id} course={c}>
                  <InlineActionForm
                    action={unassignCourse}
                    fields={{ classId, courseId: c.id }}
                    pendingText={t.classes.coursesTab.removing}
                    variant="ghost"
                    ariaLabel={fmt(t.classes.coursesTab.removeLabel, { title: c.title })}
                  >
                    {t.classes.coursesTab.remove}
                  </InlineActionForm>
                </CourseLine>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t.classes.coursesTab.availableTitle} subtitle={t.classes.coursesTab.availableSubtitle} />
        <CardBody>
          {candidates.length === 0 ? (
            <EmptyState title={t.classes.coursesTab.emptyAvailableTitle}>
              {t.classes.coursesTab.emptyAvailableBody}
            </EmptyState>
          ) : (
            <ul>
              {candidates.map((c) => (
                <CourseLine key={c.id} course={c}>
                  <InlineActionForm
                    action={assignCourse}
                    fields={{ classId, courseId: c.id }}
                    pendingText={t.classes.coursesTab.assigning}
                    variant="mint"
                    ariaLabel={fmt(t.classes.coursesTab.assignLabel, { title: c.title })}
                  >
                    {t.classes.coursesTab.assign}
                  </InlineActionForm>
                </CourseLine>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

async function EngagementTab({ classId }: { classId: string }) {
  const { t, locale } = await getT();
  const data = await getClassEngagement(classId);
  if (data.totalStudents === 0) {
    return (
      <EmptyState title={t.classes.engagement.emptyTitle}>
        {t.classes.engagement.emptyBody}
      </EmptyState>
    );
  }
  const nudgeCount = data.students.filter((s) => s.nudge).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t.classes.engagement.activeLast7}
          value={`${data.activeThisWeek} / ${data.totalStudents}`}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          tint="mint"
        />
        <Stat
          label={t.classes.engagement.averageProgress}
          value={data.averageProgress === null ? '–' : `${data.averageProgress}%`}
          icon={<Gauge className="h-5 w-5" aria-hidden />}
          tint="sky"
        />
        <Stat
          label={t.classes.engagement.activitiesDone}
          value={data.activitiesThisWeek}
          icon={<Activity className="h-5 w-5" aria-hidden />}
          tint="butter"
        />
        <Stat
          label={t.classes.engagement.averageScore}
          value={data.averageScore === null ? '–' : `${data.averageScore}%`}
          icon={<Target className="h-5 w-5" aria-hidden />}
          tint="lilac"
        />
      </div>

      <Card>
        <CardHeader title={t.classes.engagement.dailyTitle} subtitle={t.classes.engagement.dailySubtitle} />
        <CardBody>
          <EngagementChart data={data.series} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t.classes.engagement.studentTitle}
          subtitle={
            nudgeCount
              ? nudgeCount === 1
                ? t.classes.engagement.nudgeOne
                : fmt(t.classes.engagement.nudgeMany, { count: nudgeCount })
              : t.classes.engagement.allMoving
          }
        />
        <CardBody>
          {data.courses.length === 0 ? (
            <p className="mb-3 text-sm text-ink-soft">{t.classes.engagement.assignHint}</p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="font-display text-ink-soft">
                <tr>
                  <th scope="col" className="py-2 pr-3">{t.classes.engagement.tableStudent}</th>
                  <th scope="col" className="py-2 pr-3">{t.classes.engagement.tableProgress}</th>
                  <th scope="col" className="py-2 pr-3">{t.classes.engagement.tableLastActive}</th>
                  <th scope="col" className="py-2 pr-3">{t.classes.engagement.tableActivities}</th>
                  <th scope="col" className="py-2 pr-3">{t.classes.engagement.tableAvgScore}</th>
                  <th scope="col" className="py-2">{t.classes.engagement.tableStatus}</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.id} className="border-t-2 border-line/15 align-top">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar seed={s.avatarSeed} name={s.name} size={32} />
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="w-64 py-2.5 pr-3">
                      {s.averageProgress === null ? (
                        <span className="text-ink-soft">–</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={s.averageProgress}
                              label={fmt(t.classes.engagement.averageProgressLabel, { name: s.name })}
                              size="sm"
                            />
                            <span className="w-10 shrink-0 text-right font-semibold">{s.averageProgress}%</span>
                          </div>
                          <ul className="flex flex-wrap gap-1">
                            {data.courses.map((c) => (
                              <li key={c.id} title={c.title}>
                                <Badge tint="paper">
                                  <span aria-hidden>{c.emoji}</span>
                                  <span className="sr-only">{c.title}:</span> {s.progress[c.id] ?? 0}%
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">{lastActiveLabel(s.lastActiveAt, t, locale)}</td>
                    <td className="py-2.5 pr-3">{s.activitiesDone}</td>
                    <td className="py-2.5 pr-3">{s.averageScore === null ? '–' : `${s.averageScore}%`}</td>
                    <td className="py-2.5">
                      {s.nudge ? (
                        <Badge tint="coral">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {t.classes.engagement.needsNudge}
                          <span className="sr-only">: </span>
                          <span className="font-normal">({nudgeLabel(s.nudge, t)})</span>
                        </Badge>
                      ) : (
                        <Badge tint="mint">{t.classes.engagement.onTrack}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
