// App frame for signed-in pages: sidebar (desktop), top strip (mobile), stats chips.
// Navigation and global add-ons come from the module registry, so modules never edit
// this file to appear in the app.
import Link from 'next/link';
import { Flame, House, LogOut, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { logout } from '@/core/auth/actions';
import { getUserStats } from '@/core/progress/service';
import { growthStage } from '@/core/progress/xp';
import type { SessionUser } from '@/core/types';
import { Avatar, Badge, Pip, ProgressBar } from '@/components/ui';
import { navItemsFor, shellAddons } from '@/registry/modules';
import { NavLink } from './nav-link';
import { getT } from '@/i18n';
import { navLabel } from '@/i18n/nav';
import { LanguageSwitcher } from '@/components/language-switcher';

export async function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const { locale, t } = await getT();

  const ROLE_LABEL = { learner: t.chrome.shell.learner, instructor: t.chrome.shell.instructor, admin: t.chrome.shell.admin } as const;

  const nav = [
    { href: '/home', label: t.chrome.nav.home, icon: House, roles: [user.role], order: 0 },
    ...navItemsFor(user.role).map((item) => ({ ...item, label: navLabel(item.href, item.label, t) })),
  ];
  const stats = await getUserStats(user.id);
  const levelName = t.chrome.levels[stats.level.name as keyof typeof t.chrome.levels] ?? stats.level.name;
  const Addons = shellAddons();

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-paper focus:px-4 focus:py-2">
        {t.chrome.nav.skipToContent}
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-line bg-cream/90 px-4 py-5 backdrop-blur lg:flex">
        <Link href="/home" className="mb-6 flex items-center gap-2 px-2">
          <Pip size={40} stage={growthStage(stats.level.level)} />
          <span className="font-display text-2xl font-bold">{t.chrome.landing.siteName}</span>
        </Link>
        <nav aria-label={t.chrome.nav.mainNavigation} className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
          <div className="flex items-center gap-2">
            <Avatar seed={user.avatarSeed} name={user.name} size={36} />
            <div className="min-w-0">
              <div className="truncate font-display font-semibold">{user.name}</div>
              <Badge tint="sky">{ROLE_LABEL[user.role]}</Badge>
            </div>
          </div>
          {user.role === 'learner' ? (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
                <span>{t.chrome.shell.level} {stats.level.level} · {levelName}</span>
                <span>{stats.totalXp} {t.chrome.common.xp}</span>
              </div>
              <ProgressBar value={stats.level.progress * 100} label={t.chrome.shell.levelProgress} size="sm" />
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <form action={logout}>
              <button type="submit" className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
                <LogOut className="h-4 w-4" /> {t.chrome.shell.logout}
              </button>
            </form>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile / top bar */}
        <header className="sticky top-0 z-30 border-b-2 border-line bg-cream/95 backdrop-blur lg:static lg:border-b-0 lg:bg-transparent">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:justify-end lg:px-8">
            <Link href="/home" className="flex items-center gap-2 lg:hidden">
              <Pip size={32} stage={growthStage(stats.level.level)} />
              <span className="font-display text-xl font-bold">{t.chrome.landing.siteName}</span>
            </Link>
            <div className="flex items-center gap-2">
              {user.role === 'learner' ? (
                <>
                  <Badge tint="coral" title={t.chrome.shell.dayStreak}>
                    <Flame className="h-3.5 w-3.5" /> {stats.streak}
                  </Badge>
                  <Badge tint="butter" title={t.chrome.shell.totalXp}>
                    <Zap className="h-3.5 w-3.5" /> {stats.totalXp} {t.chrome.common.xp}
                  </Badge>
                </>
              ) : (
                <Badge tint="sky">{ROLE_LABEL[user.role]}</Badge>
              )}
              <div className="lg:hidden">
                <LanguageSwitcher currentLocale={locale} />
              </div>
            </div>
            <form action={logout} className="lg:hidden">
              <button type="submit" aria-label={t.chrome.shell.logout} className="grid h-9 w-9 place-items-center rounded-full border-2 border-line bg-paper">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <nav aria-label={t.chrome.nav.mobileNavigation} className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} compact>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-2 pb-16 lg:px-8">
          {children}
        </main>
      </div>

      {Addons.map((Addon, i) => (
        <Addon key={i} user={user} />
      ))}
    </div>
  );
}
