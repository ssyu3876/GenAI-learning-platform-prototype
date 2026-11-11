'use server';

import { cookies } from 'next/headers';
import { locales, type Locale } from './config';

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error('Invalid locale');
  }

  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}
