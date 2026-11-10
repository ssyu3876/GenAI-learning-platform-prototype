import type { Translations } from './get-translations';

// Navigation labels live in the module manifests (English) so the registry stays the one
// list of features. The shell renders them through this href → key map.
const NAV_KEYS: Record<string, keyof Translations['chrome']['nav']> = {
  '/home': 'home',
  '/courses': 'courses',
  '/create': 'learnAnything',
  '/review': 'review',
  '/leaderboard': 'leaderboard',
  '/classes': 'classes',
  '/scenarios': 'scenarios',
  '/badges': 'badges',
  '/studio': 'studio',
  '/admin': 'admin',
};

export function navLabel(href: string, fallback: string, t: Translations): string {
  const key = NAV_KEYS[href];
  return key ? t.chrome.nav[key] : fallback;
}

// The module registry stores English labels. Admin screens that receive labels without an
// href (the module list) still need the Chinese version.
const NAV_TEXT_KEYS: Record<string, keyof Translations['chrome']['nav']> = {
  Home: 'home',
  Courses: 'courses',
  'Learn anything': 'learnAnything',
  Review: 'review',
  Leaderboard: 'leaderboard',
  Classes: 'classes',
  Scenarios: 'scenarios',
  Badges: 'badges',
  Studio: 'studio',
  Admin: 'admin',
};

export function navLabelForText(label: string, t: Translations): string {
  const key = NAV_TEXT_KEYS[label];
  return key ? t.chrome.nav[key] : label;
}
