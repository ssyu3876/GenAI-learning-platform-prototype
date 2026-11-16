// /assignments/settings: term start + teaching weeks for each managed class.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { buttonClasses, Card, CardBody, EmptyState, Input, PageHeader } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { saveClassTerm } from '../actions';
import { listClassTerms } from '../queries';

export async function AssignmentTermPage({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const terms = await listClassTerms(user);
  const dateValue = (date: Date | null) => {
    if (!date) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  };

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
          </Link>
        }
        title={t.assignments.term.title}
        subtitle={t.assignments.term.subtitle}
      />
      {terms.length === 0 ? (
        <EmptyState title={t.assignments.empty} mood="happy">
          {t.assignments.emptyInstructor}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {terms.map((term) => (
            <Card key={term.classId}>
              <CardBody>
                <form action={saveClassTerm} className="flex flex-col gap-3">
                  <input type="hidden" name="classId" value={term.classId} />
                  <h2 className="font-display text-lg font-bold">{term.className}</h2>
                  <label className="text-sm font-semibold">
                    {t.assignments.term.name}
                    <Input name="name" defaultValue={term.name} required maxLength={80} className="mt-1" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-semibold">
                      {t.assignments.term.startDate}
                      <Input
                        name="startDate"
                        type="date"
                        required
                        defaultValue={dateValue(term.startDate)}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-sm font-semibold">
                      {t.assignments.term.weeks}
                      <Input name="weeks" type="number" min={1} max={30} required defaultValue={term.weeks} className="mt-1" />
                    </label>
                  </div>
                  <p className="text-xs text-ink-soft">{t.assignments.term.hint}</p>
                  <div>
                    <SubmitButton pendingText={t.chrome.common.saving}>{t.assignments.term.save}</SubmitButton>
                  </div>
                </form>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
