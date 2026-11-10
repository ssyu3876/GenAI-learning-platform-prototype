import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import type { ReactNode } from 'react';
import { getT } from '@/i18n';
import { LocaleProvider } from '@/i18n/client';
import './globals.css';

const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], weight: ['500', '600', '700'] });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });

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
    <html lang={locale === 'zh' ? 'zh-Hans' : 'en'} className={`${fredoka.variable} ${nunito.variable} antialiased`}>
      <body className="min-h-screen text-ink">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
