'use client';
// Open / close button for one scenario row in /admin/scenarios.
import { useActionState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Input, Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { setScenarioEnabled } from './actions';

export function ScenarioToggle({
  scenarioKey,
  name,
  closed,
}: {
  scenarioKey: string;
  name: string;
  closed: boolean;
}) {
  const t = useT();
  const [result, action] = useActionState(setScenarioEnabled, null);
  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="scenarioKey" value={scenarioKey} />
      <input type="hidden" name="scenarioName" value={name} />
      {/* The action receives the state we want after the click, not the current one. */}
      <input type="hidden" name="enabled" value={closed ? 'true' : 'false'} />
      <label className="sr-only" htmlFor={`reason-${scenarioKey}`}>
        {t.admin.scenarios.reasonLabel}
      </label>
      <Input
        id={`reason-${scenarioKey}`}
        name="reason"
        maxLength={200}
        placeholder={t.admin.scenarios.reasonPlaceholder}
        className="w-44 text-sm"
      />
      <SubmitButton
        variant={closed ? 'secondary' : 'ghost'}
        size="sm"
        pendingText={t.admin.scenarios.toggling}
        className="whitespace-nowrap"
      >
        {closed ? (
          <>
            <Unlock className="h-3.5 w-3.5" aria-hidden /> {t.admin.scenarios.open}
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" aria-hidden /> {t.admin.scenarios.close}
          </>
        )}
      </SubmitButton>
      {result ? (
        <Notice tone={result.ok ? 'success' : 'error'}>{result.ok ? result.message : result.error}</Notice>
      ) : null}
    </form>
  );
}
