import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Code, MessagesSquare, Trophy, WandSparkles } from 'lucide-react';
import { getSessionUser } from '@/core/auth/session';
import { buttonClasses, Card, Pip } from '@/components/ui';
import { getT } from '@/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function LandingPage() {
  if (await getSessionUser()) redirect('/home');

  const { locale, t } = await getT();

  const FEATURES = [
    {
      icon: MessagesSquare,
      tint: 'coral' as const,
      title: t.chrome.landing.features.practice.title,
      body: t.chrome.landing.features.practice.description,
    },
    {
      icon: Code,
      tint: 'sky' as const,
      title: t.chrome.landing.features.learn.title,
      body: t.chrome.landing.features.learn.description,
    },
    {
      icon: Trophy,
      tint: 'butter' as const,
      title: t.chrome.landing.features.compete.title,
      body: t.chrome.landing.features.compete.description,
    },
    {
      icon: WandSparkles,
      tint: 'mint' as const,
      title: t.chrome.landing.features.custom.title,
      body: t.chrome.landing.features.custom.description,
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pip size={40} />
          <span className="font-display text-2xl font-bold">{t.chrome.landing.siteName}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <Link href="/login" className={buttonClasses('secondary', 'sm')}>
            {t.chrome.landing.login}
          </Link>
          <Link href="/signup" className={buttonClasses('primary', 'sm')}>
            {t.chrome.landing.signup}
          </Link>
        </div>
      </header>

      <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
        <div>
          <p className="mb-3 inline-block rounded-pill border-2 border-line bg-butter px-3 py-1 font-display text-sm font-semibold">
            {t.chrome.landing.tagline}
          </p>
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            {t.chrome.landing.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            {t.chrome.landing.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={buttonClasses('primary', 'lg')}>
              {t.chrome.landing.startLearning}
            </Link>
            <Link href="/login" className={buttonClasses('secondary', 'lg')}>
              {t.chrome.landing.tryDemo}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto">
          <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-[2.5rem] border-2 border-line bg-mint" />
          <div className="flex flex-col items-center gap-4 rounded-[2.5rem] border-2 border-line bg-paper px-10 py-10">
            <Pip size={200} stage={3} mood="cheer" float />
            <p className="max-w-[16rem] text-center font-display text-lg font-semibold">
              {t.chrome.landing.pipGreeting}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 pb-16 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, tint, title, body }) => (
          <Card key={title} tint={tint} className="p-6">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border-2 border-line bg-paper">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-ink-soft">{body}</p>
          </Card>
        ))}
      </section>

      <footer className="mt-auto border-t-2 border-line/20 pt-6 text-sm text-ink-soft">
        {t.chrome.landing.footer}
      </footer>
    </div>
  );
}
