'use client';
// Role picker for one user row. Disabled for the signed-in admin (no self-demotion).

import { useActionState } from 'react';
import type { UserRole } from '@/core/db/schema';
import { Select } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { changeUserRole } from '../actions';

export function RoleForm({
  userId,
  userName,
  role,
  isSelf,
}: {
  userId: string;
  userName: string;
  role: UserRole;
  isSelf: boolean;
}) {
  const t = useT();
  const [state, action] = useActionState(changeUserRole, null);
  const selectId = `role-${userId}`;
  const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'learner', label: t.admin.roles.learner },
    { value: 'instructor', label: t.admin.roles.instructor },
    { value: 'admin', label: t.admin.roles.admin },
  ];
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          {fmt(t.admin.users.roleLabel, { name: userName })}
        </label>
        <Select id={selectId} name="role" defaultValue={role} disabled={isSelf} className="h-8 w-36 py-0 text-sm">
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <SubmitButton
          variant="secondary"
          size="sm"
          pendingText={t.chrome.common.saving}
          disabled={isSelf}
          aria-label={fmt(t.admin.users.saveRoleLabel, { name: userName })}
        >
          {t.chrome.common.save}
        </SubmitButton>
      </div>
      {isSelf ? <p className="text-xs text-ink-soft">{t.admin.users.selfNote}</p> : null}
      {state ? (
        <p role={state.ok ? 'status' : 'alert'} className={state.ok ? 'text-xs font-semibold text-mint-deep' : 'text-xs font-semibold text-danger'}>
          {state.ok ? state.message : state.error}
        </p>
      ) : null}
    </form>
  );
}
