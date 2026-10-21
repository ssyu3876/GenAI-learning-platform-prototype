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
import { assignCourse, removeStudent, unassignCourse } from '../actions';
import { CopyButton } from '../components/copy-button';
import { EngagementChart } from '../components/engagement-chart';
import { ImportStudentsForm } from '../components/import-students-form';
import { InlineActionForm } from '../components/inline-action-form';
import { QuestionInsights } from '../components/question-insights';
import { formatLastActive, NUDGE_LABEL } from '../logic';
import {
  getClassEngagement,
  getManagedClass,
  listAssignedCourses,
  listClassMembers,
  listCourseCandidates,
  type ClassCourseRow,
} from '../queries';

export const CLASS_TABS = [
  { id: 'students', label: 'Students' },
  { id: 'courses', label: 'Courses' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'insights', label: 'Insights' },
] as const;
export type ClassTab = (typeof CLASS_TABS)[number]['id'];

export function parseClassTab(value: string | string[] | undefined): ClassTab {
  const v = Array.isArray(value) ? value[0] : value;
  return CLASS_TABS.some((t) => t.id === v) ? (v as ClassTab) : 'students';
}

export async function ClassDetailPage({ user, classId, tab }: { user: SessionUser; classId: string; tab: ClassTab }) {
  const cls = await getManagedClass(user, classId);
  if (!cls) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/classes" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All classes
          </Link>
        }
        title={cls.name}
        subtitle={cls.description || undefined}
        action={
          <span className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">Invite code</span>
            <code className="rounded-lg border-2 border-line bg-butter-soft px-2 py-0.5 font-mono font-bold tracking-widest">
              {cls.inviteCode}
            </code>
            <CopyButton value={cls.inviteCode} label="Copy code" />
          </span>
        }
      />
      <nav aria-label="Class sections" className="mb-6 flex flex-wrap gap-2">
        {CLASS_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/classes/${cls.id}?tab=${t.id}`}
            aria-current={t.id === tab ? 'page' : undefined}
            className={buttonClasses(t.id === tab ? 'butter' : 'secondary', 'sm')}
          >
            {t.label}
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
  const members = await listClassMembers(classId);
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title={`Students (${members.length})`}
          subtitle="Removing a student only takes them out of this class. Their progress stays."
        />
        <CardBody>
          {members.length === 0 ? (
            <EmptyState title="No students yet">
              Share the invite code, or import a list below.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="font-display text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-3">Student</th>
                    <th scope="col" className="py-2 pr-3">XP</th>
                    <th scope="col" className="py-2 pr-3">Level</th>
                    <th scope="col" className="py-2 pr-3">Last active</th>
                    <th scope="col" className="py-2 pr-3">Courses done</th>
                    <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
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
                      <td className="py-2.5 pr-3"><Badge tint="mint">{m.levelName}</Badge></td>
                      <td className="py-2.5 pr-3">{formatLastActive(m.lastActiveAt)}</td>
                      <td className="py-2.5 pr-3">{m.coursesCompleted}</td>
                      <td className="py-2.5 text-right">
                        <InlineActionForm
                          action={removeStudent}
                          fields={{ classId, userId: m.id }}
                          pendingText="Removing…"
                          confirmText={`Remove ${m.name} from this class?`}
                          variant="danger"
                          ariaLabel={`Remove ${m.name} from the class`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden /> Remove
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
        <CardHeader title="Import students" subtitle="Paste a list or upload a .csv file with name and email columns." />
        <CardBody>
          <ImportStudentsForm classId={classId} />
        </CardBody>
      </Card>
    </div>
  );
}

function CourseLine({ course, children }: { course: ClassCourseRow; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line/15 py-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-2xl" aria-hidden>{course.emoji}</span>
        <div className="min-w-0">
          <div className="font-semibold">{course.title}</div>
          <div className="text-xs text-ink-soft">
            {course.lessonCount} lesson{course.lessonCount === 1 ? '' : 's'}
            {course.status !== 'published' ? ` · ${course.status.replace('_', ' ')}` : ''}
          </div>
        </div>
      </div>
      {children}
    </li>
  );
}

async function CoursesTab({ user, classId }: { user: SessionUser; classId: string }) {
  const [assigned, candidates] = await Promise.all([listAssignedCourses(classId), listCourseCandidates(user, classId)]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card tint="mint">
        <CardHeader title={`Assigned (${assigned.length})`} subtitle="Students in this class see these courses." />
        <CardBody>
          {assigned.length === 0 ? (
            <EmptyState title="No courses assigned">Pick one from the list to get the class started.</EmptyState>
          ) : (
            <ul>
              {assigned.map((c) => (
                <CourseLine key={c.id} course={c}>
                  <InlineActionForm
                    action={unassignCourse}
                    fields={{ classId, courseId: c.id }}
                    pendingText="Removing…"
                    variant="ghost"
                    ariaLabel={`Remove ${c.title} from the class`}
                  >
                    Remove
                  </InlineActionForm>
                </CourseLine>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Available courses" subtitle="Published courses you own plus the public catalog." />
        <CardBody>
          {candidates.length === 0 ? (
            <EmptyState title="Nothing else to assign">Publish a course in the studio and it will show up here.</EmptyState>
          ) : (
            <ul>
              {candidates.map((c) => (
                <CourseLine key={c.id} course={c}>
                  <InlineActionForm
                    action={assignCourse}
                    fields={{ classId, courseId: c.id }}
                    pendingText="Assigning…"
                    variant="mint"
                    ariaLabel={`Assign ${c.title} to the class`}
                  >
                    Assign
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
  const data = await getClassEngagement(classId);
  if (data.totalStudents === 0) {
    return (
      <EmptyState title="No students to track yet">
        Once students join or you import them, their activity shows up here.
      </EmptyState>
    );
  }
  const nudgeCount = data.students.filter((s) => s.nudge).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active in last 7 days"
          value={`${data.activeThisWeek} / ${data.totalStudents}`}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          tint="mint"
        />
        <Stat
          label="Avg course progress"
          value={data.averageProgress === null ? '–' : `${data.averageProgress}%`}
          icon={<Gauge className="h-5 w-5" aria-hidden />}
          tint="sky"
        />
        <Stat
          label="Activities done, 7 days"
          value={data.activitiesThisWeek}
          icon={<Activity className="h-5 w-5" aria-hidden />}
          tint="butter"
        />
        <Stat
          label="Avg best score"
          value={data.averageScore === null ? '–' : `${data.averageScore}%`}
          icon={<Target className="h-5 w-5" aria-hidden />}
          tint="lilac"
        />
      </div>

      <Card>
        <CardHeader title="Daily activity" subtitle="Learning events and XP from students in this class." />
        <CardBody>
          <EngagementChart data={data.series} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Student by student"
          subtitle={
            nudgeCount
              ? `${nudgeCount} student${nudgeCount === 1 ? '' : 's'} could use a nudge.`
              : 'Everyone is moving. Nice.'
          }
        />
        <CardBody>
          {data.courses.length === 0 ? (
            <p className="mb-3 text-sm text-ink-soft">
              Assign a course in the Courses tab to see progress per course.
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="font-display text-ink-soft">
                <tr>
                  <th scope="col" className="py-2 pr-3">Student</th>
                  <th scope="col" className="py-2 pr-3">Progress</th>
                  <th scope="col" className="py-2 pr-3">Last active</th>
                  <th scope="col" className="py-2 pr-3">Activities</th>
                  <th scope="col" className="py-2 pr-3">Avg score</th>
                  <th scope="col" className="py-2">Status</th>
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
                            <ProgressBar value={s.averageProgress} label={`${s.name}'s average progress`} size="sm" />
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
                    <td className="py-2.5 pr-3">{formatLastActive(s.lastActiveAt)}</td>
                    <td className="py-2.5 pr-3">{s.activitiesDone}</td>
                    <td className="py-2.5 pr-3">{s.averageScore === null ? '–' : `${s.averageScore}%`}</td>
                    <td className="py-2.5">
                      {s.nudge ? (
                        <Badge tint="coral">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Needs a nudge
                          <span className="sr-only">: </span>
                          <span className="font-normal">({NUDGE_LABEL[s.nudge]})</span>
                        </Badge>
                      ) : (
                        <Badge tint="mint">On track</Badge>
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
