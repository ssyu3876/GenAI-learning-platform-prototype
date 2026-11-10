import Link from 'next/link';
import type { ReactNode } from 'react';
import { Pip } from '@/components/ui';
import { getT } from '@/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { locale } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <Pip size={48} mood="cheer" />
        <span className="font-display text-3xl font-bold">Sprout</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <div className="fixed bottom-4 left-4 z-40">
        <LanguageSwitcher currentLocale={locale} />
      </div>
    </div>
  );
}
