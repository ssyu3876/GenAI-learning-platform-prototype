// Helpers for the AI features: every generated sentence should come back in the language the
// learner is using. Prompts stay in English (models follow them well) with one explicit
// output-language line; offline mocks have a Chinese branch.
import type { Locale } from './config';

export function outputLanguage(locale: Locale): string {
  return locale === 'zh'
    ? 'Write every user-facing sentence in Simplified Chinese (简体中文), natural and plain. Keep code, identifiers, product names and people names as they are.'
    : 'Write every user-facing sentence in English, natural and plain.';
}

/** Picks the Chinese branch when the app is in Chinese. */
export function byLocale<T>(locale: Locale, english: T, chinese: T): T {
  return locale === 'zh' ? chinese : english;
}
