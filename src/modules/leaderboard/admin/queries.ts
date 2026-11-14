// Read model for the admin classes page: every class on the platform, its size, and whether
// its leaderboard is visible to students.
import { asc, count, eq } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { classCourses, classMembers, classes, users } from '@/core/db/schema';
import { leaderboardClassSettings } from '../schema';

export interface AdminClassRow {
  id: string;
  name: string;
  inviteCode: string;
  instructorName: string;
  members: number;
  courses: number;
  /** No row means visible, which is the default the leaderboard uses too. */
  boardVisible: boolean;
}

export async function listClassesForAdmin(): Promise<AdminClassRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      inviteCode: classes.inviteCode,
      instructorName: users.name,
    })
    .from(classes)
    .leftJoin(users, eq(users.id, classes.instructorId))
    .orderBy(asc(classes.name));

  const [memberRows, courseRows, settingRows] = await Promise.all([
    db.select({ classId: classMembers.classId, n: count() }).from(classMembers).groupBy(classMembers.classId),
    db.select({ classId: classCourses.classId, n: count() }).from(classCourses).groupBy(classCourses.classId),
    db.select().from(leaderboardClassSettings),
  ]);

  const members = new Map(memberRows.map((r) => [r.classId, Number(r.n)]));
  const courses = new Map(courseRows.map((r) => [r.classId, Number(r.n)]));
  const settings = new Map(settingRows.map((r) => [r.classId, r.enabled]));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    inviteCode: r.inviteCode,
    instructorName: r.instructorName ?? '',
    members: members.get(r.id) ?? 0,
    courses: courses.get(r.id) ?? 0,
    boardVisible: settings.get(r.id) ?? true,
  }));
}
