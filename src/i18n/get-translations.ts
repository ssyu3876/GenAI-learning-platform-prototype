import type { Locale } from './config';
import { messages, type Translations } from './messages';
import { getLocale } from './request';

export { messages, type Translations };

/** Synchronous dictionary lookup when the locale is already known. */
export function getTranslations(locale: Locale): Translations {
  return messages[locale];
}

/** Locale + dictionary for a server component. */
export async function getT(): Promise<{ locale: Locale; t: Translations }> {
  const locale = await getLocale();
  return { locale, t: messages[locale] };
}
