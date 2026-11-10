'use client';

// Course details form in the editor: title, summary, subject, level, audience, tags, emoji, colour.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { asTint, Button, cn, Field, Input, Notice, Select, Textarea, TINT_SOLID } from '@/components/ui';
import { useT } from '@/i18n/client';
import { updateCourseMeta } from '../actions';
import { useFormAction } from './use-form-action';

export interface CourseMetaValues {
  id: string;
  title: string;
  summary: string;
  subject: string;
  level: string;
  audience: string;
  tags: string[];
  emoji: string;
  color: string;
}

/** `colors` comes from COURSE_COLORS on the server (core/content/draft is server-only). */
export function CourseMetaForm({ course, colors }: { course: CourseMetaValues; colors: readonly string[] }) {
  const t = useT();
  const { state, pending, onSubmit } = useFormAction(updateCourseMeta);
  const [color, setColor] = useState(course.color);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={course.id} />
      {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field label={t.studio.fields.title} htmlFor="meta-title">
          <Input id="meta-title" name="title" defaultValue={course.title} required minLength={3} maxLength={100} />
        </Field>
        <Field label={t.studio.fields.emoji} htmlFor="meta-emoji">
          <Input id="meta-emoji" name="emoji" defaultValue={course.emoji} required maxLength={16} className="text-center text-xl" />
        </Field>
      </div>
      <Field label={t.studio.fields.summary} htmlFor="meta-summary" hint={t.studio.meta.summaryHint}>
        <Textarea id="meta-summary" name="summary" defaultValue={course.summary} rows={2} maxLength={400} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t.studio.fields.subject} htmlFor="meta-subject">
          <Input id="meta-subject" name="subject" defaultValue={course.subject} maxLength={60} />
        </Field>
        <Field label={t.studio.fields.level} htmlFor="meta-level">
          <Select id="meta-level" name="level" defaultValue={course.level}>
            <option value="beginner">{t.studio.levels.beginner}</option>
            <option value="intermediate">{t.studio.levels.intermediate}</option>
            <option value="advanced">{t.studio.levels.advanced}</option>
          </Select>
        </Field>
        <Field label={t.studio.fields.audience} htmlFor="meta-audience">
          <Select id="meta-audience" name="audience" defaultValue={course.audience}>
            <option value="everyone">{t.studio.audiences.everyone}</option>
            <option value="non_cs">{t.studio.audiences.non_cs}</option>
            <option value="cs">{t.studio.audiences.cs}</option>
          </Select>
        </Field>
      </div>
      <Field label={t.studio.fields.tags} htmlFor="meta-tags" hint={t.studio.meta.tagsHint}>
        <Input id="meta-tags" name="tags" defaultValue={course.tags.join(', ')} maxLength={400} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 font-display text-sm font-semibold">{t.studio.meta.color}</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full border-2 border-line shadow-sticker-sm',
                  'peer-focus-visible:ring-4 peer-focus-visible:ring-sky/50',
                  TINT_SOLID[asTint(c)],
                )}
              >
                {color === c ? <Check className="h-5 w-5" aria-hidden /> : null}
              </span>
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Button type="submit" variant="mint" disabled={pending} aria-busy={pending}>
          {pending ? t.chrome.common.saving : t.studio.meta.save}
        </Button>
      </div>
    </form>
  );
}
