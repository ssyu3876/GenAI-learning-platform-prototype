'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Button, buttonClasses, type ButtonVariant } from '@/components/ui';
import { useT } from '@/i18n/client';
import { setMailState } from '../actions';

export function MailDeleteButton({
  messageId,
  action,
  label,
  title,
  body,
  variant = 'danger',
}: {
  messageId: string;
  action: 'delete' | 'purge';
  label: string;
  title: string;
  body: string;
  variant?: ButtonVariant;
}) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.getElementById(`${id}-cancel`)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open, id]);

  function close() {
    setOpen(false);
    confirmed.current = false;
  }

  return (
    <>
      <form
        ref={formRef}
        action={setMailState}
        className="inline-flex"
        onSubmit={(event) => {
          if (!confirmed.current) {
            event.preventDefault();
            setOpen(true);
            return;
          }
          confirmed.current = false;
        }}
      >
        <input type="hidden" name="messageId" value={messageId} />
        <input type="hidden" name="action" value={action} />
        <button type="submit" className={buttonClasses(variant, 'sm')}>
          <Trash2 className="h-4 w-4" aria-hidden /> {label}
        </button>
      </form>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
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
                  {title}
                </h2>
                <p id={`${id}-body`} className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {body}
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button id={`${id}-cancel`} type="button" variant="secondary" onClick={close}>
                    {t.mail.cancel}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      confirmed.current = true;
                      setOpen(false);
                      formRef.current?.requestSubmit();
                    }}
                  >
                    {label}
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
