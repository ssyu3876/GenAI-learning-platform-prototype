'use client';

import { useActionState, useState } from 'react';
import { Card, Field, Input, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { savePrefs } from '../actions';
import type { DisplayMode } from '../schema';

export function PrivacyForm({ displayMode, nickname }: { displayMode: DisplayMode; nickname: string | null }) {
  const t = useT();
  const [state, action] = useActionState(savePrefs, null);
  const [mode, setMode] = useState<DisplayMode>(displayMode);

  const OPTIONS: { value: DisplayMode; label: string; note: string }[] = [
    { value: 'name', label: t.leaderboard.privacy.nameLabel, note: t.leaderboard.privacy.nameNote },
    { value: 'nickname', label: t.leaderboard.privacy.nicknameLabel, note: t.leaderboard.privacy.nicknameNote },
    { value: 'hidden', label: t.leaderboard.privacy.hiddenLabel, note: t.leaderboard.privacy.hiddenNote },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold">{t.leaderboard.privacy.title}</h3>
      <p className="mb-4 text-sm text-ink-soft">{t.leaderboard.privacy.subtitle}</p>
      <form action={action} className="flex flex-col gap-3">
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">{t.leaderboard.privacy.displayMode}</legend>
          {OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer flex-col rounded-xl border-2 border-line bg-paper p-3 has-checked:bg-butter-soft has-checked:shadow-sticker-sm">
              <input type="radio" name="displayMode" value={o.value} checked={mode === o.value} onChange={() => setMode(o.value)} className="sr-only" />
              <span className="font-display font-semibold">{o.label}</span>
              <span className="text-xs text-ink-soft">{o.note}</span>
            </label>
          ))}
        </fieldset>
        {mode === 'nickname' ? (
          <Field label={t.leaderboard.privacy.nicknameField} htmlFor="nickname">
            <Input
              id="nickname"
              name="nickname"
              defaultValue={nickname ?? ''}
              maxLength={24}
              placeholder={t.leaderboard.privacy.nicknamePlaceholder}
            />
          </Field>
        ) : null}
        {state ? <Notice tone={state.ok ? 'success' : 'error'}>{state.ok ? state.message : state.error}</Notice> : null}
        <SubmitButton variant="secondary" size="sm" className="self-start" pendingText={t.chrome.common.saving}>
          {t.chrome.common.save}
        </SubmitButton>
      </form>
    </Card>
  );
}
