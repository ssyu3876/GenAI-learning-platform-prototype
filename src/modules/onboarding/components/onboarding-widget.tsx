import Link from 'next/link';
import { eq, inArray } from 'drizzle-orm';
import { Check, Compass, RefreshCw } from 'lucide-react';
import { getDb } from '@/core/db/client';
import { courses, learnerProfiles } from '@/core/db/schema';
import { getCourseProgress } from '@/core/progress/service';
import type { HomeWidgetProps } from '@/core/types';
import { asTint, Badge, buttonClasses, Card, cn, Pip, TINT_SOLID } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { localizeContent } from '@/i18n/content';

export async function OnboardingWidget({ user }: HomeWidgetProps) {
  const { locale, t } = await getT();

  const TRACK_LABEL = {
    explorer: t.onboarding.widget.explorerTrack,
    builder: t.onboarding.widget.builderTrack,
  } as const;

  const db = await getDb();
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, user.id)).limit(1);

  if (!profile) {
    return (
      <Card tint="mint" className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <Pip mood="wow" size={88} float />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t.onboarding.widget.letPipPlan}</h2>
          <p className="mt-1 text-ink-soft">{t.onboarding.widget.fiveQuestions}</p>
        </div>
        <Link href="/onboarding" className={buttonClasses('primary', 'lg')}>
          <Compass className="h-5 w-5" /> {t.onboarding.widget.start}
        </Link>
      </Card>
    );
  }

  const ids = profile.recommendedCourseIds;
  const rawRows = ids.length
    ? await db
        .select({ id: courses.id, slug: courses.slug, title: courses.title, emoji: courses.emoji, color: courses.color })
        .from(courses)
        .where(inArray(courses.id, ids))
    : [];
  const rows = localizeContent(rawRows, locale);
  const path = ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  const welcomeNote = profile.welcomeNote ? localizeContent(profile.welcomeNote, locale) : null;
  const progress = await getCourseProgress(user.id, ids);
  const nextIndex = path.findIndex((c) => (progress.get(c.id)?.percent ?? 0) < 100);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t.onboarding.widget.yourPath}</h2>
          <Badge tint="mint" className="mt-1">
            {TRACK_LABEL[profile.track]}
          </Badge>
        </div>
        <Link href="/onboarding" className={buttonClasses('ghost', 'sm')}>
          <RefreshCw className="h-4 w-4" /> {t.onboarding.widget.retake}
        </Link>
      </div>
      {welcomeNote ? <p className="mt-3 max-w-3xl text-ink-soft">{welcomeNote}</p> : null}

      <ol className="mt-5 flex flex-col gap-3 md:flex-row md:items-stretch">
        {path.map((c, i) => {
          const pct = progress.get(c.id)?.percent ?? 0;
          const done = pct === 100;
          const isNext = i === nextIndex;
          const tint = asTint(c.color);
          const status = isNext ? t.onboarding.widget.upNext : done ? t.onboarding.widget.done : null;
          const stepLabel = status
            ? `${fmt(t.onboarding.widget.step, { current: i + 1 })} · ${status}`
            : fmt(t.onboarding.widget.step, { current: i + 1 });
          return (
            <li key={c.id} className="flex flex-1 items-center gap-3 md:flex-col md:items-stretch">
              <Link
                href={`/courses/${c.slug}`}
                className={cn(
                  'flex flex-1 items-center gap-3 rounded-blob border-2 border-line bg-paper p-3 transition hover:-translate-y-0.5 hover:shadow-sticker-sm',
                  isNext && 'bg-butter-soft shadow-sticker-sm',
                )}
              >
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-line text-2xl', TINT_SOLID[tint])} aria-hidden>
                  {done ? <Check className="h-6 w-6" /> : c.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-ink-soft">{stepLabel}</span>
                  <span className="block font-display leading-tight font-semibold">{c.title}</span>
                  <span className="text-xs text-ink-soft">{pct}%</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
