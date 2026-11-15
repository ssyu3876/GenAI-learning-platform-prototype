'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { classes } from '@/core/db/schema';
import type { ActionResult } from '@/core/types';
import { leaderboardClassSettings, leaderboardPrefs } from './schema';

const prefsSchema = z
  .object({
    displayMode: z.enum(['name', 'nickname', 'hidden']),
    nickname: z
      .string()
      .trim()
      .max(24, 'Keep it under 24 characters.')
      .regex(/^[\p{L}\p{N} _.-]*$/u, 'Letters, numbers, spaces, - _ . only.')
      .optional()
      .transform((v) => v || null),
  })
  .refine((v) => v.displayMode !== 'nickname' || v.nickname, {
    message: 'Pick a nickname first.',
    path: ['nickname'],
  });

export async function savePrefs(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const parsed = prefsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const db = await getDb();
  await db
    .insert(leaderboardPrefs)
    .values({ userId: user.id, ...parsed.data })
    .onConflictDoUpdate({ target: leaderboardPrefs.userId, set: { ...parsed.data, updatedAt: new Date() } });
  revalidatePath('/leaderboard');
  revalidatePath('/admin/classes');
  return { ok: true, message: 'Saved. Your classmates will see the change right away.' };
}

export async function setClassBoard(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const { classId, enabled } = z
    .object({ classId: z.string(), enabled: z.enum(['true', 'false']).transform((v) => v === 'true') })
    .parse(Object.fromEntries(formData));
  const db = await getDb();
  const [cls] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!cls || (user.role !== 'admin' && cls.instructorId !== user.id)) throw new Error('Not allowed');
  await db
    .insert(leaderboardClassSettings)
    .values({ classId, enabled })
    .onConflictDoUpdate({ target: leaderboardClassSettings.classId, set: { enabled, updatedAt: new Date() } });
  revalidatePath('/leaderboard');
  revalidatePath('/admin/classes');
}
