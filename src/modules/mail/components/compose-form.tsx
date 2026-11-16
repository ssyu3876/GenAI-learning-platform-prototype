'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowLeft, Save, Search, Send } from 'lucide-react';
import { Button, Card, CardBody, Field, Input, Notice, Select, Textarea, buttonClasses } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { saveDraft, sendMail } from '../actions';
import type { MailClassGroup, MailRecipient } from '../queries';

export interface ComposeDefaults {
  draftId?: string;
  recipientIds?: string[];
  ccIds?: string[];
  bccIds?: string[];
  classId?: string | null;
  subject?: string;
  body?: string;
}

export function ComposeMailForm({
  recipients,
  classes,
  defaults,
}: {
  recipients: MailRecipient[];
  classes: MailClassGroup[];
  defaults: ComposeDefaults;
}) {
  const t = useT();
  const [state, formAction] = useActionState(sendMail, null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(defaults.recipientIds ?? []);
  const filtered = recipients.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
          {state?.ok ? (
            <Notice tone="success">
              {state.message}{' '}
              <Link href="/mail?tab=sent" className="underline underline-offset-2">
                {t.mail.tabs.sent}
              </Link>
            </Notice>
          ) : null}
          {defaults.draftId ? <input type="hidden" name="draftId" value={defaults.draftId} /> : null}

          <Field label={t.mail.to} htmlFor="mail-recipient-search" hint={t.mail.toHint}>
            <div className="relative">
              <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-ink-soft" aria-hidden />
              <Input
                id="mail-recipient-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.mail.searchRecipients}
                className="pl-9"
              />
            </div>
            <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border-2 border-line bg-paper p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-ink-soft">{t.mail.toHint}</p>
              ) : (
                filtered.map((person) => (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-butter-soft"
                  >
                    <input
                      type="checkbox"
                      name="recipientIds"
                      value={person.id}
                      checked={selected.includes(person.id)}
                      onChange={() => toggle(person.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">{person.name}</span>
                    <span className="text-xs text-ink-soft">{t.chrome.shell[person.role]}</span>
                  </label>
                ))
              )}
              {selected
                .filter((id) => !filtered.some((person) => person.id === id))
                .map((id) => (
                  <input key={id} type="hidden" name="recipientIds" value={id} />
                ))}
            </div>
            <p className="text-xs text-ink-soft">{selected.length > 0 ? t.mail.recipientsSelected.replace('{count}', String(selected.length)) : null}</p>
          </Field>

          <details className="rounded-xl border-2 border-line/40 bg-paper px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">
              {t.mail.cc} / {t.mail.bcc}
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label={t.mail.cc} htmlFor="mail-cc" hint={t.mail.ccHint}>
                <Select id="mail-cc" name="ccIds" multiple defaultValue={defaults.ccIds ?? []} className="h-auto min-h-28">
                  {recipients.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {t.chrome.shell[person.role]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.mail.bcc} htmlFor="mail-bcc" hint={t.mail.bccHint}>
                <Select id="mail-bcc" name="bccIds" multiple defaultValue={defaults.bccIds ?? []} className="h-auto min-h-28">
                  {recipients.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {t.chrome.shell[person.role]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </details>

          {classes.length > 0 ? (
            <Field label={t.mail.classGroup} htmlFor="mail-class" hint={t.mail.classGroupHint}>
              <Select id="mail-class" name="classId" defaultValue={defaults.classId ?? ''}>
                <option value="">—</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} · {cls.memberCount}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field label={t.mail.subject} htmlFor="mail-subject">
            <Input
              id="mail-subject"
              name="subject"
              required
              maxLength={120}
              defaultValue={defaults.subject}
              placeholder={t.mail.subjectPlaceholder}
            />
          </Field>

          <Field label={t.mail.body} htmlFor="mail-body">
            <Textarea
              id="mail-body"
              name="body"
              required
              maxLength={5000}
              rows={9}
              defaultValue={defaults.body}
              placeholder={t.mail.bodyPlaceholder}
            />
          </Field>

          <Field label={t.mail.attachFiles} htmlFor="mail-attachments">
            <Input
              id="mail-attachments"
              name="attachments"
              type="file"
              multiple
              className="h-auto cursor-pointer py-2"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingText={t.mail.sending}>
              <Send className="h-4 w-4" aria-hidden /> {t.mail.send}
            </SubmitButton>
            <Button type="submit" formAction={saveDraft} formNoValidate variant="secondary">
              <Save className="h-4 w-4" aria-hidden /> {t.mail.saveDraft}
            </Button>
            <Link href="/mail" className={buttonClasses('ghost', 'sm')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t.mail.backToInbox}
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
