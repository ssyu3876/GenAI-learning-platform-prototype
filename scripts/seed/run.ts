// Demo data: accounts, 3 built-in courses (+3 small extras), a class, and ~3 weeks of
// simulated learning history so the leaderboard, dashboards and admin pages have content.
// Deterministic (seeded PRNG) so every teammate gets the same demo.
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { hashPassword } from '@/core/auth/password';
import { saveCourseDraft, type CourseDraft } from '@/core/content/draft';
import { getCourseOutline, type CourseOutline } from '@/core/content/queries';
import { getDb } from '@/core/db/client';
import {
  activityAttempts,
  aiUsage,
  classCourses,
  classes,
  classMembers,
  enrollments,
  learnerProfiles,
  learningEvents,
  lessonCompletions,
  users,
  type Activity,
  type LearnerBackground,
  type LearnerGoal,
  type UserRole,
} from '@/core/db/schema';
import { newId, randomString } from '@/core/ids';
import { COURSE_COMPLETE_XP, LESSON_COMPLETE_XP, xpForScore } from '@/core/progress/xp';
import { codingConfigSchema } from '@/modules/activities/coding/schema';
import { quizConfigSchema } from '@/modules/activities/quiz/schema';
import { roleplayConfigSchema } from '@/modules/activities/roleplay/schema';
import { sequenceConfigSchema } from '@/modules/activities/sequence/schema';
import { slidesConfigSchema } from '@/modules/activities/slides/schema';
import { sortConfigSchema } from '@/modules/activities/sort/schema';
import { leaderboardPrefs } from '@/modules/leaderboard/schema';
import { agentsCourse } from './course-agents';
import { basicsCourse } from './course-basics';
import { databasesDraft, gitCourse, photographyCourse } from './course-extras';
import { peopleCourse } from './course-people';

export const DEMO_PASSWORD = 'sprout123';
const DAY = 24 * 60 * 60 * 1000;

// Seed configs go through the same zod schemas the app uses, so a typo fails loudly here.
const SCHEMAS: Record<string, z.ZodType<unknown>> = {
  quiz: quizConfigSchema,
  sort: sortConfigSchema,
  sequence: sequenceConfigSchema,
  coding: codingConfigSchema,
  slides: slidesConfigSchema,
  roleplay: roleplayConfigSchema,
};

function validated(draft: CourseDraft): CourseDraft {
  return {
    ...draft,
    lessons: draft.lessons.map((l) => ({
      ...l,
      activities: l.activities.map((a) => {
        const schema = SCHEMAS[a.type];
        if (!schema) throw new Error(`Seed: unknown activity type ${a.type}`);
        const parsed = schema.safeParse(a.config);
        if (!parsed.success) throw new Error(`Seed: invalid ${a.type} "${a.title}": ${parsed.error.message}`);
        return { ...a, config: parsed.data };
      }),
    })),
  };
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261017);
const between = (min: number, max: number) => min + rand() * (max - min);
// Separate stream for quiz answers so they do not shift the rest of the demo history.
const answerRand = mulberry32(20261020);

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Quiz answers that match a score, saved in attempt.detail like the quiz player does.
 * Some questions are harder than others, and most misses land on the same tempting wrong
 * option, so the mistake notebook and class insights have a realistic pattern to show.
 */
function simulatedQuizAnswers(activity: Activity, score: number): { answers: number[] } | null {
  if (activity.type !== 'quiz') return null;
  const parsed = quizConfigSchema.safeParse(activity.config);
  if (!parsed.success) return null;
  const questions = parsed.data.questions;
  const wrongCount = questions.length - Math.round((score / 100) * questions.length);
  const weight = questions.map((_, i) => 0.15 + (hashString(`${activity.title}:${i}`) % 100) / 100);
  const wrong = new Set<number>();
  while (wrong.size < wrongCount) {
    const open = questions.map((_, i) => i).filter((i) => !wrong.has(i));
    let r = answerRand() * open.reduce((sum, i) => sum + weight[i]!, 0);
    const pick = open.find((i) => (r -= weight[i]!) <= 0) ?? open[open.length - 1]!;
    wrong.add(pick);
  }
  return {
    answers: questions.map((q, i) => {
      if (!wrong.has(i)) return q.answerIndex;
      const others = q.options.map((_, o) => o).filter((o) => o !== q.answerIndex);
      const trap = others[hashString(`${activity.title}:${i}:trap`) % others.length]!;
      return answerRand() < 0.7 ? trap : others[Math.floor(answerRand() * others.length)]!;
    }),
  };
}

/** A moment `daysAgo` days back, at a plausible study hour (UTC). */
function at(daysAgo: number, hour = Math.floor(between(1, 14))): Date {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setUTCHours(hour, Math.floor(between(0, 59)), 0, 0);
  return d.getTime() > Date.now() ? new Date(Date.now() - 5 * 60 * 1000) : d;
}

interface SimLearner {
  name: string;
  email: string;
  inClass: boolean;
  /** share of all activities completed, 0-1 */
  diligence: number;
  /** typical score, 0-100 */
  skill: number;
  /** 'steady' spreads activity, 'recent' bunches it in the last 7 days, 'faded' stops a week ago */
  pattern: 'steady' | 'recent' | 'faded';
  courseOrder: number[];
  nickname?: string;
  hidden?: boolean;
  background?: LearnerBackground;
}

const CLASSMATES: SimLearner[] = [
  { name: 'Ben Lee', email: 'ben@demo.dev', inClass: true, diligence: 0.9, skill: 88, pattern: 'steady', courseOrder: [0, 1, 2], background: 'cs_student' },
  { name: 'Chloe Ng', email: 'chloe@demo.dev', inClass: true, diligence: 0.75, skill: 92, pattern: 'recent', courseOrder: [1, 0, 2], background: 'cs_graduate' },
  { name: 'Daniel Ho', email: 'daniel@demo.dev', inClass: true, diligence: 0.55, skill: 70, pattern: 'faded', courseOrder: [0, 2, 1], background: 'non_cs' },
  { name: 'Emma Chow', email: 'emma@demo.dev', inClass: true, diligence: 0.68, skill: 81, pattern: 'steady', courseOrder: [2, 0, 1], background: 'non_cs' },
  { name: 'Felix Tang', email: 'felix@demo.dev', inClass: true, diligence: 0.62, skill: 76, pattern: 'recent', courseOrder: [1, 0, 2], nickname: 'BugHunter', background: 'cs_student' },
  { name: 'Grace Yip', email: 'grace@demo.dev', inClass: true, diligence: 0.4, skill: 85, pattern: 'steady', courseOrder: [0, 1, 2], background: 'other' },
  { name: 'Henry Kwok', email: 'henry@demo.dev', inClass: true, diligence: 0.33, skill: 64, pattern: 'faded', courseOrder: [0, 1, 2], background: 'non_cs' },
  { name: 'Ivy Lam', email: 'ivy@demo.dev', inClass: true, diligence: 0.5, skill: 79, pattern: 'recent', courseOrder: [2, 1, 0], hidden: true, background: 'cs_student' },
  { name: 'Jason Wu', email: 'jason@demo.dev', inClass: true, diligence: 0.25, skill: 58, pattern: 'steady', courseOrder: [0, 2, 1], background: 'non_cs' },
  { name: 'Karen Siu', email: 'karen@demo.dev', inClass: true, diligence: 0.45, skill: 90, pattern: 'recent', courseOrder: [1, 2, 0], background: 'cs_graduate' },
  { name: 'Leo Cheung', email: 'leo@demo.dev', inClass: true, diligence: 0.15, skill: 66, pattern: 'faded', courseOrder: [0, 1, 2], background: 'other' },
  { name: 'Nina Fong', email: 'nina@demo.dev', inClass: true, diligence: 0.58, skill: 74, pattern: 'steady', courseOrder: [2, 0, 1], background: 'non_cs' },
  { name: 'Oscar Mak', email: 'oscar@demo.dev', inClass: true, diligence: 0.36, skill: 83, pattern: 'recent', courseOrder: [1, 0, 2], nickname: 'NullPointer', background: 'cs_student' },
  // Not in Dr. Chan's class: only on the "Everyone" board
  { name: 'Priya Shah', email: 'priya@demo.dev', inClass: false, diligence: 0.85, skill: 87, pattern: 'steady', courseOrder: [1, 2, 0], background: 'cs_graduate' },
  { name: 'Ryan Lo', email: 'ryan@demo.dev', inClass: false, diligence: 0.42, skill: 72, pattern: 'recent', courseOrder: [0, 1, 2], background: 'non_cs' },
  { name: 'Sofia Chen', email: 'sofia@demo.dev', inClass: false, diligence: 0.6, skill: 80, pattern: 'faded', courseOrder: [2, 1, 0], background: 'other' },
];

interface Step {
  course: CourseOutline;
  lessonIndex: number;
  activityIndex: number;
}

function stepsInOrder(courses: CourseOutline[], order: number[]): Step[] {
  const out: Step[] = [];
  for (const ci of order) {
    const course = courses[ci]!;
    course.lessons.forEach((l, li) => l.activities.forEach((_, ai) => out.push({ course, lessonIndex: li, activityIndex: ai })));
  }
  return out;
}

function pickDays(pattern: SimLearner['pattern'], count: number): number[] {
  const range = pattern === 'recent' ? [0, 6] : pattern === 'faded' ? [8, 20] : [0, 20];
  const days = new Set<number>();
  let guard = 0;
  while (days.size < count && guard++ < 200) {
    days.add(Math.floor(between(range[0]!, range[1]! + 1)));
  }
  return [...days].sort((a, b) => b - a); // oldest first
}

interface Batch {
  events: (typeof learningEvents.$inferInsert)[];
  attempts: (typeof activityAttempts.$inferInsert)[];
  completions: (typeof lessonCompletions.$inferInsert)[];
  enrollments: (typeof enrollments.$inferInsert)[];
}

/** Turns a list of (step, time, score) into rows, firing lesson/course completion like the app does. */
function simulate(userId: string, plan: { step: Step; when: Date; score: number }[], batch: Batch): Date | null {
  const enrolled = new Map<string, typeof enrollments.$inferInsert>();
  const doneInLesson = new Map<string, number>();
  const lessonsDone = new Map<string, number>();
  let last: Date | null = null;

  for (const { step, when, score } of plan) {
    const { course } = step;
    const lesson = course.lessons[step.lessonIndex]!;
    const activity = lesson.activities[step.activityIndex]!;
    if (!enrolled.has(course.id)) {
      const row = { userId, courseId: course.id, enrolledAt: new Date(when.getTime() - 60_000), completedAt: null as Date | null };
      enrolled.set(course.id, row);
      batch.events.push({ id: newId('event'), userId, type: 'course.enrolled', courseId: course.id, xp: 0, createdAt: row.enrolledAt });
    }
    const xp = xpForScore(score, activity.xpReward);
    batch.attempts.push({ id: newId('attempt'), userId, activityId: activity.id, courseId: course.id, bestScore: score, xpEarned: xp, detail: simulatedQuizAnswers(activity, score), completedAt: when, updatedAt: when });
    batch.events.push({ id: newId('event'), userId, type: 'activity.completed', courseId: course.id, lessonId: lesson.id, activityId: activity.id, xp, payload: { score, attempt: 1 }, createdAt: when });

    const n = (doneInLesson.get(lesson.id) ?? 0) + 1;
    doneInLesson.set(lesson.id, n);
    if (n === lesson.activities.length) {
      const t = new Date(when.getTime() + 1000);
      batch.completions.push({ userId, lessonId: lesson.id, courseId: course.id, completedAt: t });
      batch.events.push({ id: newId('event'), userId, type: 'lesson.completed', courseId: course.id, lessonId: lesson.id, xp: LESSON_COMPLETE_XP, createdAt: t });
      const ld = (lessonsDone.get(course.id) ?? 0) + 1;
      lessonsDone.set(course.id, ld);
      if (ld === course.lessons.length) {
        const t2 = new Date(when.getTime() + 2000);
        enrolled.get(course.id)!.completedAt = t2;
        batch.events.push({ id: newId('event'), userId, type: 'course.completed', courseId: course.id, xp: COURSE_COMPLETE_XP, createdAt: t2 });
      }
    }
    last = when;
  }
  batch.enrollments.push(...enrolled.values());
  return last;
}

async function insertChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += 200) await insert(rows.slice(i, i + 200));
}

export async function runSeed() {
  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'admin@demo.dev')).limit(1);
  if (existing) {
    console.info('Seed skipped: demo data already present (run `npm run db:reset` to start over).');
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const makeUser = async (email: string, name: string, role: UserRole, lastActiveAt?: Date) => {
    const id = newId('user');
    await db.insert(users).values({ id, email, name, role, passwordHash, avatarSeed: randomString(8), lastActiveAt: lastActiveAt ?? null });
    return id;
  };

  // --- staff & named demo learners
  await makeUser('admin@demo.dev', 'Sam Admin', 'admin', new Date());
  const instructorId = await makeUser('instructor@demo.dev', 'Dr. Chan', 'instructor', new Date());
  const miaId = await makeUser('learner@demo.dev', 'Mia Wong', 'learner');
  await makeUser('new@demo.dev', 'Alex Kim', 'learner');

  // --- courses
  const seedOpts = { ownerId: null, source: 'seed' as const, status: 'published' as const, visibility: 'public' as const };
  const basics = await saveCourseDraft(validated(basicsCourse), { ...seedOpts, slug: 'how-software-gets-built' });
  const agents = await saveCourseDraft(validated(agentsCourse), { ...seedOpts, slug: 'working-with-ai-coding-agents' });
  const people = await saveCourseDraft(validated(peopleCourse), { ...seedOpts, slug: 'people-skills-for-tech-teams' });
  await saveCourseDraft(validated(photographyCourse), { ownerId: miaId, source: 'learner_ai', status: 'published', visibility: 'private' });
  await saveCourseDraft(validated(databasesDraft), { ownerId: instructorId, source: 'manual', status: 'draft', visibility: 'private' });
  await saveCourseDraft(validated(gitCourse), { ownerId: instructorId, source: 'ai', status: 'pending_review', visibility: 'public' });
  const outlines = (await Promise.all([basics.id, agents.id, people.id].map((id) => getCourseOutline(id)))) as CourseOutline[];

  // --- class
  const classId = newId('class');
  await db.insert(classes).values({
    id: classId,
    name: 'COMP Software Engineering · Group A',
    description: 'Fall 2026 tutorial group. Weekly mini-courses before each lecture.',
    instructorId,
    inviteCode: 'SPROUT',
  });
  await db.insert(classCourses).values(outlines.map((o) => ({ classId, courseId: o.id })));

  const batch: Batch = { events: [], attempts: [], completions: [], enrollments: [] };

  // --- Mia: hand-written history so the demo has a story (mid-table, small streak, 2 courses started)
  const miaPlan = [
    { step: { course: outlines[0]!, lessonIndex: 0, activityIndex: 0 }, when: at(4, 3), score: 100 },
    { step: { course: outlines[0]!, lessonIndex: 0, activityIndex: 1 }, when: at(4, 4), score: 71 },
    { step: { course: outlines[0]!, lessonIndex: 1, activityIndex: 0 }, when: at(2, 5), score: 88 },
    { step: { course: outlines[0]!, lessonIndex: 1, activityIndex: 1 }, when: at(1, 9), score: 67 },
    { step: { course: outlines[1]!, lessonIndex: 0, activityIndex: 0 }, when: at(0, 1), score: 100 },
  ];
  const miaLast = simulate(miaId, miaPlan, batch);
  await db.update(users).set({ lastActiveAt: miaLast }).where(eq(users.id, miaId));
  await db.insert(classMembers).values({ classId, userId: miaId, joinedAt: at(6) });
  batch.events.push({ id: newId('event'), userId: miaId, type: 'onboarding.completed', xp: 0, payload: { track: 'explorer' }, createdAt: at(5, 2) });
  await db.insert(learnerProfiles).values({
    userId: miaId,
    background: 'non_cs',
    goal: 'career',
    codingLevel: 1,
    interests: ['teamwork', 'ai-agents'],
    track: 'explorer',
    recommendedCourseIds: [basics.id, people.id, agents.id],
    welcomeNote:
      'Nice to meet you, Mia! Since you are coming from business, we start with how software teams actually work, then the people side, then how to work alongside AI tools.',
  });

  // --- simulated classmates
  for (const s of CLASSMATES) {
    const steps = stepsInOrder(outlines, s.courseOrder);
    const count = Math.max(1, Math.round(steps.length * s.diligence));
    const chosen = steps.slice(0, count);
    const days = pickDays(s.pattern, Math.max(2, Math.ceil(count / 3)));
    const plan = chosen.map((step, i) => {
      const day = days[Math.min(days.length - 1, Math.floor((i / chosen.length) * days.length))]!;
      const score = Math.round(Math.max(20, Math.min(100, s.skill + between(-22, 14))));
      return { step, when: at(day, 1 + ((i * 37) % 13)), score };
    });
    plan.sort((a, b) => a.when.getTime() - b.when.getTime());
    const id = await makeUser(s.email, s.name, 'learner');
    const last = simulate(id, plan, batch);
    await db.update(users).set({ lastActiveAt: last }).where(eq(users.id, id));
    if (s.inClass) await db.insert(classMembers).values({ classId, userId: id, joinedAt: at(20) });
    if (s.nickname || s.hidden) {
      await db.insert(leaderboardPrefs).values({ userId: id, displayMode: s.hidden ? 'hidden' : 'nickname', nickname: s.nickname ?? null });
    }
    const codingLevel = (s.background === 'non_cs' ? 0 : s.background === 'other' ? 1 : 2) as 0 | 1 | 2;
    const goals: LearnerGoal[] = ['understand', 'career', 'build', 'ai_skills'];
    await db.insert(learnerProfiles).values({
      userId: id,
      background: s.background ?? 'other',
      goal: goals[Math.floor(between(0, 4))]!,
      codingLevel,
      interests: [],
      track: codingLevel >= 2 ? 'builder' : 'explorer',
      recommendedCourseIds: s.courseOrder.map((i) => outlines[i]!.id),
    });
  }

  await insertChunks(batch.enrollments, (c) => db.insert(enrollments).values(c));
  await insertChunks(batch.attempts, (c) => db.insert(activityAttempts).values(c));
  await insertChunks(batch.completions, (c) => db.insert(lessonCompletions).values(c));
  await insertChunks(batch.events, (c) => db.insert(learningEvents).values(c));

  // --- AI usage history (all marked mocked: the demo never pretends real calls happened)
  const features = ['tutor.chat', 'activities.roleplay_chat', 'activities.roleplay_score', 'courses.adapt_lesson', 'studio.generate_course', 'activities.coding_hint'];
  const usage = Array.from({ length: 140 }, () => ({
    id: newId('aiUsage'),
    userId: miaId,
    feature: features[Math.floor(between(0, features.length))]!,
    model: 'mock',
    mocked: true,
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: Math.round(between(5, 40)),
    createdAt: at(Math.floor(between(0, 14))),
  }));
  await insertChunks(usage, (c) => db.insert(aiUsage).values(c));

  console.info(
    'Seeded: 3 staff/demo accounts + %d classmates, 6 courses, 1 class (invite code SPROUT), %d learning events. Password for every demo account: %s',
    CLASSMATES.length,
    batch.events.length,
    DEMO_PASSWORD,
  );
}
