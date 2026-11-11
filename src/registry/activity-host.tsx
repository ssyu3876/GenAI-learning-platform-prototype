'use client';

// Renders any registered activity type from its DB row. Used by the lesson player
// (courses module) and the studio preview, so neither needs to know activity internals.
import type { ActivityCompletion, ActivityOutcome } from '@/core/activity-types';
import { Card, Notice } from '@/components/ui';
import { useT } from '@/i18n/client';
import { getActivityType } from './activities';

export interface ActivityHostProps {
  activity: { id: string; type: string; title: string; xpReward: number; config: unknown };
  /** Omit in preview mode */
  onComplete?: (result: ActivityCompletion) => Promise<ActivityOutcome | null>;
  previousBest?: number | null;
  preview?: boolean;
}

const noop = async () => null;

export function ActivityHost({ activity, onComplete, previousBest, preview }: ActivityHostProps) {
  const t = useT();
  const def = getActivityType(activity.type);
  if (!def) {
    return (
      <Card className="p-5">
        <Notice tone="error">{t.activities.frame.unknownType.replace('{type}', activity.type)}</Notice>
      </Card>
    );
  }
  const parsed = def.schema.safeParse(activity.config);
  if (!parsed.success) {
    return (
      <Card className="p-5">
        <Notice tone="error">
          {t.activities.frame.invalidSetup.replace('{type}', labelFor(activity.type, def.label, t))}
        </Notice>
      </Card>
    );
  }
  const { Player } = def;
  return (
    <Player
      activity={{ id: activity.id, title: activity.title, xpReward: activity.xpReward }}
      config={parsed.data}
      onComplete={preview || !onComplete ? noop : onComplete}
      previousBest={previousBest ?? null}
      preview={preview}
    />
  );
}

function labelFor(type: string, fallback: string, t: ReturnType<typeof useT>): string {
  const key = type as keyof typeof t.activities.types;
  return t.activities.types[key] ?? fallback;
}
