// /admin: platform numbers and links into each part of the console.
import Link from 'next/link';
import { Award, ArrowRight, BookOpen, Bot, Compass, Users } from 'lucide-react';
import { Card, CardBody, CardHeader, PageHeader, Stat } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { AdminModuleList, type ModuleInfo } from '../components/module-list';
import { getAdminOverview } from '../queries';

const STATUSES = ['draft', 'pending_review', 'published', 'archived'] as const;

export async function AdminOverviewPage({ modules }: { modules: ModuleInfo[] }) {
  const { t } = await getT();
  const o = await getAdminOverview();
  const links = [
    {
      href: '/admin/users',
      icon: Users,
      title: t.admin.overview.card.usersTitle,
      body: t.admin.overview.card.usersBody,
    },
    {
      href: '/admin/courses',
      icon: BookOpen,
      title: t.admin.overview.card.coursesTitle,
      body: o.coursesByStatus.pending_review
        ? fmt(t.admin.overview.card.coursesPending, { count: o.coursesByStatus.pending_review })
        : t.admin.overview.card.coursesClear,
    },
    { href: '/admin/ai-usage', icon: Bot, title: t.admin.overview.card.aiTitle, body: t.admin.overview.card.aiBody },
    {
      href: '/admin/scenarios',
      icon: Compass,
      title: t.admin.overview.card.scenariosTitle,
      body: t.admin.overview.card.scenariosBody,
    },
    {
      href: '/admin/badges',
      icon: Award,
      title: t.admin.overview.card.badgesTitle,
      body: t.admin.overview.card.badgesBody,
    },
  ];

  return (
    <div>
      <PageHeader title={t.admin.overview.title} subtitle={t.admin.overview.subtitle} />
      <AdminNav current="/admin" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.admin.overview.people} />
          <CardBody className="grid grid-cols-3 gap-2">
            <Stat label={t.admin.overview.learners} value={o.usersByRole.learner} tint="mint" />
            <Stat label={t.admin.overview.instructors} value={o.usersByRole.instructor} tint="sky" />
            <Stat label={t.admin.overview.admins} value={o.usersByRole.admin} tint="lilac" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t.admin.overview.courses} />
          <CardBody className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <Stat
                key={s}
                label={t.admin.status[s]}
                value={o.coursesByStatus[s]}
                tint={s === 'pending_review' && o.coursesByStatus[s] > 0 ? 'butter' : 'paper'}
              />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t.admin.overview.last7Days} />
          <CardBody className="grid grid-cols-2 gap-2">
            <Stat label={t.admin.overview.learningEvents} value={o.eventsLast7Days} tint="mint" />
            <Stat label={t.admin.overview.activePeople} value={o.activeLearners7Days} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t.admin.overview.aiCallsToday} subtitle={t.admin.overview.sinceMidnightUtc} />
          <CardBody className="grid grid-cols-2 gap-2">
            <Stat label={t.admin.overview.realAi} value={o.aiToday.real} tint="lilac" />
            <Stat label={t.admin.overview.demoMode} value={o.aiToday.mock} tint="butter" />
          </CardBody>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-xl font-bold">{t.admin.overview.goTo}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map(({ href, icon: Icon, title, body }) => (
          <li key={href}>
            <Link href={href} className="block h-full">
              <Card interactive className="flex h-full items-start gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-butter-soft">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold">{title}</span>
                  <span className="block text-sm text-ink-soft">{body}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="build-heading" className="mt-8">
        <h2 id="build-heading" className="text-xl font-bold">
          {t.admin.modules.title}
        </h2>
        <p className="mt-1 mb-3 text-sm text-ink-soft">{t.admin.modules.subtitle}</p>
        <AdminModuleList modules={modules} />
      </section>
    </div>
  );
}
