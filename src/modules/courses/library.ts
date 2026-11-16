// Public course library reads: catalogue cards, heat metrics, reviews and engagement.
import { and, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { courses, lessonCompletions, users, type Course } from '@/core/db/schema';
import type { SessionUser } from '@/core/types';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { courseFavorites, courseLikes, courseReviews, courseShares, courseViews } from './schema';

export type LibrarySort = 'heat' | 'likes' | 'favorites' | 'shares';

export interface LibraryStats {
  views: number;
  likes: number;
  favorites: number;
  shares: number;
  reviews: number;
  rating: number;
}

export interface LibraryCourse {
  course: Course;
  stats: LibraryStats;
  liked: boolean;
  saved: boolean;
  tags: string[];
  heat: number;
}

export interface ReviewView {
  userId: string;
  userName: string;
  rating: number;
  body: string;
  createdAt: Date;
}

export interface CourseSocial {
  stats: LibraryStats;
  liked: boolean;
  saved: boolean;
  reviews: ReviewView[];
  ownReview: ReviewView | null;
  canReview: boolean;
  contacts: Array<{ id: string; name: string }>;
}

/** Stable mock baseline so the empty demo library still shows rankings. Real actions add on top. */
function mockBase(id: string): LibraryStats & { rating: number } {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    views: 180 + (hash % 1400),
    likes: 12 + (hash % 90),
    favorites: 8 + (hash % 60),
    shares: 3 + (hash % 30),
    reviews: 4 + (hash % 20),
    rating: 4 + ((hash % 10) / 10),
  };
}

function heatOf(stats: LibraryStats): number {
  return stats.views + stats.likes * 3 + stats.favorites * 5 + stats.shares * 4 + stats.reviews * 2;
}

async function realStats(ids: string[]) {
  if (ids.length === 0) {
    return { likes: new Map(), favorites: new Map(), views: new Map(), shares: new Map(), ratings: new Map() };
  }
  const db = await getDb();
  const [likes, favorites, views, shares, reviews] = await Promise.all([
    db.select({ courseId: courseLikes.courseId, n: count() }).from(courseLikes).where(inArray(courseLikes.courseId, ids)).groupBy(courseLikes.courseId),
    db.select({ courseId: courseFavorites.courseId, n: count() }).from(courseFavorites).where(inArray(courseFavorites.courseId, ids)).groupBy(courseFavorites.courseId),
    db.select({ courseId: courseViews.courseId, n: count() }).from(courseViews).where(inArray(courseViews.courseId, ids)).groupBy(courseViews.courseId),
    db.select({ courseId: courseShares.courseId, n: count() }).from(courseShares).where(inArray(courseShares.courseId, ids)).groupBy(courseShares.courseId),
    db.select({ courseId: courseReviews.courseId, rating: courseReviews.rating }).from(courseReviews).where(inArray(courseReviews.courseId, ids)),
  ]);
  const toMap = (rows: Array<{ courseId: string; n: number }>) => new Map(rows.map((row) => [row.courseId, Number(row.n)]));
  const ratingMap = new Map<string, { sum: number; n: number }>();
  for (const row of reviews) {
    const entry = ratingMap.get(row.courseId) ?? { sum: 0, n: 0 };
    entry.sum += row.rating;
    entry.n += 1;
    ratingMap.set(row.courseId, entry);
  }
  return { likes: toMap(likes), favorites: toMap(favorites), views: toMap(views), shares: toMap(shares), ratings: ratingMap };
}

export async function getPublicLibrary(
  user: SessionUser,
  { q = '', tag = '', sort = 'heat' }: { q?: string; tag?: string; sort?: LibrarySort } = {},
): Promise<{ courses: LibraryCourse[]; tags: string[]; hot: LibraryCourse[] }> {
  const db = await getDb();
  const locale = await getLocale();
  const rows = await db
    .select()
    .from(courses)
    .where(and(eq(courses.status, 'published'), eq(courses.visibility, 'public')))
    .orderBy(desc(courses.updatedAt));
  const ids = rows.map((row) => row.id);
  const [stats, likedRows, savedRows] = await Promise.all([
    realStats(ids),
    ids.length
      ? db.select({ courseId: courseLikes.courseId }).from(courseLikes).where(and(eq(courseLikes.userId, user.id), inArray(courseLikes.courseId, ids)))
      : Promise.resolve([]),
    ids.length
      ? db
          .select({ courseId: courseFavorites.courseId })
          .from(courseFavorites)
          .where(and(eq(courseFavorites.userId, user.id), inArray(courseFavorites.courseId, ids)))
      : Promise.resolve([]),
  ]);
  const liked = new Set(likedRows.map((row) => row.courseId));
  const saved = new Set(savedRows.map((row) => row.courseId));
  const allTags = new Set<string>();
  const items = rows.map((raw) => {
    const course = localizeContent(raw, locale);
    const mock = mockBase(course.id);
    const rating = stats.ratings.get(course.id);
    const real = {
      likes: stats.likes.get(course.id) ?? 0,
      favorites: stats.favorites.get(course.id) ?? 0,
      views: stats.views.get(course.id) ?? 0,
      shares: stats.shares.get(course.id) ?? 0,
    };
    const values: LibraryStats = {
      views: mock.views + real.views,
      likes: mock.likes + real.likes,
      favorites: mock.favorites + real.favorites,
      shares: mock.shares + real.shares,
      reviews: mock.reviews + (rating?.n ?? 0),
      rating: rating && rating.n > 0 ? Math.round((rating.sum / rating.n) * 10) / 10 : mock.rating,
    };
    for (const item of course.tags) allTags.add(item);
    return {
      course,
      stats: values,
      liked: liked.has(course.id),
      saved: saved.has(course.id),
      tags: course.tags,
      heat: heatOf(values),
    };
  });
  const query = q.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (tag && !item.tags.includes(tag)) return false;
    if (!query) return true;
    return [item.course.title, item.course.summary, item.course.subject, ...item.tags]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  filtered.sort((a, b) => {
    if (sort === 'likes') return b.stats.likes - a.stats.likes;
    if (sort === 'favorites') return b.stats.favorites - a.stats.favorites;
    if (sort === 'shares') return b.stats.shares - a.stats.shares;
    return b.heat - a.heat;
  });
  return { courses: filtered, tags: [...allTags].sort(), hot: [...items].sort((a, b) => b.heat - a.heat).slice(0, 5) };
}

export async function getCourseSocial(user: SessionUser, course: Course): Promise<CourseSocial> {
  const db = await getDb();
  const mock = mockBase(course.id);
  const [likes, favorites, views, shares, reviewRows, completed] = await Promise.all([
    db.select({ n: count() }).from(courseLikes).where(eq(courseLikes.courseId, course.id)),
    db.select({ n: count() }).from(courseFavorites).where(eq(courseFavorites.courseId, course.id)),
    db.select({ n: count() }).from(courseViews).where(eq(courseViews.courseId, course.id)),
    db.select({ n: count() }).from(courseShares).where(eq(courseShares.courseId, course.id)),
    db
      .select({
        userId: courseReviews.userId,
        userName: users.name,
        rating: courseReviews.rating,
        body: courseReviews.body,
        createdAt: courseReviews.createdAt,
      })
      .from(courseReviews)
      .innerJoin(users, eq(users.id, courseReviews.userId))
      .where(eq(courseReviews.courseId, course.id))
      .orderBy(desc(courseReviews.updatedAt))
      .limit(20),
    db
      .select({ n: count() })
      .from(lessonCompletions)
      .where(and(eq(lessonCompletions.userId, user.id), eq(lessonCompletions.courseId, course.id))),
  ]);
  const ratingSum = reviewRows.reduce((sum, row) => sum + row.rating, 0);
  const stats: LibraryStats = {
    views: mock.views + Number(views[0]?.n ?? 0),
    likes: mock.likes + Number(likes[0]?.n ?? 0),
    favorites: mock.favorites + Number(favorites[0]?.n ?? 0),
    shares: mock.shares + Number(shares[0]?.n ?? 0),
    reviews: mock.reviews + reviewRows.length,
    rating: reviewRows.length > 0 ? Math.round((ratingSum / reviewRows.length) * 10) / 10 : mock.rating,
  };
  const [likedRow, savedRow, contacts] = await Promise.all([
    db.select({ courseId: courseLikes.courseId }).from(courseLikes).where(and(eq(courseLikes.courseId, course.id), eq(courseLikes.userId, user.id))).limit(1),
    db.select({ courseId: courseFavorites.courseId }).from(courseFavorites).where(and(eq(courseFavorites.courseId, course.id), eq(courseFavorites.userId, user.id))).limit(1),
    db.select({ id: users.id, name: users.name }).from(users).where(ne(users.id, user.id)).orderBy(users.name).limit(50),
  ]);
  const ownReview = reviewRows.find((row) => row.userId === user.id) ?? null;
  return {
    stats,
    liked: likedRow.length > 0,
    saved: savedRow.length > 0,
    reviews: reviewRows,
    ownReview,
    canReview: Number(completed[0]?.n ?? 0) > 0,
    contacts,
  };
}
