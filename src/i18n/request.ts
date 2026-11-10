import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;

  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }

  return defaultLocale;
}
