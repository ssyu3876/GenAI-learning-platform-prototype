// Home widgets: "Class pulse" for staff and "My classes" for learners.
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, EmptyState, Stat } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { getClassPulse, listLearnerClasses } from '../queries';

export async function ClassPulseWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();
  const pulse = await getClassPulse(user);
  return (
    <Card tint="sky" className="h-full">
      <CardHeader
        title={t.classes.homeWidgets.pulse.title}
        subtitle={
          user.role === 'admin'
            ? t.classes.homeWidgets.pulse.subtitleAll
            : t.classes.homeWidgets.pulse.subtitleMine
        }
        action={
          <Link href="/classes" className={buttonClasses('secondary', 'sm')}>
            {t.chrome.nav.classes}
          </Link>
        }
      />
      <CardBody>
        {pulse.classCount === 0 ? (
          <EmptyState title={t.classes.homeWidgets.pulse.emptyTitle} mood="happy">
            {t.classes.homeWidgets.pulse.emptyBody}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label={t.classes.homeWidgets.pulse.classes} value={pulse.classCount} />
              <Stat label={t.classes.homeWidgets.pulse.students} value={pulse.studentCount} />
              <Stat label={t.classes.homeWidgets.pulse.active} value={pulse.activeThisWeek} tint="mint" />
            </div>
            {pulse.busiest ? (
              <Link
                href={`/classes/${pulse.busiest.id}?tab=engagement`}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-line bg-paper px-3 py-2 font-semibold hover:bg-butter-soft"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-ink-soft">{t.classes.homeWidgets.pulse.busiest}</span>
                  <span className="block truncate">
                    {fmt(
                      pulse.busiest.events === 1
                        ? t.classes.homeWidgets.pulse.busiestLineOne
                        : t.classes.homeWidgets.pulse.busiestLine,
                      { name: pulse.busiest.name, events: pulse.busiest.events },
                    )}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            ) : (
              <p className="text-sm text-ink-soft">{t.classes.homeWidgets.pulse.quiet}</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export async function MyClassesWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();
  const list = await listLearnerClasses(user.id);
  return (
    <Card className="h-full">
      <CardHeader
        title={t.classes.homeWidgets.mine.title}
        action={
          <Link href="/classes" className={buttonClasses('secondary', 'sm')}>
            {list.length ? t.classes.homeWidgets.mine.seeAll : t.classes.homeWidgets.mine.join}
          </Link>
        }
      />
      <CardBody>
        {list.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.classes.homeWidgets.mine.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border-2 border-line bg-paper px-3 py-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="text-xs text-ink-soft">
                    {fmt(
                      c.courses.length === 1
                        ? t.classes.homeWidgets.mine.metaOne
                        : t.classes.homeWidgets.mine.meta,
                      { instructor: c.instructorName, courses: c.courses.length },
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
