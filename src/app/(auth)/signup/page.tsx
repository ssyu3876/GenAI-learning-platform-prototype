'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signup } from '@/core/auth/actions';
import { Card, Field, Input, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';

export default function SignupPage() {
  const t = useT();
  const [state, action] = useActionState(signup, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold">{t.chrome.auth.signupTitle}</h1>
      <p className="mt-1 text-ink-soft">{t.chrome.auth.signupSubtitle}</p>
      <form action={action} className="mt-5 flex flex-col gap-4">
        {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
        <Field label={t.chrome.auth.yourName} htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label={t.chrome.auth.email} htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t.chrome.auth.password} htmlFor="password" error={errors.password} hint={t.chrome.auth.passwordHint}>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-display text-sm font-semibold">{t.chrome.auth.roleLegend}</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'learner', label: t.chrome.auth.roleLearner, note: t.chrome.auth.roleLearnerNote },
              { value: 'instructor', label: t.chrome.auth.roleInstructor, note: t.chrome.auth.roleInstructorNote },
            ].map((r, i) => (
              <label
                key={r.value}
                className="flex cursor-pointer flex-col rounded-xl border-2 border-line bg-paper p-3 has-checked:bg-mint-soft has-checked:shadow-sticker-sm"
              >
                <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="sr-only" />
                <span className="font-display font-semibold">{r.label}</span>
                <span className="text-sm text-ink-soft">{r.note}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <SubmitButton pendingText={t.chrome.auth.planting} className="mt-1">
          {t.chrome.auth.createAccountButton}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-ink-soft">
        {t.chrome.auth.alreadyHave}{' '}
        <Link href="/login" className="font-semibold text-coral-deep underline underline-offset-2">
          {t.chrome.landing.login}
        </Link>
      </p>
    </Card>
  );
}
