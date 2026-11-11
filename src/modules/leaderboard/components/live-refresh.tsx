'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';

/** Re-fetches the board every 30s while the tab is visible, so it feels live in class. */
export function LiveRefresh({ seconds = 30 }: { seconds?: number }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<string>('');

  useEffect(() => {
    // Time is only shown after the first refresh, so server and client render the same HTML
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        setUpdatedAt(new Date().toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }));
      }
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, locale]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft" aria-live="off">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-line bg-mint" />
      </span>
      {t.leaderboard.live}
      {updatedAt ? fmt(t.leaderboard.liveUpdated, { time: updatedAt }) : ''}
    </span>
  );
}
