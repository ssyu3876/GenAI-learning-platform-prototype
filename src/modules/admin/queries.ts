// Read functions for the admin console: platform stats, users, the course review queue and
// AI usage. Admin pages call requireUser(['admin']) before any of these.
import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  aiUsage,
  courses,
  learningEvents,
  lessons,
  users,
  USER_ROLES,
  type CourseSource,
  type CourseStatus,
  type UserRole,
} from '@/core/db/schema';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';

const DAY_MS = 24 * 60 * 60 * 1000;
export const COURSE_STATUSES: CourseStatus[] = ['draft', 'pending_review', 'published', 'archived'];
export const COURSE_SOURCES: CourseSource[] = ['seed', 'manual', 'ai', 'learner_ai'];

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface AdminOverview {
  usersByRole: Record<UserRole, number>;
  coursesByStatus: Record<CourseStatus, number>;
  eventsLast7Days: number;
  activeLearners7Days: number;
  aiToday: { real: number; mock: number };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const [roleRows, statusRows, [events], [ai]] = await Promise.all([
    db.select({ role: users.role, n: count() }).from(users).groupBy(users.role),
    db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
    db
      .select({ n: count(), learners: sql<number>`count(distinct ${learningEvents.userId})`.mapWith(Number) })
      .from(learningEvents)
      .where(gte(learningEvents.createdAt, weekAgo)),
    db
      .select({
        real: sql<number>`count(*) filter (where ${aiUsage.mocked} = false)`.mapWith(Number),
        mock: sql<number>`count(*) filter (where ${aiUsage.mocked} = true)`.mapWith(Number),
      })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, startOfUtcDay())),
  ]);
  const usersByRole = Object.fromEntries(USER_ROLES.map((r) => [r, 0])) as Record<UserRole, number>;
  for (const r of roleRows) if (r.role in usersByRole) usersByRole[r.role] = r.n;
  const coursesByStatus = Object.fromEntries(COURSE_STATUSES.map((s) => [s, 0])) as Record<CourseStatus, number>;
  for (const s of statusRows) if (s.status in coursesByStatus) coursesByStatus[s.status] = s.n;
  return {
    usersByRole,
    coursesByStatus,
    eventsLast7Days: events?.n ?? 0,
    activeLearners7Days: events?.learners ?? 0,
    aiToday: { real: ai?.real ?? 0, mock: ai?.mock ?? 0 },
  };
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarSeed: string;
  createdAt: Date;
  lastActiveAt: Date | null;
}

export const USER_LIST_LIMIT = 100;

/** Users matching `q` (name or email), newest first. */
export async function searchUsers(q: string): Promise<AdminUserRow[]> {
  const db = await getDb();
  const term = q.trim().slice(0, 100);
  // Escape LIKE wildcards so "%" in a search is treated literally.
  const pattern = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarSeed: users.avatarSeed,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .where(term ? or(ilike(users.name, pattern), ilike(users.email, pattern)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(USER_LIST_LIMIT);
}

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  emoji: string;
  color: string;
  subject: string;
  status: CourseStatus;
  visibility: string;
  source: CourseSource;
  ownerId: string | null;
  ownerName: string | null;
  lessonCount: number;
  updatedAt: Date;
}

export interface CourseFilters {
  status?: CourseStatus;
  source?: CourseSource;
  ownerId?: string;
}

async function selectCourses(where: SQL | undefined): Promise<AdminCourseRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      emoji: courses.emoji,
      color: courses.color,
      subject: courses.subject,
      status: courses.status,
      visibility: courses.visibility,
      source: courses.source,
      ownerId: courses.ownerId,
      ownerName: users.name,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.ownerId))
    .where(where)
    .orderBy(desc(courses.updatedAt));
  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db
        .select({ courseId: lessons.courseId, n: count() })
        .from(lessons)
        .where(inArray(lessons.courseId, ids))
        .groupBy(lessons.courseId)
    : [];
  const countMap = new Map(counts.map((c) => [c.courseId, c.n]));
  const locale = await getLocale();
  return localizeContent(
    rows.map((r) => ({ ...r, lessonCount: countMap.get(r.id) ?? 0 })),
    locale,
  );
}

export function listPendingCourses(): Promise<AdminCourseRow[]> {
  return selectCourses(eq(courses.status, 'pending_review'));
}

export function listCourses(filters: CourseFilters): Promise<AdminCourseRow[]> {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(courses.status, filters.status));
  if (filters.source) conditions.push(eq(courses.source, filters.source));
  if (filters.ownerId) conditions.push(eq(courses.ownerId, filters.ownerId));
  return selectCourses(conditions.length ? and(...conditions) : undefined);
}

/** People who own at least one course, for the owner filter. */
export async function listCourseOwners(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  return db
    .selectDistinct({ id: users.id, name: users.name })
    .from(courses)
    .innerJoin(users, eq(users.id, courses.ownerId))
    .orderBy(asc(users.name));
}

export interface AiFeatureRow {
  feature: string;
  calls: number;
  real: number;
  mock: number;
  promptTokens: number;
  completionTokens: number;
  /** Average over real calls only (mock calls are instant and would skew it) */
  avgLatencyMs: number | null;
}

export interface AiDayPoint {
  day: string;
  label: string;
  real: number;
  mock: number;
}

export interface AiUsageReport {
  totals: Omit<AiFeatureRow, 'feature'>;
  features: AiFeatureRow[];
  series: AiDayPoint[];
}

export async function getAiUsageReport(days = 14): Promise<AiUsageReport> {
  const db = await getDb();
  const metrics = {
    calls: count(),
    real: sql<number>`count(*) filter (where ${aiUsage.mocked} = false)`.mapWith(Number),
    mock: sql<number>`count(*) filter (where ${aiUsage.mocked} = true)`.mapWith(Number),
    promptTokens: sql<number>`coalesce(sum(${aiUsage.promptTokens}), 0)`.mapWith(Number),
    completionTokens: sql<number>`coalesce(sum(${aiUsage.completionTokens}), 0)`.mapWith(Number),
    avgLatencyMs: sql<number | null>`round(avg(${aiUsage.latencyMs}) filter (where ${aiUsage.mocked} = false))`,
  };
  const dayExpr = sql<string>`to_char(${aiUsage.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const today = startOfUtcDay();
  const since = new Date(today.getTime() - (days - 1) * DAY_MS);

  const [features, [totals], daily] = await Promise.all([
    db.select({ feature: aiUsage.feature, ...metrics }).from(aiUsage).groupBy(aiUsage.feature).orderBy(desc(count())),
    db.select(metrics).from(aiUsage),
    db
      .select({ day: dayExpr, real: metrics.real, mock: metrics.mock })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, since))
      .groupBy(dayExpr),
  ]);

  const toLatency = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series: AiDayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(since.getTime() + i * DAY_MS);
    const day = date.toISOString().slice(0, 10);
    const row = byDay.get(day);
    series.push({
      day,
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
      real: row?.real ?? 0,
      mock: row?.mock ?? 0,
    });
  }

  return {
    totals: {
      calls: totals?.calls ?? 0,
      real: totals?.real ?? 0,
      mock: totals?.mock ?? 0,
      promptTokens: totals?.promptTokens ?? 0,
      completionTokens: totals?.completionTokens ?? 0,
      avgLatencyMs: toLatency(totals?.avgLatencyMs),
    },
    features: features.map((f) => ({ ...f, avgLatencyMs: toLatency(f.avgLatencyMs) })),
    series,
  };
}
