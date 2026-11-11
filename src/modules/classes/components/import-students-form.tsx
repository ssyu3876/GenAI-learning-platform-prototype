'use client';
// Paste or upload a name,email CSV. After import, temporary passwords for new accounts are
// shown once (they are not stored in plain text anywhere).

import { useActionState, useState, type ChangeEvent } from 'react';
import { KeyRound, Upload } from 'lucide-react';
import type { ActionResult } from '@/core/types';
import { Badge, Card, Field, Notice, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { fmt } from '@/i18n/format';
import { useT } from '@/i18n/client';
import { importStudents, type ImportSummary } from '../actions';
import { CopyButton } from './copy-button';

const MAX_FILE_BYTES = 200_000;

export function ImportStudentsForm({ classId }: { classId: string }) {
  const t = useT();
  const [csv, setCsv] = useState('');
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [state, action] = useActionState(
    async (prev: ActionResult<ImportSummary> | null, formData: FormData) => {
      const result = await importStudents(prev, formData);
      if (result.ok) {
        setCsv('');
        setFileNote(null);
      }
      return result;
    },
    null,
  );

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileNote(t.classes.importForm.fileTooBig);
      return;
    }
    setCsv(await file.text());
    setFileNote(fmt(t.classes.importForm.fileLoaded, { name: file.name }));
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="classId" value={classId} />
        <Field
          label={t.classes.importForm.fieldLabel}
          htmlFor="import-csv"
          hint={t.classes.importForm.fieldHint}
        >
          <Textarea
            id="import-csv"
            name="csv"
            rows={6}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={t.classes.importForm.placeholder}
            className="font-mono text-sm"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText={t.classes.importForm.importing} disabled={csv.trim().length === 0}>
            {t.classes.importForm.import}
          </SubmitButton>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill border-2 border-line bg-paper px-4 font-display font-semibold shadow-sticker-sm hover:bg-butter-soft focus-within:ring-4 focus-within:ring-sky/50">
            <Upload className="h-4 w-4" aria-hidden />
            {t.classes.importForm.upload}
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
          </label>
        </div>
        {fileNote ? <p className="text-sm text-ink-soft" role="status">{fileNote}</p> : null}
        {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
      </form>

      {state?.ok && state.data ? <ImportResults summary={state.data} message={state.message} /> : null}
    </div>
  );
}

function ImportResults({ summary, message }: { summary: ImportSummary; message?: string }) {
  const t = useT();
  const passwordList = summary.created.map((c) => `${c.name}, ${c.email}, ${c.tempPassword}`).join('\n');
  return (
    <div className="flex flex-col gap-3">
      <Notice tone="success">
        {fmt(summary.created.length === 1 ? t.classes.importForm.summaryOne : t.classes.importForm.summary, {
          message: message ?? '',
          created: summary.created.length,
          added: summary.added.length,
          already: summary.alreadyInClass.length,
          skipped: summary.skipped.length,
        })}
      </Notice>

      {summary.created.length > 0 ? (
        <Card tint="butter" className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" aria-hidden />
              <h4 className="font-bold">{t.classes.importForm.temporaryPasswords}</h4>
            </div>
            <CopyButton value={passwordList} label={t.classes.importForm.copyAll} />
          </div>
          <p className="mt-2 text-sm font-semibold">{t.classes.importForm.passwordWarning}</p>
          <div className="mt-3 overflow-x-auto rounded-xl border-2 border-line bg-paper">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-sky-soft font-display">
                <tr>
                  <th scope="col" className="px-3 py-2">{t.classes.importForm.name}</th>
                  <th scope="col" className="px-3 py-2">{t.classes.importForm.email}</th>
                  <th scope="col" className="px-3 py-2">{t.classes.importForm.password}</th>
                </tr>
              </thead>
              <tbody>
                {summary.created.map((c) => (
                  <tr key={c.email} className="border-t-2 border-line/20">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.email}</td>
                    <td className="px-3 py-2 font-mono select-all">{c.tempPassword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {summary.skipped.length > 0 ? (
        <details className="rounded-xl border-2 border-line bg-paper p-3">
          <summary className="cursor-pointer font-display font-semibold">
            {t.classes.importForm.skippedRows} <Badge tint="coral">{summary.skipped.length}</Badge>
          </summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {summary.skipped.map((s, i) => (
              <li key={`${s.row}-${i}`}>
                <span className="font-semibold">{fmt(t.classes.importForm.rowLabel, { row: s.row })}</span> {s.reason}
                {s.text ? <span className="text-ink-soft"> ({s.text})</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {summary.alreadyInClass.length > 0 ? (
        <p className="text-sm text-ink-soft">
          {fmt(t.classes.importForm.alreadyInClass, { emails: summary.alreadyInClass.join(', ') })}
        </p>
      ) : null}
    </div>
  );
}
