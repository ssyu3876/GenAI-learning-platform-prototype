'use client';
// Take a published course offline, or bring an archived one back as a draft. Only shown for
// the two statuses it can act on, so the table does not grow a column of dead buttons.
import { useActionState } from 'react';
import { ArchiveRestore, ArchiveX } from 'lucide-react';
import { Notice } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { archiveCourse, restoreCourse } from '../actions';

export function CourseStatusButtons({
  courseId,
  title,
  status,
}: {
  courseId: string;
  title: string;
  status: string;
}) {
  const t = useT();
  const [archived, archive] = useActionState(archiveCourse, null);
  const [restored, restore] = useActionState(restoreCourse, null);
  const result = archived ?? restored;

  if (status !== 'published' && status !== 'archived') return null;

  return (
    <div className="flex flex-col items-start gap-1">
      {status === 'published' ? (
        <form
          action={archive}
          onSubmit={(event) => {
            if (!window.confirm(fmt(t.admin.courses.archiveConfirm, { title }))) event.preventDefault();
          }}
        >
          <input type="hidden" name="courseId" value={courseId} />
          <SubmitButton
            variant="ghost"
            size="sm"
            pendingText={t.admin.courses.archiving}
            aria-label={fmt(t.admin.courses.archiveLabel, { title })}
            className="whitespace-nowrap"
          >
            <ArchiveX className="h-3.5 w-3.5" aria-hidden /> {t.admin.courses.archive}
          </SubmitButton>
        </form>
      ) : (
        <form action={restore}>
          <input type="hidden" name="courseId" value={courseId} />
          <SubmitButton
            variant="secondary"
            size="sm"
            pendingText={t.admin.courses.restoring}
            aria-label={fmt(t.admin.courses.restoreLabel, { title })}
            className="whitespace-nowrap"
          >
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden /> {t.admin.courses.restore}
          </SubmitButton>
        </form>
      )}
      {result ? (
        <Notice tone={result.ok ? 'success' : 'error'}>{result.ok ? result.message : result.error}</Notice>
      ) : null}
    </div>
  );
}
