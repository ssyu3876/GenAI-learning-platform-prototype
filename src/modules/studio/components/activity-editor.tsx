'use client';

// One activity in the lesson editor: title, XP, raw JSON config (checked on the server with
// the type's zod schema) and a live preview through the registry's ActivityHost.
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Puzzle, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Notice, Textarea } from '@/components/ui';
import type { Translations } from '@/i18n/messages';
import { fmt } from '@/i18n/format';
import { useT } from '@/i18n/client';
import { getActivityType } from '@/registry/activities';
import { ActivityHost } from '@/registry/activity-host';
import { deleteActivity, moveActivity, updateActivity } from '../actions';
import { ActionButton } from './action-button';
import { useFormAction } from './use-form-action';

export interface ActivityValues {
  id: string;
  type: string;
  title: string;
  xpReward: number;
  configJson: string;
}

/** Registry activity types that have a label in the shared activities dictionary. */
const ACTIVITY_LABEL_KEY: Record<string, keyof Translations['activities']['types']> = {
  slides: 'slides',
  sequence: 'sequence',
  sort: 'sort',
  quiz: 'quiz',
  roleplay: 'roleplay',
  coding: 'coding',
  codingExercise: 'codingExercise',
  reading: 'reading',
};

/** Translated activity type name, falling back to the registry label. */
export function activityTypeLabel(t: Translations, type: string, fallback: string): string {
  const key = ACTIVITY_LABEL_KEY[type];
  return key ? t.activities.types[key] : fallback;
}

/** Translated one-line description for the studio's "add activity" menu. */
export function activityTypeDescription(t: Translations, type: string, fallback: string): string {
  const key = ACTIVITY_LABEL_KEY[type];
  return key ? t.activities.descriptions[key] : fallback;
}

function parseJson(
  text: string,
  fallback: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : fallback };
  }
}

export function ActivityEditor({
  activity,
  index,
  isFirst,
  isLast,
}: {
  activity: ActivityValues;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useT();
  const def = getActivityType(activity.type);
  const Icon = def?.icon ?? Puzzle;
  const label = def ? activityTypeLabel(t, def.type, def.label) : activity.type;
  const { state, pending, onSubmit } = useFormAction(updateActivity);
  const [title, setTitle] = useState(activity.title);
  const [xp, setXp] = useState(String(activity.xpReward));
  const [configJson, setConfigJson] = useState(activity.configJson);
  const parsed = useMemo(
    () => parseJson(configJson, t.studio.activity.invalidJsonFallback),
    [configJson, t],
  );
  const configId = `activity-config-${activity.id}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-butter-soft px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-paper">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
              {fmt(t.studio.activity.heading, { index: index + 1, label })}
            </p>
            <h3 className="truncate font-display font-bold">{activity.title}</h3>
          </div>
          <Badge tint="butter">
            {activity.xpReward} {t.chrome.common.xp}
          </Badge>
        </div>
        <div className="flex items-start gap-1">
          <ActionButton
            action={moveActivity}
            fields={{ activityId: activity.id, direction: 'up' }}
            variant="ghost"
            disabled={isFirst}
            ariaLabel={fmt(t.studio.common.moveUp, { title: activity.title })}
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </ActionButton>
          <ActionButton
            action={moveActivity}
            fields={{ activityId: activity.id, direction: 'down' }}
            variant="ghost"
            disabled={isLast}
            ariaLabel={fmt(t.studio.common.moveDown, { title: activity.title })}
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </ActionButton>
          <ActionButton
            action={deleteActivity}
            fields={{ activityId: activity.id }}
            variant="danger"
            confirmText={fmt(t.studio.activity.deleteConfirm, { title: activity.title })}
            ariaLabel={fmt(t.studio.common.deleteItem, { title: activity.title })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-2">
        <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-3">
          <input type="hidden" name="activityId" value={activity.id} />
          {!def ? <Notice tone="error">{fmt(t.studio.activity.notInstalled, { type: activity.type })}</Notice> : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
            <Field label={t.studio.fields.title} htmlFor={`activity-title-${activity.id}`}>
              <Input
                id={`activity-title-${activity.id}`}
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </Field>
            <Field label={t.chrome.common.xp} htmlFor={`activity-xp-${activity.id}`}>
              <Input
                id={`activity-xp-${activity.id}`}
                name="xpReward"
                type="number"
                min={5}
                max={100}
                value={xp}
                onChange={(e) => setXp(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field
            label={t.studio.activity.setup}
            htmlFor={configId}
            error={parsed.ok ? undefined : fmt(t.studio.activity.invalidJson, { error: parsed.error })}
            hint={t.studio.activity.setupHint}
          >
            <Textarea
              id={configId}
              name="config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={14}
              spellCheck={false}
              className="font-mono text-xs"
            />
          </Field>
          {state && !state.ok ? <Notice tone="error" className="whitespace-pre-line">{state.error}</Notice> : null}
          {state?.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
          <div>
            <Button type="submit" variant="mint" disabled={pending || !parsed.ok} aria-busy={pending}>
              {pending ? t.chrome.common.saving : t.studio.activity.save}
            </Button>
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-display text-sm font-semibold">{t.studio.activity.preview}</span>
          {parsed.ok ? (
            <ActivityHost
              key={configJson}
              activity={{
                id: activity.id,
                type: activity.type,
                title: title || activity.title,
                xpReward: Number(xp) || activity.xpReward,
                config: parsed.value,
              }}
              preview
            />
          ) : (
            <Notice>{t.studio.activity.fixJson}</Notice>
          )}
        </div>
      </div>
    </Card>
  );
}
