'use client';

// /studio/new: generate a course with AI, or start a blank one. Two tabs, one page.
import { useState } from 'react';
import { WandSparkles, FilePlus2 } from 'lucide-react';
import { Button, Card, cn, Field, Input, Notice, PipSays, Select, Textarea } from '@/components/ui';
import { useT } from '@/i18n/client';
import { ACTIVITY_TYPES } from '@/registry/activities';
import { createBlankCourse, generateCourse } from '../actions';
import { activityTypeDescription, activityTypeLabel } from './activity-editor';
import { useFormAction } from './use-form-action';

type Mode = 'ai' | 'blank';

/** Types ticked by default when they exist in the registry. */
const PREFERRED_TYPES = ['quiz', 'sort'];

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

function GenerateForm() {
  const t = useT();
  const { state, pending, onSubmit } = useFormAction(generateCourse);
  const preferred = ACTIVITY_TYPES.filter((d) => PREFERRED_TYPES.includes(d.type)).map((d) => d.type);
  const defaults = new Set(preferred.length ? preferred : ACTIVITY_TYPES.map((d) => d.type));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-busy={pending}>
      {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      <Field label={t.studio.generate.topic} htmlFor="topic" hint={t.studio.generate.topicHint}>
        <Input id="topic" name="topic" required minLength={3} maxLength={200} disabled={pending} />
      </Field>
      <Field
        label={t.studio.generate.audienceNote}
        htmlFor="audienceNote"
        hint={t.studio.generate.audienceNoteHint}
      >
        <Input id="audienceNote" name="audienceNote" maxLength={300} disabled={pending} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.studio.fields.level} htmlFor="level">
          <Select id="level" name="level" defaultValue="beginner" disabled={pending}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {t.studio.levels[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.studio.generate.lessonCount} htmlFor="lessonCount">
          <Select id="lessonCount" name="lessonCount" defaultValue="3" disabled={pending}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2" disabled={pending}>
        <legend className="mb-1.5 font-display text-sm font-semibold">{t.studio.generate.activityTypes}</legend>
        {ACTIVITY_TYPES.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.studio.generate.noActivityTypes}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVITY_TYPES.map((def) => {
              const Icon = def.icon;
              return (
                <label
                  key={def.type}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-line bg-paper px-3 py-2 has-[:checked]:bg-mint-soft"
                >
                  <input
                    type="checkbox"
                    name="types"
                    value={def.type}
                    defaultChecked={defaults.has(def.type)}
                    className="mt-1 h-4 w-4 accent-mint-deep"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Icon className="h-4 w-4" aria-hidden /> {activityTypeLabel(t, def.type, def.label)}
                    </span>
                    <span className="block text-sm text-ink-soft">{activityTypeDescription(t, def.type, def.description)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <Field label={t.studio.generate.materials} htmlFor="materials" hint={t.studio.generate.materialsHint}>
        <Textarea id="materials" name="materials" rows={5} maxLength={20000} disabled={pending} />
      </Field>
      <Field
        label={t.studio.generate.requirements}
        htmlFor="requirements"
        hint={t.studio.generate.requirementsHint}
      >
        <Textarea id="requirements" name="requirements" rows={2} maxLength={1000} disabled={pending} />
      </Field>

      {pending ? (
        <PipSays mood="think" size={64}>
          <p className="font-display font-bold">{t.studio.generate.writingTitle}</p>
          <p className="text-sm text-ink-soft">{t.studio.generate.writingBody}</p>
        </PipSays>
      ) : null}
      <div>
        <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
          <WandSparkles className="h-4 w-4" aria-hidden />
          {pending ? t.studio.generate.writing : t.studio.generate.submit}
        </Button>
      </div>
    </form>
  );
}

function BlankForm() {
  const t = useT();
  const { state, pending, onSubmit } = useFormAction(createBlankCourse);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      <Field label={t.studio.blank.courseTitle} htmlFor="title">
        <Input id="title" name="title" required minLength={3} maxLength={100} disabled={pending} />
      </Field>
      <Field label={t.studio.fields.subject} htmlFor="subject" hint={t.studio.blank.subjectHint}>
        <Input id="subject" name="subject" maxLength={60} disabled={pending} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.studio.fields.level} htmlFor="blank-level">
          <Select id="blank-level" name="level" defaultValue="beginner" disabled={pending}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {t.studio.levels[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.studio.fields.audience} htmlFor="audience">
          <Select id="audience" name="audience" defaultValue="everyone" disabled={pending}>
            <option value="everyone">{t.studio.audiences.everyone}</option>
            <option value="non_cs">{t.studio.audiences.non_cs}</option>
            <option value="cs">{t.studio.audiences.cs}</option>
          </Select>
        </Field>
      </div>
      <div>
        <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
          <FilePlus2 className="h-4 w-4" aria-hidden />
          {pending ? t.studio.blank.creating : t.studio.blank.submit}
        </Button>
      </div>
    </form>
  );
}

export function NewCourseForms({ initialMode }: { initialMode: Mode }) {
  const t = useT();
  const [mode, setMode] = useState<Mode>(initialMode);
  const tabs: { id: Mode; label: string }[] = [
    { id: 'ai', label: t.studio.common.generateWithAi },
    { id: 'blank', label: t.studio.newCourse.tabBlank },
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <div role="tablist" aria-label={t.studio.newCourse.howToStart} className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setMode(tab.id)}
            className={cn(
              'rounded-pill border-2 border-line px-4 py-1.5 font-display font-semibold',
              mode === tab.id ? 'bg-butter shadow-sticker-sm' : 'bg-paper hover:bg-butter-soft',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Card className="p-5 sm:p-6">
        <div id={`panel-${mode}`} role="tabpanel" aria-labelledby={`tab-${mode}`}>
          {mode === 'ai' ? <GenerateForm /> : <BlankForm />}
        </div>
      </Card>
    </div>
  );
}
