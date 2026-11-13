'use client';

// Topic form for "Learn anything". Runs the action from onSubmit (not <form action>) so the
// typed topic survives an error such as the daily limit.
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import { WandSparkles } from 'lucide-react';
import type { ActionResult } from '@/core/types';
import { Button, Card, Field, Input, Notice, PipSays, Select } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { generateLearnerOutline } from '../actions';
import { SINGLE_COURSE_MAX_HOURS } from '../types';

export function LearnForm({ remaining, limit }: { remaining: number; limit: number }) {
  const t = useT();
  const [state, dispatch, pending] = useActionState<ActionResult | null, FormData>(generateLearnerOutline, null);
  const [topic, setTopic] = useState('');
  const [timeBudget, setTimeBudget] = useState('1h');
  const [customHours, setCustomHours] = useState(2);
  const needsSplit = timeBudget === 'custom' && customHours > SINGLE_COURSE_MAX_HOURS;
  const splitOptions = needsSplit
    ? [2, 3]
        .map((parts) => ({ parts, hours: customHours / parts }))
        .filter((option) => option.hours <= SINGLE_COURSE_MAX_HOURS && option.hours >= 0.25)
    : [];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsSplit) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-busy={pending}>
        {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
        <Field label={t.selfLearn.form.topicLabel} htmlFor="topic">
          <Input
            id="topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.selfLearn.form.topicPlaceholder}
            required
            minLength={3}
            maxLength={200}
            disabled={pending}
            className="h-12 text-lg"
          />
        </Field>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.selfLearn.form.exampleTopics}>
          {t.selfLearn.form.examples.map((example) => (
            <button
              key={example}
              type="button"
              disabled={pending}
              aria-pressed={topic === example}
              onClick={() => setTopic(example)}
              className="rounded-pill border-2 border-line bg-butter-soft px-3 py-1 text-sm font-semibold hover:bg-butter disabled:opacity-60"
            >
              {example}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label={t.selfLearn.form.whyLabel} htmlFor="why" hint={t.selfLearn.form.whyHint}>
            <Input
              id="why"
              name="why"
              maxLength={300}
              placeholder={t.selfLearn.form.whyPlaceholder}
              disabled={pending}
            />
          </Field>
          <Field label={t.selfLearn.form.levelLabel} htmlFor="level">
            <Select id="level" name="level" defaultValue="beginner" disabled={pending}>
              <option value="beginner">{t.selfLearn.form.levelBeginner}</option>
              <option value="intermediate">{t.selfLearn.form.levelIntermediate}</option>
              <option value="advanced">{t.selfLearn.form.levelAdvanced}</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.selfLearn.form.timeLabel} htmlFor="timeBudget" hint={t.selfLearn.form.timeHint}>
            <Select
              id="timeBudget"
              name="timeBudget"
              value={timeBudget}
              onChange={(event) => setTimeBudget(event.target.value)}
              disabled={pending}
            >
              {Object.entries(t.selfLearn.form.timeOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            {timeBudget === 'custom' ? (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  name="customHours"
                  type="number"
                  min={0.25}
                  max={60}
                  step={0.25}
                  value={customHours}
                  onChange={(event) => setCustomHours(Number(event.target.value))}
                  aria-label={t.selfLearn.form.customHoursLabel}
                  disabled={pending}
                  className="max-w-28"
                />
                <span className="text-sm text-ink-soft">{t.selfLearn.form.customHoursUnit}</span>
              </div>
            ) : null}
            {timeBudget === 'custom' && needsSplit ? (
              <div className="mt-2 rounded-xl border-2 border-line bg-sky-soft p-3 text-sm">
                <p className="font-bold">{fmt(t.selfLearn.form.splitTitle, { hours: customHours })}</p>
                <p className="mt-1 text-ink-soft">{fmt(t.selfLearn.form.splitBody, { hours: SINGLE_COURSE_MAX_HOURS })}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {splitOptions.map((option) => (
                    <button
                      key={option.parts}
                      type="button"
                      className="rounded-pill border-2 border-line bg-paper px-3 py-1 text-xs font-semibold hover:bg-butter-soft"
                      onClick={() => setCustomHours(Number(option.hours.toFixed(2)))}
                    >
                      {fmt(t.selfLearn.form.splitOption, {
                        parts: option.parts,
                        hours: Number(option.hours.toFixed(1)),
                      })}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-soft">{t.selfLearn.form.splitNote}</p>
              </div>
            ) : null}
            {timeBudget === 'custom' && !needsSplit ? (
              <p className="mt-1 text-xs text-ink-soft">{t.selfLearn.form.customHoursHint}</p>
            ) : null}
          </Field>
          <Field label={t.selfLearn.form.lessonCountLabel} htmlFor="lessonCount" hint={t.selfLearn.form.lessonCountHint}>
            <Select id="lessonCount" name="lessonCount" defaultValue="" disabled={pending}>
              <option value="">{t.selfLearn.form.lessonCountAuto}</option>
              {[4, 6, 8, 10, 12].map((value) => (
                <option key={value} value={value}>
                  {value} {t.selfLearn.form.lessonCountUnit}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.selfLearn.form.styleLabel} htmlFor="explanationStyle" hint={t.selfLearn.form.styleHint}>
            <Select id="explanationStyle" name="explanationStyle" defaultValue="examples" disabled={pending}>
              {Object.entries(t.selfLearn.form.styleOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.selfLearn.form.formatLabel} htmlFor="contentFormat" hint={t.selfLearn.form.formatHint}>
            <Select id="contentFormat" name="contentFormat" defaultValue="mixed" disabled={pending}>
              {Object.entries(t.selfLearn.form.formatOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.selfLearn.form.assessmentLabel} htmlFor="assessment" hint={t.selfLearn.form.assessmentHint}>
            <Select id="assessment" name="assessment" defaultValue="mixed" disabled={pending}>
              {Object.entries(t.selfLearn.form.assessmentOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {pending ? (
          <PipSays mood="think" size={64}>
            <p className="font-display font-bold">{t.selfLearn.form.planningTitle}</p>
            <p className="text-sm text-ink-soft">{t.selfLearn.form.planningNote}</p>
          </PipSays>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={pending || remaining <= 0 || needsSplit} aria-busy={pending}>
            <WandSparkles className="h-4 w-4" aria-hidden />
            {pending ? t.selfLearn.form.writingButton : t.selfLearn.form.makeCourse}
          </Button>
          <p className="text-sm text-ink-soft">
            {remaining > 0
              ? fmt(t.selfLearn.form.remaining, { remaining, limit })
              : fmt(t.selfLearn.form.limitReached, { limit })}
          </p>
        </div>
      </form>
    </Card>
  );
}
