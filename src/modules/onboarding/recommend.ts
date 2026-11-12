// Turns onboarding answers into a learner track and an ordered course path.
// Pure and deterministic (unit tested); the AI only writes the friendly welcome note.
import type { CourseAudience, CourseLevel, LearnerBackground, LearnerGoal, LearnerTrack } from '@/core/db/schema';

export type LearningStyle = 'concepts' | 'hands_on';
export type CourseEdition = 'student' | 'professional';

export interface OnboardingAnswers {
  background: LearnerBackground;
  codingLevel: 0 | 1 | 2 | 3;
  goal: LearnerGoal;
  interests: string[];
  style: LearningStyle;
}

export interface CourseForMatching {
  id: string;
  title: string;
  tags: string[];
  level: CourseLevel;
  audience: CourseAudience;
}

/**
 * The onboarding identity question has four options:
 * - cs_student: computer science, still studying
 * - non_cs: another subject (business, design, arts, science…), usually still studying
 * - cs_graduate: computer science, graduated and preparing for a technical job
 * - other: working, changing career, or just curious
 *
 * No extra question is needed: these four map to the two editions of the AI agents course.
 */
export function courseEditionFor(background: LearnerBackground): CourseEdition {
  return background === 'cs_student' || background === 'non_cs' ? 'student' : 'professional';
}

function editionOf(course: CourseForMatching): CourseEdition | null {
  if (course.tags.includes('student')) return 'student';
  if (course.tags.includes('professional')) return 'professional';
  return null;
}

export const INTEREST_OPTIONS = [
  { id: 'ai-agents', label: 'AI coding agents' },
  { id: 'teamwork', label: 'Teamwork & communication' },
  { id: 'interview', label: 'Job interviews' },
  { id: 'requirements', label: 'Working out what to build' },
  { id: 'testing', label: 'Testing & quality' },
  { id: 'product', label: 'Product thinking' },
] as const;

const GOAL_TAGS: Record<LearnerGoal, string[]> = {
  understand: ['fundamentals', 'sdlc', 'teamwork'],
  career: ['interview', 'communication', 'soft-skills', 'code-review'],
  build: ['requirements', 'fundamentals', 'ai-agents', 'testing'],
  ai_skills: ['ai-agents', 'prompting', 'code-review'],
};

export function pickTrack(a: OnboardingAnswers): LearnerTrack {
  return (a.style === 'hands_on' && a.codingLevel >= 1) || a.codingLevel >= 3 ? 'builder' : 'explorer';
}

const isCs = (b: LearnerBackground) => b === 'cs_student' || b === 'cs_graduate';

export function scoreCourse(a: OnboardingAnswers, c: CourseForMatching): number {
  let score = 0;
  const tags = new Set(c.tags.map((t) => t.toLowerCase()));

  if (c.audience === 'everyone') score += 1;
  if (c.audience === 'non_cs') score += isCs(a.background) ? -1 : 3;
  if (c.audience === 'cs') score += isCs(a.background) || a.codingLevel >= 2 ? 3 : a.codingLevel === 0 ? -4 : -1;

  for (const t of GOAL_TAGS[a.goal]) if (tags.has(t)) score += 2;
  for (const i of a.interests) if (tags.has(i)) score += 2;

  if (c.level === 'beginner' && a.codingLevel <= 1) score += 1;
  if (c.level !== 'beginner' && a.codingLevel >= 2) score += 1;
  if (c.level === 'advanced' && a.codingLevel === 0) score -= 2;

  // Gentle nudge: fundamentals first for people new to the field
  if (tags.has('fundamentals') && !isCs(a.background)) score += 1;
  return score;
}

/** Ordered course ids, best match first. */
export function recommendCourses(a: OnboardingAnswers, catalog: CourseForMatching[], limit = 4): string[] {
  // The AI agents course exists as two editions. Show learners only the edition that matches
  // their onboarding identity; other courses have no edition tag and stay available to all.
  const wanted = courseEditionFor(a.background);
  const hasWantedEdition = catalog.some((c) => editionOf(c) === wanted);
  const eligible = hasWantedEdition
    ? catalog.filter((c) => editionOf(c) === null || editionOf(c) === wanted)
    : catalog;

  return eligible
    .map((c) => ({ id: c.id, title: c.title, s: scoreCourse(a, c) }))
    .sort((x, y) => y.s - x.s || x.title.localeCompare(y.title))
    .slice(0, limit)
    .map((c) => c.id);
}
