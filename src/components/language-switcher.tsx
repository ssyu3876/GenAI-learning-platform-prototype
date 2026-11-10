'use client';

import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocale } from '@/i18n/actions';
import { localeNames, type Locale } from '@/i18n/config';
import { useT } from '@/i18n/client';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextLocale: Locale = currentLocale === 'en' ? 'zh' : 'en';

  function handleLocaleChange() {
    startTransition(async () => {
      await setLocale(nextLocale);
      // Re-render the server tree with the new cookie; no full page reload needed.
      router.refresh();
    });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleLocaleChange}
        disabled={isPending}
        className="flex items-center gap-2 rounded-pill border-2 border-line bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-cream disabled:opacity-50"
        title={nextLocale === 'zh' ? t.chrome.shell.switchToChinese : t.chrome.shell.switchToEnglish}
        aria-label={nextLocale === 'zh' ? t.chrome.shell.switchToChinese : t.chrome.shell.switchToEnglish}
      >
        <Languages className="h-4 w-4" />
        <span>{localeNames[nextLocale]}</span>
      </button>
    </div>
  );
}
