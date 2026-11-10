// The full UI dictionary. Each namespace is a plain JSON object so both locales stay
// structurally identical (TypeScript checks that below). Content that lives in the
// database (course text, scenario text) is translated separately in ./content.
//
// Pure data: safe to import from client and server components.
import chromeEn from './locales/en/chrome.json';
import activitiesEn from './locales/en/activities.json';
import achievementsEn from './locales/en/achievements.json';
import adminEn from './locales/en/admin.json';
import aiTutorEn from './locales/en/aiTutor.json';
import classesEn from './locales/en/classes.json';
import coursesEn from './locales/en/courses.json';
import leaderboardEn from './locales/en/leaderboard.json';
import onboardingEn from './locales/en/onboarding.json';
import reviewEn from './locales/en/review.json';
import scenariosEn from './locales/en/scenarios.json';
import selfLearnEn from './locales/en/selfLearn.json';
import studioEn from './locales/en/studio.json';

import chromeZh from './locales/zh/chrome.json';
import activitiesZh from './locales/zh/activities.json';
import achievementsZh from './locales/zh/achievements.json';
import adminZh from './locales/zh/admin.json';
import aiTutorZh from './locales/zh/aiTutor.json';
import classesZh from './locales/zh/classes.json';
import coursesZh from './locales/zh/courses.json';
import leaderboardZh from './locales/zh/leaderboard.json';
import onboardingZh from './locales/zh/onboarding.json';
import reviewZh from './locales/zh/review.json';
import scenariosZh from './locales/zh/scenarios.json';
import selfLearnZh from './locales/zh/selfLearn.json';
import studioZh from './locales/zh/studio.json';

import type { Locale } from './config';

const en = {
  chrome: chromeEn,
  courses: coursesEn,
  activities: activitiesEn,
  aiTutor: aiTutorEn,
  leaderboard: leaderboardEn,
  studio: studioEn,
  classes: classesEn,
  selfLearn: selfLearnEn,
  admin: adminEn,
  review: reviewEn,
  scenarios: scenariosEn,
  achievements: achievementsEn,
  onboarding: onboardingEn,
};

export type Translations = typeof en;

// Assigning zh to the en shape makes a missing or extra key a compile error.
const zh: Translations = {
  chrome: chromeZh,
  courses: coursesZh,
  activities: activitiesZh,
  aiTutor: aiTutorZh,
  leaderboard: leaderboardZh,
  studio: studioZh,
  classes: classesZh,
  selfLearn: selfLearnZh,
  admin: adminZh,
  review: reviewZh,
  scenarios: scenariosZh,
  achievements: achievementsZh,
  onboarding: onboardingZh,
};

export const messages: Record<Locale, Translations> = { en, zh };
