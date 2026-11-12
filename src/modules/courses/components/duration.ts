import type { Translations } from '@/i18n/messages';

/**
 * Course cards show minutes for short courses and hours for book-length ones. 204 minutes
 * becomes 3.5 hours; 1804 minutes becomes 30 hours. Lessons keep their exact minute labels.
 */
export function courseDuration(minutes: number, t: Translations): string {
  if (minutes < 150) return `${minutes} ${t.chrome.common.min}`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `${hours} ${t.chrome.common.hours}`;
}
