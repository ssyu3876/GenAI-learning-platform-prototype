'use client';

// Client-side locale context. The root layout sets the locale it read from the cookie,
// so client components never have to read document.cookie or import server code.
import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './config';
import { messages, type Translations } from './messages';

const LocaleContext = createContext<Locale>('en');

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** All UI strings for the active locale. */
export function useT(): Translations {
  return messages[useContext(LocaleContext)];
}
