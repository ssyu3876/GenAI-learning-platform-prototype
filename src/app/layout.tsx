import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getT } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t.chrome.metadata.title, template: '%s · Sprout' },
    description: t.chrome.metadata.description,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale === 'zh' ? 'zh-Hans' : 'en'} className="antialiased">
      <body className="min-h-screen text-ink">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
