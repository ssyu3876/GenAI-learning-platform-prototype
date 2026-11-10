'use client';
// Copies a string to the clipboard and confirms it in place (announced to screen readers).

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui';
import { useT } from '@/i18n/client';

export function CopyButton({
  value,
  label,
  copiedLabel,
  variant = 'secondary',
}: {
  value: string;
  label: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
}) {
  const t = useT();
  const copiedText = copiedLabel ?? t.classes.copyButton.copied;
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant={variant} size="sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? copiedText : label}
      </Button>
      <span role="status" className="sr-only">
        {copied ? copiedText : ''}
      </span>
      {failed ? <span className="text-xs font-semibold text-danger">{t.classes.copyButton.failed}</span> : null}
    </span>
  );
}
