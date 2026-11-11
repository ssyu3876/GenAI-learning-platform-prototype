// /classes: staff see the classes they run (admins: all) and can create one; learners see
// the classes they joined and can join with an invite code.
import Link from 'next/link';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, CardHeader, EmptyState, PageHeader, asTint, TINT_BG, cn } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { CreateClassForm, JoinClassForm } from '../components/class-forms';
import { CopyButton } from '../components/copy-button';
import { listLearnerClasses, listStaffClasses } from '../queries';

export async function ClassesPage({ user }: { user: SessionUser }) {
  return user.role === 'learner' ? <LearnerClasses user={user} /> : <StaffClasses user={user} />;
}

async function StaffClasses({ user }: { user: SessionUser }) {
  const { t } = await getT();

  const list = await listStaffClasses(user);
  return (
    <div>
      <PageHeader
        title={t.classes.page.yourClasses}
        subtitle={
          user.role === 'admin'
            ? t.classes.page.subtitleAdmin
            : t.classes.page.subtitleStaff
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-label={t.classes.page.classList} className="flex flex-col gap-4">
          {list.length === 0 ? (
            <EmptyState title={t.classes.page.noClasses}>
              {t.classes.page.createFirstClass}
            </EmptyState>
          ) : (
            list.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold">
                      <Link href={`/classes/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </h2>
                    {c.description ? <p className="mt-1 text-sm text-ink-soft">{c.description}</p> : null}
                    {user.role === 'admin' ? (
                      <p className="mt-1 text-xs font-semibold text-ink-soft">{fmt(t.classes.page.runBy, { instructor: c.instructorName })}</p>
                    ) : null}
                  </div>
                  <Link href={`/classes/${c.id}`} className={buttonClasses('secondary', 'sm')}>
                    {t.classes.page.openClass} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge tint="sky">
                    <Users className="h-3.5 w-3.5" aria-hidden /> {c.memberCount} {c.memberCount === 1 ? t.chrome.common.student : t.chrome.common.students}
                  </Badge>
                  <Badge tint="mint">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden /> {c.courseCount} {c.courseCount === 1 ? t.chrome.common.course : t.chrome.common.courses}
                  </Badge>
                  <span className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-ink-soft">{t.classes.page.inviteCode}</span>
                    <code className="rounded-lg border-2 border-line bg-butter-soft px-2 py-0.5 font-mono font-bold tracking-widest">
                      {c.inviteCode}
                    </code>
                    <CopyButton value={c.inviteCode} label={t.classes.page.copy} variant="ghost" />
                  </span>
                </div>
              </Card>
            ))
          )}
        </section>
        <Card tint="sky" className="h-fit">
          <CardHeader title={t.classes.page.newClass} subtitle={t.classes.page.newClassSubtitle} />
          <CardBody>
            <CreateClassForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function LearnerClasses({ user }: { user: SessionUser }) {
  const { t } = await getT();

  const list = await listLearnerClasses(user.id);
  return (
    <div>
      <PageHeader title={t.classes.page.myClasses} subtitle={t.classes.page.subtitleLearner} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-label={t.classes.page.joinedClasses} className="flex flex-col gap-4">
          {list.length === 0 ? (
            <EmptyState title={t.classes.page.notInClass} mood="happy">
              {t.classes.page.gotInviteCode}
            </EmptyState>
          ) : (
            list.map((c) => (
              <Card key={c.id}>
                <CardHeader title={c.name} subtitle={fmt(t.classes.page.withTeacher, { teacher: c.instructorName })} />
                <CardBody>
                  {c.description ? <p className="mb-3 text-sm text-ink-soft">{c.description}</p> : null}
                  {c.courses.length === 0 ? (
                    <p className="text-sm text-ink-soft">{t.classes.page.noCoursesAssigned}</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {c.courses.map((course) => (
                        <li key={course.id}>
                          <Link
                            href={`/courses/${course.slug}`}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-pill border-2 border-line px-3 py-1 text-sm font-semibold shadow-sticker-sm hover:-translate-y-0.5',
                              TINT_BG[asTint(course.color)],
                            )}
                          >
                            <span aria-hidden>{course.emoji}</span>
                            {course.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </section>
        <Card tint="butter" className="h-fit">
          <CardHeader title={t.classes.page.joinWithCode} />
          <CardBody>
            <JoinClassForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
