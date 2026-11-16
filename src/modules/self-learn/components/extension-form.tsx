'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { Card, CardBody, Field, Notice, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { generateExtensionOutline } from '../actions';
import { CourseFormatPicker } from './course-format-picker';
import type { CompletedLesson } from '../queries';

export function ExtensionForm({ lessons }: { lessons: CompletedLesson[] }) {
  const t = useT();
  const [state, formAction] = useActionState(generateExtensionOutline, null);
  const [selected, setSelected] = useState<string[]>([]);
  const courses = [...new Map(lessons.map((lesson) => [lesson.courseId, lesson.courseTitle])).entries()];

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      if (checked) return current.includes(id) || current.length >= 3 ? current : [...current, id];
      return current.filter((item) => item !== id);
    });
  }

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-5">
          {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
          <Field label={t.selfLearn.extension.chapters} hint={t.selfLearn.extension.chaptersHint}>
            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-xl border-2 border-line bg-paper p-3">
              {courses.map(([courseId, courseTitle]) => (
                <div key={courseId}>
                  <p className="mb-1 text-xs font-bold text-ink-soft">{courseTitle}</p>
                  <div className="flex flex-col gap-1.5">
                    {lessons
                      .filter((lesson) => lesson.courseId === courseId)
                      .map((lesson) => {
                        const checked = selected.includes(lesson.id);
                        return (
                          <label key={lesson.id} className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="lessonIds"
                              value={lesson.id}
                              checked={checked}
                              onChange={(event) => toggle(lesson.id, event.target.checked)}
                              className="mt-0.5"
                            />
                            <span>{lesson.title}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Field>
          <p className="-mt-2 text-xs text-ink-soft">{t.selfLearn.extension.selectedHint.replace('{count}', String(selected.length))}</p>

          <Field label={t.selfLearn.extension.confusion} htmlFor="extension-confusion" hint={t.selfLearn.extension.confusionHint}>
            <Textarea
              id="extension-confusion"
              name="confusion"
              rows={4}
              maxLength={800}
              placeholder={t.selfLearn.extension.confusionPlaceholder}
            />
          </Field>

          <Field label={t.selfLearn.form.formatLabel} hint={t.selfLearn.form.formatHint}>
            <CourseFormatPicker defaultFormats={['text']} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.selfLearn.extension.goal} htmlFor="extension-goal">
              <Select id="extension-goal" name="goal" defaultValue="deepen">
                <option value="remedial">{t.selfLearn.extension.goalRemedial}</option>
                <option value="deepen">{t.selfLearn.extension.goalDeepen}</option>
                <option value="project">{t.selfLearn.extension.goalProject}</option>
              </Select>
            </Field>
            <Field label={t.selfLearn.extension.duration} htmlFor="extension-minutes">
              <Select id="extension-minutes" name="minutes" defaultValue="30">
                <option value="15">15 {t.selfLearn.extension.minutes}</option>
                <option value="30">30 {t.selfLearn.extension.minutes}</option>
                <option value="45">45 {t.selfLearn.extension.minutes}</option>
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingText={t.selfLearn.extension.generating}>
              <BookOpenCheck className="h-4 w-4" aria-hidden /> {t.selfLearn.extension.generate}
            </SubmitButton>
            <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
              {t.selfLearn.extension.outlineNote} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
