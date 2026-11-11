import { describe, expect, it } from 'vitest';
import { courseEditionFor, pickTrack, recommendCourses, type CourseForMatching, type OnboardingAnswers } from './recommend';

const catalog: CourseForMatching[] = [
  { id: 'basics', title: 'How Software Gets Built', tags: ['fundamentals', 'sdlc', 'requirements'], level: 'beginner', audience: 'everyone' },
  { id: 'agents', title: 'Working with AI Coding Agents', tags: ['ai-agents', 'prompting', 'code-review'], level: 'intermediate', audience: 'cs' },
  { id: 'people', title: 'People Skills for Tech Teams', tags: ['communication', 'teamwork', 'interview', 'soft-skills'], level: 'beginner', audience: 'everyone' },
];

const editionCatalog: CourseForMatching[] = [
  ...catalog,
  { id: 'agents-student', title: 'Working with AI Coding Agents · Student Edition', tags: ['ai-agents', 'student', 'labs'], level: 'intermediate', audience: 'everyone' },
  { id: 'agents-professional', title: 'Working with AI Coding Agents · Professional Edition', tags: ['ai-agents', 'professional'], level: 'intermediate', audience: 'everyone' },
];

const base: OnboardingAnswers = { background: 'non_cs', codingLevel: 0, goal: 'understand', interests: [], style: 'concepts' };

describe('recommendCourses', () => {
  it('puts fundamentals first for a non-CS beginner and the CS-only course last', () => {
    const ids = recommendCourses(base, catalog);
    expect(ids[0]).toBe('basics');
    expect(ids.at(-1)).toBe('agents');
  });

  it('puts the AI agents course first for a CS grad who wants AI skills', () => {
    const ids = recommendCourses({ ...base, background: 'cs_graduate', codingLevel: 3, goal: 'ai_skills', interests: ['ai-agents'] }, catalog);
    expect(ids[0]).toBe('agents');
  });

  it('leans towards people skills for interview-focused learners', () => {
    const ids = recommendCourses({ ...base, background: 'cs_student', codingLevel: 2, goal: 'career', interests: ['interview'] }, catalog);
    expect(ids[0]).toBe('people');
  });

  it('only offers the student edition to student identities', () => {
    for (const background of ['cs_student', 'non_cs'] as const) {
      const ids = recommendCourses({ ...base, background, codingLevel: 2, goal: 'ai_skills', interests: ['ai-agents'] }, editionCatalog);
      expect(ids).toContain('agents-student');
      expect(ids).not.toContain('agents-professional');
    }
  });

  it('only offers the professional edition to graduate and working identities', () => {
    for (const background of ['cs_graduate', 'other'] as const) {
      const ids = recommendCourses({ ...base, background, codingLevel: 2, goal: 'ai_skills', interests: ['ai-agents'] }, editionCatalog);
      expect(ids).toContain('agents-professional');
      expect(ids).not.toContain('agents-student');
    }
  });
});

describe('courseEditionFor', () => {
  it('maps the four onboarding identities to the two editions', () => {
    expect(courseEditionFor('cs_student')).toBe('student');
    expect(courseEditionFor('non_cs')).toBe('student');
    expect(courseEditionFor('cs_graduate')).toBe('professional');
    expect(courseEditionFor('other')).toBe('professional');
  });
});

describe('pickTrack', () => {
  it('hands-on learners who have coded a bit are builders', () => {
    expect(pickTrack({ ...base, codingLevel: 1, style: 'hands_on' })).toBe('builder');
  });
  it('people who never coded start as explorers even if they like hands-on', () => {
    expect(pickTrack({ ...base, codingLevel: 0, style: 'hands_on' })).toBe('explorer');
  });
});
