import { requireUser } from '@/core/auth/session';
import { getUserStats } from '@/core/progress/service';
import { growthStage } from '@/core/progress/xp';
import { cn, PipSays } from '@/components/ui';
import { homeWidgetsFor } from '@/registry/modules';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';

function displayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  // Keep academic/professional titles with the surname: "Dr. Chan" must not become "Dr.".
  if (parts.length > 1 && /^(dr|mr|mrs|ms|prof|professor)\.?$/i.test(parts[0]!)) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] ?? name;
}

function greeting(name: string, hour: number, t: Awaited<ReturnType<typeof getT>>['t']) {
  const first = displayName(name);
  if (hour < 5) return fmt(t.chrome.home.greeting.stillUp, { name: first! });
  if (hour < 12) return fmt(t.chrome.home.greeting.morning, { name: first! });
  if (hour < 18) return fmt(t.chrome.home.greeting.afternoon, { name: first! });
  return fmt(t.chrome.home.greeting.evening, { name: first! });
}

export default async function HomePage() {
  const user = await requireUser();
  const { t } = await getT();
  const [stats, widgets] = [await getUserStats(user.id), homeWidgetsFor(user.role)];
  const hour = new Date().getHours();
  const levelName = t.chrome.levels[stats.level.name as keyof typeof t.chrome.levels] ?? stats.level.name;
  const statusHtml =
    fmt(t.chrome.home.levelStatus, { levelName, xp: stats.totalXp }) +
    (stats.streak > 0 ? ' ' + fmt(t.chrome.home.withStreak, { days: stats.streak }) : '') +
    '.';

  return (
    <div className="flex flex-col gap-6">
      <PipSays mood="happy" stage={growthStage(stats.level.level)} size={84}>
        <p className="font-display text-xl font-bold">{greeting(user.name, hour, t)}</p>
        {user.role === 'learner' ? (
          <p className="text-sm text-ink-soft" dangerouslySetInnerHTML={{ __html: statusHtml }} />
        ) : (
          <p className="text-sm text-ink-soft">{t.chrome.home.instructorGreeting}</p>
        )}
      </PipSays>

      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.map(({ id, component: Widget, size }) => (
          <section key={id} className={cn(size === 'full' && 'lg:col-span-2')}>
            <Widget user={user} />
          </section>
        ))}
      </div>
    </div>
  );
}
