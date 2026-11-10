'use client';
// "New class" form for staff and "Join with a code" form for learners.

import { useActionState } from 'react';
import { Field, Input, Notice, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { createClass, joinClass } from '../actions';

export function CreateClassForm() {
  const t = useT();
  const [state, action] = useActionState(createClass, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state ? <Notice tone={state.ok ? 'success' : 'error'}>{state.ok ? state.message : state.error}</Notice> : null}
      <Field label={t.classes.createForm.className} htmlFor="class-name">
        <Input
          id="class-name"
          name="name"
          required
          maxLength={80}
          placeholder={t.classes.createForm.classNamePlaceholder}
        />
      </Field>
      <Field
        label={t.classes.createForm.description}
        htmlFor="class-description"
        hint={t.classes.createForm.descriptionHint}
      >
        <Textarea
          id="class-description"
          name="description"
          maxLength={300}
          rows={3}
          placeholder={t.classes.createForm.descriptionPlaceholder}
        />
      </Field>
      <SubmitButton pendingText={t.classes.createForm.creating} className="self-start">
        {t.classes.createForm.create}
      </SubmitButton>
    </form>
  );
}

export function JoinClassForm() {
  const t = useT();
  const [state, action] = useActionState(joinClass, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state ? <Notice tone={state.ok ? 'success' : 'error'}>{state.ok ? state.message : state.error}</Notice> : null}
      <Field label={t.classes.joinForm.inviteCode} htmlFor="invite-code" hint={t.classes.joinForm.hint}>
        <Input
          id="invite-code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          placeholder={t.classes.joinForm.codePlaceholder}
          className="font-mono tracking-[0.3em] uppercase"
        />
      </Field>
      <SubmitButton pendingText={t.classes.joinForm.joining} className="self-start">
        {t.classes.joinForm.join}
      </SubmitButton>
    </form>
  );
}
