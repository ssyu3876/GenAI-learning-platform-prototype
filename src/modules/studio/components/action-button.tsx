'use client';

// A one-button form for small studio actions (move, delete, publish, duplicate).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, cn, type ButtonVariant } from '@/components/ui';
import { useT } from '@/i18n/client';
import { useFormAction, type FormAction } from './use-form-action';

export function ActionButton({
  action,
  fields,
  children,
  pendingText,
  variant = 'secondary',
  size = 'sm',
  confirmText,
  confirmTitle,
  confirmLabel,
  ariaLabel,
  disabled,
  showMessage,
  className,
}: {
  action: FormAction;
  fields: Record<string, string>;
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Ask before running (e.g. deleting). Opens the in-app confirmation dialog. */
  confirmText?: string;
  confirmTitle?: string;
  confirmLabel?: string;
  /** Required when the button only shows an icon */
  ariaLabel?: string;
  disabled?: boolean;
  /** Also show the success message (errors are always shown) */
  showMessage?: boolean;
  className?: string;
}) {
  const t = useT();
  const { state, pending, onSubmit } = useFormAction(action);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!confirmOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    document.getElementById(`${id}-cancel`)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [confirmOpen, id]);

  function closeConfirm() {
    setConfirmOpen(false);
    confirmed.current = false;
  }

  function acceptConfirm() {
    confirmed.current = true;
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        className={cn('inline-flex flex-col items-start gap-1', className)}
        onSubmit={(event) => {
          if (confirmText && !confirmed.current) {
            event.preventDefault();
            setConfirmOpen(true);
            return;
          }
          confirmed.current = false;
          onSubmit(event);
        }}
      >
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button
          type="submit"
          variant={variant}
          size={size}
          disabled={disabled || pending}
          aria-busy={pending}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          {pending && pendingText ? pendingText : children}
        </Button>
        {state && !state.ok ? (
          <p role="alert" className="max-w-xs text-sm font-semibold text-danger">
            {state.error}
          </p>
        ) : null}
        {showMessage && state?.ok && state.message ? (
          <p role="status" className="max-w-xs text-sm font-semibold text-mint-deep">
            {state.message}
          </p>
        ) : null}
      </form>

      {confirmOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeConfirm();
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
                aria-describedby={`${id}-body`}
                className="w-full max-w-md rounded-blob border-2 border-line bg-paper p-5 shadow-sticker"
              >
                <h2 id={`${id}-title`} className="font-display text-xl font-bold">
                  {confirmTitle ?? t.studio.common.confirmTitle}
                </h2>
                <p id={`${id}-body`} className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {confirmText}
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button id={`${id}-cancel`} type="button" variant="secondary" onClick={closeConfirm}>
                    {t.studio.common.cancel}
                  </Button>
                  <Button type="button" variant="danger" onClick={acceptConfirm}>
                    {confirmLabel ?? t.studio.common.confirm}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
