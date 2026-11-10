// Content localisation: course text, scenario text and demo copy live in the database or in
// TypeScript, always in English. The Chinese versions are stored next to this file, and this
// module flattens each English/Chinese pair into one dictionary of display strings.
//
// Why a string dictionary instead of per-row columns: seed content is fixed, the app can run
// in either language without a migration, and the same dictionary also covers strings that
// the engines compose at runtime (scenario endings, review questions). Lookup misses simply
// fall back to the original English, so user-generated courses stay as their author wrote
// them.
//
// Server-only in practice: it imports seed/scenario data. Never import from a 'use client'
// file.
import type { Locale } from '../config';
import { agentsCourse } from '../../../scripts/seed/course-agents';
import { basicsCourse } from '../../../scripts/seed/course-basics';
import { databasesDraft, gitCourse, photographyCourse } from '../../../scripts/seed/course-extras';
import { peopleCourse } from '../../../scripts/seed/course-people';
import { INTERVIEW_TYPES } from '@/modules/scenarios/content/interview';
import { SHIP_IT } from '@/modules/scenarios/content/ship-it';
import { SPRINT_ZERO_COPY } from '@/modules/scenarios/content/sprint-zero';
import { agentsCourseZh } from './zh/course-agents';
import { basicsCourseZh } from './zh/course-basics';
import { databasesDraftZh, gitCourseZh, photographyCourseZh } from './zh/course-extras';
import { peopleCourseZh } from './zh/course-people';
import { INTERVIEW_TYPES_ZH } from './zh/interview';
import { SHIP_IT_ZH } from './zh/ship-it';
import { SPRINT_ZERO_COPY_ZH } from './zh/sprint-zero';
import { ENGINE_ZH } from './zh/engine';
import { DEMO_ZH } from './zh/demo';
import { DEFAULTS_ZH } from './zh/defaults';

const dictionary: Record<string, string> = {};

// These fields are identifiers, enums or structural values, not display text. The dictionary
// must never rewrite them: a translated `id`, `key` or `type` would break scoring and state.
const IDENTIFIER_KEYS = new Set([
  'id',
  'key',
  'type',
  'slug',
  'kind',
  'good',
  'action',
  'version',
  'color',
  'emoji',
  'level',
  'audience',
  'answerIndex',
  'questionId',
  'courseId',
  'lessonId',
  'activityId',
  'turnId',
  'choiceId',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Walks the English and Chinese copies side by side and records every translated string. */
function collect(english: unknown, chinese: unknown, out: Record<string, string>) {
  if (typeof english === 'string') {
    if (typeof chinese === 'string' && chinese.trim() && chinese !== english) out[english] = chinese;
    return;
  }
  if (Array.isArray(english)) {
    if (!Array.isArray(chinese)) return;
    english.forEach((item, i) => collect(item, chinese[i], out));
    return;
  }
  if (isPlainObject(english)) {
    if (!isPlainObject(chinese)) return;
    for (const key of Object.keys(english)) {
      if (IDENTIFIER_KEYS.has(key)) continue;
      collect(english[key], chinese[key], out);
    }
  }
}

collect(basicsCourse, basicsCourseZh, dictionary);
collect(agentsCourse, agentsCourseZh, dictionary);
collect(peopleCourse, peopleCourseZh, dictionary);
collect(databasesDraft, databasesDraftZh, dictionary);
collect(gitCourse, gitCourseZh, dictionary);
collect(photographyCourse, photographyCourseZh, dictionary);
collect(SHIP_IT, SHIP_IT_ZH, dictionary);
collect(SPRINT_ZERO_COPY, SPRINT_ZERO_COPY_ZH, dictionary);
collect(INTERVIEW_TYPES, INTERVIEW_TYPES_ZH, dictionary);
// Engine copy is a hand-written map (the English originals are inside functions).
Object.assign(dictionary, ENGINE_ZH, DEMO_ZH, DEFAULTS_ZH);

function walk(value: unknown): unknown {
  if (typeof value === 'string') return dictionary[value] ?? value;
  if (typeof value === 'function') {
    const fn = value as (...args: unknown[]) => unknown;
    const wrapped = (...args: unknown[]) => walk(fn(...args));
    return wrapped;
  }
  if (Array.isArray(value)) return value.map(walk);
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = IDENTIFIER_KEYS.has(key) ? item : walk(item);
  }
  return out;
}

/**
 * Returns `value` with every known English display string replaced by its Chinese text.
 * Dates, numbers, ids and unknown content are preserved unchanged.
 */
export function localizeContent<T>(value: T, locale: Locale): T {
  if (locale === 'en') return value;
  return walk(value) as T;
}

/** Used by tests to check coverage without exposing the mutable dictionary. */
export function contentDictionarySize(): number {
  return Object.keys(dictionary).length;
}
