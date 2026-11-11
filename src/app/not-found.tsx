import Link from 'next/link';
import { Pip, buttonClasses } from '@/components/ui';
import { getT } from '@/i18n';

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Pip size={120} mood="think" />
      <h1 className="text-3xl font-bold">{t.chrome.notFound.title}</h1>
      <p className="max-w-md text-ink-soft">{t.chrome.notFound.body}</p>
      <Link href="/home" className={buttonClasses('primary')}>
        {t.chrome.notFound.home}
      </Link>
    </div>
  );
}
