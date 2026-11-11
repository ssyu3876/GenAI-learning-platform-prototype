export const defaultLocale = 'en' as const;
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};
