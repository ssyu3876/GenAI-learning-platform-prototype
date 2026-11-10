// Leaderboard read model. Everything is derived from learning_events (XP, streaks,
// activity counts) and lesson_completions (course race), so no other module is involved.
import { and, count, desc, eq, gte, inArray, lt, sql, sum } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  classCourses,
  classes,
  classMembers,
  courses,
  enrollments,
  learningEvents,
  lessonCompletions,
  lessons,
  users,
} from '@/core/db/schema';
import { computeStreak, getLevel } from '@/core/progress/xp';
import type { SessionUser } from '@/core/types';
import { chaseInfo, pickHighlights, rankEntries } from './ranking';
import { leaderboardClassSettings, leaderboardPrefs, type DisplayMode } from './schema';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';

export type Period = 'week' | 'month' | 'all';
export const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];
const DAY = 24 * 60 * 60 * 1000;
const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { week: 7, month: 30 };
const TYPICAL_ACTIVITY_XP = 20;

export interface Scope {
  id: string; // "global" or a class id
  label: string;
  isClass: boolean;
  enabled: boolean;
  canManage: boolean;
}

export async function getScopes(user: SessionUser): Promise<Scope[]> {
  const db = await getDb();
  const rows =
    user.role === 'learner'
      ? await db
          .select({ id: classes.id, name: classes.name, instructorId: classes.instructorId })
          .from(classMembers)
          .innerJoin(classes, eq(classes.id, classMembers.classId))
          .where(eq(classMembers.userId, user.id))
      : await db
          .select({ id: classes.id, name: classes.name, instructorId: classes.instructorId })
          .from(classes)
          .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id));
  const settings = rows.length
    ? await db.select().from(leaderboardClassSettings).where(inArray(leaderboardClassSettings.classId, rows.map((r) => r.id)))
    : [];
  const enabled = new Map(settings.map((s) => [s.classId, s.enabled]));
  const locale = await getLocale();
  return localizeContent(
    [
      ...rows.map((r) => ({
        id: r.id,
        label: r.name,
        isClass: true,
        enabled: enabled.get(r.id) ?? true,
        canManage: user.role === 'admin' || r.instructorId === user.id,
      })),
      { id: 'global', label: 'Everyone', isClass: false, enabled: true, canManage: false },
    ],
    locale,
  );
}

async function participantIds(scope: Scope): Promise<string[]> {
  const db = await getDb();
  if (scope.isClass) {
    const rows = await db
      .select({ id: classMembers.userId })
      .from(classMembers)
      .innerJoin(users, eq(users.id, classMembers.userId))
      .where(and(eq(classMembers.classId, scope.id), eq(users.role, 'learner')));
    return rows.map((r) => r.id);
  }
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'learner'));
  return rows.map((r) => r.id);
}

async function xpByUser(ids: string[], from?: Date, to?: Date): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const db = await getDb();
  const conds = [inArray(learningEvents.userId, ids)];
  if (from) conds.push(gte(learningEvents.createdAt, from));
  if (to) conds.push(lt(learningEvents.createdAt, to));
  const rows = await db
    .select({ userId: learningEvents.userId, xp: sum(learningEvents.xp) })
    .from(learningEvents)
    .where(and(...conds))
    .groupBy(learningEvents.userId);
  return new Map(rows.map((r) => [r.userId, Number(r.xp ?? 0)]));
}

export function publicName(
  user: { id: string; name: string },
  pref: { displayMode: DisplayMode; nickname: string | null } | undefined,
  viewer: SessionUser,
): string {
  if (viewer.role !== 'learner' || viewer.id === user.id) return user.name;
  if (pref?.displayMode === 'nickname' && pref.nickname) return pref.nickname;
  // First name + initial keeps it friendly without full names on a public board
  const [first, last] = user.name.split(' ');
  return last ? `${first} ${last[0]}.` : (first ?? 'Learner');
}

export async function getBoard(viewer: SessionUser, scope: Scope, period: Period) {
  const db = await getDb();
  const ids = await participantIds(scope);
  if (!ids.length) return { entries: [], me: null, chase: null, highlights: pickHighlights([]) };

  const now = Date.now();
  const from = period === 'all' ? undefined : new Date(now - PERIOD_DAYS[period] * DAY);
  const prevFrom = period === 'all' ? undefined : new Date(now - 2 * PERIOD_DAYS[period] * DAY);
  const weekAgo = new Date(now - 7 * DAY);

  const [current, previous, totals, weekXp, profiles, prefs, activityCounts, dayRows] = await Promise.all([
    xpByUser(ids, from),
    period === 'all' ? Promise.resolve(new Map<string, number>()) : xpByUser(ids, prevFrom, from),
    xpByUser(ids),
    period === 'all' ? xpByUser(ids, weekAgo) : Promise.resolve(new Map<string, number>()),
    db.select({ id: users.id, name: users.name, avatarSeed: users.avatarSeed }).from(users).where(inArray(users.id, ids)),
    db.select().from(leaderboardPrefs).where(inArray(leaderboardPrefs.userId, ids)),
    db
      .select({ userId: learningEvents.userId, n: count() })
      .from(learningEvents)
      .where(and(inArray(learningEvents.userId, ids), eq(learningEvents.type, 'activity.completed'), gte(learningEvents.createdAt, from ?? new Date(0))))
      .groupBy(learningEvents.userId),
    db
      .selectDistinct({
        userId: learningEvents.userId,
        day: sql<string>`to_char(${learningEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      })
      .from(learningEvents)
      .where(and(inArray(learningEvents.userId, ids), gte(learningEvents.createdAt, new Date(now - 60 * DAY)))),
  ]);

  const prefMap = new Map(prefs.map((p) => [p.userId, p]));
  const actMap = new Map(activityCounts.map((a) => [a.userId, a.n]));
  const days = new Map<string, string[]>();
  for (const r of dayRows) days.set(r.userId, [...(days.get(r.userId) ?? []), r.day]);

  const visible = profiles.filter((p) => p.id === viewer.id || viewer.role !== 'learner' || prefMap.get(p.id)?.displayMode !== 'hidden');

  const ranked = rankEntries(
    visible.map((p) => {
      const xp = current.get(p.id) ?? 0;
      const total = totals.get(p.id) ?? 0;
      return {
        userId: p.id,
        xp,
        // For all-time, "previous" = total before this week
        prevXp: period === 'all' ? total - (weekXp.get(p.id) ?? 0) : (previous.get(p.id) ?? 0),
        name: publicName(p, prefMap.get(p.id), viewer),
        avatarSeed: p.avatarSeed,
        totalXp: total,
        levelName: getLevel(total).name,
        level: getLevel(total).level,
        streak: computeStreak(days.get(p.id) ?? []),
        activities: actMap.get(p.id) ?? 0,
        isMe: p.id === viewer.id,
      };
    }),
  );

  return {
    entries: ranked,
    me: ranked.find((e) => e.isMe) ?? null,
    chase: chaseInfo(ranked, viewer.id, TYPICAL_ACTIVITY_XP),
    highlights: pickHighlights(ranked),
  };
}

export type BoardEntry = Awaited<ReturnType<typeof getBoard>>['entries'][number];

/** Courses worth racing on in this scope. */
export async function getRaceCourses(scope: Scope) {
  const db = await getDb();
  if (scope.isClass) {
    return db
      .select({ id: courses.id, title: courses.title, emoji: courses.emoji, color: courses.color })
      .from(classCourses)
      .innerJoin(courses, eq(courses.id, classCourses.courseId))
      .where(eq(classCourses.classId, scope.id));
  }
  return db
    .select({ id: courses.id, title: courses.title, emoji: courses.emoji, color: courses.color, n: count(enrollments.userId) })
    .from(courses)
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(and(eq(courses.status, 'published'), eq(courses.visibility, 'public')))
    .groupBy(courses.id)
    .orderBy(desc(count(enrollments.userId)))
    .limit(6);
}

/** Every participant's position along one course (lessons done / total). */
export async function getCourseRace(viewer: SessionUser, scope: Scope, courseId: string) {
  const db = await getDb();
  const ids = await participantIds(scope);
  const [lessonCount] = await db.select({ n: count() }).from(lessons).where(eq(lessons.courseId, courseId));
  const total = lessonCount?.n ?? 0;
  if (!ids.length || !total) return { total, lanes: [] };

  const [enrolled, done, profiles, prefs] = await Promise.all([
    db
      .select({ userId: enrollments.userId, completedAt: enrollments.completedAt })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), inArray(enrollments.userId, ids))),
    db
      .select({ userId: lessonCompletions.userId, n: count(), last: sql<Date>`max(${lessonCompletions.completedAt})` })
      .from(lessonCompletions)
      .where(and(eq(lessonCompletions.courseId, courseId), inArray(lessonCompletions.userId, ids)))
      .groupBy(lessonCompletions.userId),
    db.select({ id: users.id, name: users.name, avatarSeed: users.avatarSeed }).from(users).where(inArray(users.id, ids)),
    db.select().from(leaderboardPrefs).where(inArray(leaderboardPrefs.userId, ids)),
  ]);
  const doneMap = new Map(done.map((d) => [d.userId, d]));
  const prefMap = new Map(prefs.map((p) => [p.userId, p]));
  const enrolledIds = new Set(enrolled.map((e) => e.userId));

  const lanes = profiles
    .filter((p) => enrolledIds.has(p.id))
    .filter((p) => p.id === viewer.id || viewer.role !== 'learner' || prefMap.get(p.id)?.displayMode !== 'hidden')
    .map((p) => {
      const d = doneMap.get(p.id);
      return {
        userId: p.id,
        name: publicName(p, prefMap.get(p.id), viewer),
        avatarSeed: p.avatarSeed,
        done: d?.n ?? 0,
        percent: Math.round(((d?.n ?? 0) / total) * 100),
        lastAt: d?.last ? new Date(d.last) : null,
        isMe: p.id === viewer.id,
      };
    })
    // Finished first; among equals, whoever got there first
    .sort((a, b) => b.done - a.done || (a.lastAt?.getTime() ?? Infinity) - (b.lastAt?.getTime() ?? Infinity));
  return { total, lanes };
}

export async function getPrefs(userId: string) {
  const db = await getDb();
  const [row] = await db.select().from(leaderboardPrefs).where(eq(leaderboardPrefs.userId, userId)).limit(1);
  return row ?? { userId, displayMode: 'name' as DisplayMode, nickname: null };
}
