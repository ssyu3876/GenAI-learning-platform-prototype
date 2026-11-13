'use server';
// Opening and closing a scenario from the admin console. The content stays in code; this
// only flips whether learners can start it, so nothing here can change what a scenario says.

import { like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AUDIT_ACTIONS, recordAudit } from '@/core/audit';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import type { ActionResult } from '@/core/types';
import { fmt, getT } from '@/i18n';
import { INTERVIEW_GROUP } from '../queries';
import { scenarioSettings } from '../schema';

const toggleSchema = z.object({
  scenarioKey: z.string().min(1).max(80),
  // A display label for the audit log; the catalogue name is localised at render time, so
  // the admin sends the one they are looking at.
  scenarioName: z.string().min(1).max(120),
  enabled: z.enum(['true', 'false']),
});

export async function setScenarioEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireUser(['admin']);
  const { t } = await getT();
  const parsed = toggleSchema.safeParse({
    scenarioKey: formData.get('scenarioKey'),
    scenarioName: formData.get('scenarioName'),
    enabled: formData.get('enabled'),
  });
  if (!parsed.success) return { ok: false, error: t.admin.scenarios.badRequest };

  const { scenarioKey, scenarioName } = parsed.data;
  const enabled = parsed.data.enabled === 'true';
  const now = new Date();
  const db = await getDb();
  // The interview formats answer to one switch now, so any per-format row is stale state.
  if (scenarioKey === INTERVIEW_GROUP) {
    await db.delete(scenarioSettings).where(like(scenarioSettings.scenarioKey, 'interview:%'));
  }
  await db
    .insert(scenarioSettings)
    .values({ scenarioKey, enabled, updatedBy: admin.id, updatedAt: now })
    .onConflictDoUpdate({
      target: scenarioSettings.scenarioKey,
      set: { enabled, updatedBy: admin.id, updatedAt: now },
    });

  await recordAudit({
    actor: admin,
    action: enabled ? AUDIT_ACTIONS.scenarioOpened : AUDIT_ACTIONS.scenarioClosed,
    targetType: 'scenario',
    targetId: scenarioKey,
    targetName: scenarioName,
    detail: { enabled },
  });

  revalidatePath('/scenarios');
  revalidatePath('/scenarios/interview');
  revalidatePath(`/scenarios/${scenarioKey}`);
  revalidatePath('/admin/scenarios');
  revalidatePath('/admin/activity');

  return {
    ok: true,
    message: fmt(enabled ? t.admin.scenarios.opened : t.admin.scenarios.closed, { name: scenarioName }),
  };
}
