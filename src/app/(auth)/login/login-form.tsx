'use client';

import Link from 'next/link';
import { useActionState, useRef } from 'react';
import { login } from '@/core/auth/actions';
import { Card, Field, Input, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';

const DEMO_PASSWORD = 'sprout123';

export function LoginForm() {
  const t = useT();

  // Prototype only: shared demo accounts created by `npm run db:seed`.
  const DEMO_ACCOUNTS = [
    { label: t.chrome.auth.demoLearner, email: 'learner@demo.dev' },
    { label: t.chrome.auth.demoNewLearner, email: 'new@demo.dev' },
    { label: t.chrome.auth.demoInstructor, email: 'instructor@demo.dev' },
    { label: t.chrome.auth.demoAdmin, email: 'admin@demo.dev' },
  ];
  const [state, action] = useActionState(login, null);
  const formRef = useRef<HTMLFormElement>(null);

  function fillDemo(email: string) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem('email') as HTMLInputElement).value = email;
    (form.elements.namedItem('password') as HTMLInputElement).value = DEMO_PASSWORD;
    form.requestSubmit();
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold">{t.chrome.auth.welcomeBack}</h1>
      <p className="mt-1 text-ink-soft">{t.chrome.auth.pipKeptSeat}</p>
      <form ref={formRef} action={action} className="mt-5 flex flex-col gap-4">
        {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
        <Field label={t.chrome.auth.email} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t.chrome.auth.password} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton pendingText={t.chrome.auth.loggingIn} className="mt-1">
          {t.chrome.landing.login}
        </SubmitButton>
      </form>

      <div className="mt-6 rounded-xl border-2 border-dashed border-line/40 p-3">
        <p className="text-sm font-semibold">{fmt(t.chrome.auth.demoAccounts, { password: DEMO_PASSWORD })}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => fillDemo(a.email)}
              className="rounded-pill border-2 border-line bg-butter-soft px-3 py-1 text-sm font-semibold hover:bg-butter"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-ink-soft">
        {t.chrome.auth.newHere}{' '}
        <Link href="/signup" className="font-semibold text-coral-deep underline underline-offset-2">
          {t.chrome.auth.createAccount}
        </Link>
      </p>
    </Card>
  );
}
