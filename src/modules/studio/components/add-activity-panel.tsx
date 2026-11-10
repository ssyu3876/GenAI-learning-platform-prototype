'use client';

// "Add an activity" menu, built from the activity registry: any registered type can be added
// blank (its defaultConfig) or written by AI from the lesson text.
import { useState } from 'react';
import { Plus, WandSparkles } from 'lucide-react';
import type { ActivityDefinition } from '@/core/activity-types';
import { Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Notice } from '@/components/ui';
import { fmt } from '@/i18n/format';
import { useT } from '@/i18n/client';
import { ACTIVITY_TYPES } from '@/registry/activities';
import { addActivity } from '../actions';
import { activityTypeDescription, activityTypeLabel } from './activity-editor';
import { useFormAction } from './use-form-action';

function TypeCard({ def, lessonId, note }: { def: ActivityDefinition; lessonId: string; note: string }) {
  const t = useT();
  const { state, pending, onSubmit } = useFormAction(addActivity);
  const [mode, setMode] = useState<'blank' | 'ai'>('blank');
  const Icon = def.icon;
  const label = activityTypeLabel(t, def.type, def.label);
  return (
    <li className="flex flex-col gap-2 rounded-xl border-2 border-line bg-paper p-3">
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-lilac-soft">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display font-bold">{label}</p>
          <p className="text-sm text-ink-soft">{activityTypeDescription(t, def.type, def.description)}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-auto flex flex-wrap gap-2">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="type" value={def.type} />
        <input type="hidden" name="note" value={note} />
        {/* mode comes from the clicked button (useFormAction passes the submitter to FormData) */}
        <Button
          type="submit"
          name="mode"
          value="blank"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => setMode('blank')}
          aria-label={fmt(t.studio.addActivity.addBlankLabel, { label })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {pending && mode === 'blank' ? t.studio.common.adding : t.studio.addActivity.addBlank}
        </Button>
        <Button
          type="submit"
          name="mode"
          value="ai"
          size="sm"
          variant="mint"
          disabled={pending}
          onClick={() => setMode('ai')}
          aria-label={fmt(t.studio.addActivity.generateWithAiLabel, { label })}
        >
          <WandSparkles className="h-4 w-4" aria-hidden />
          {pending && mode === 'ai' ? t.studio.addActivity.pipWriting : t.studio.common.generateWithAi}
        </Button>
      </form>
      {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
    </li>
  );
}

export function AddActivityPanel({ lessonId }: { lessonId: string }) {
  const t = useT();
  const [note, setNote] = useState('');
  return (
    <Card tint="lilac">
      <CardHeader title={t.studio.addActivity.title} subtitle={t.studio.addActivity.subtitle} />
      <CardBody className="flex flex-col gap-4">
        {ACTIVITY_TYPES.length === 0 ? (
          <EmptyState title={t.studio.addActivity.emptyTitle}>{t.studio.addActivity.emptyBody}</EmptyState>
        ) : (
          <>
            <Field label={t.studio.addActivity.note} htmlFor="activity-note" hint={t.studio.addActivity.noteHint}>
              <Input id="activity-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <ul className="grid gap-3 sm:grid-cols-2">
              {ACTIVITY_TYPES.map((def) => (
                <TypeCard key={def.type} def={def} lessonId={lessonId} note={note} />
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}
