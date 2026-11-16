'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Clock, FileUp } from 'lucide-react';
import { Badge, Card, CardBody, Field, Input, Notice, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { submitAssignment } from '../actions';
import type { StudentAssignmentDetail } from '../queries';

export function StudentAssignmentForm({ assignment }: { assignment: StudentAssignmentDetail }) {
  const t = useT();
  const [state, formAction] = useActionState(submitAssignment, null);
  const submission = assignment.submission;
  const quiz = assignment.type === 'quiz';
  const open = new Date() <= assignment.dueAt;

  if (assignment.locked) {
    return (
      <Notice>
        {fmt(t.assignments.detail.locked, { week: assignment.weekNo })}
        {assignment.unlockAt
          ? ` · ${fmt(t.assignments.detail.unlockAt, {
              date: assignment.unlockAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            })}`
          : ''}
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {assignment.group ? (
        <Card tint="butter">
          <CardBody className="flex flex-col gap-1">
            <p className="font-display font-bold">
              {t.assignments.detail.groupLabel}: {assignment.group.name}
            </p>
            <p className="text-sm text-ink-soft">
              {t.assignments.detail.groupMembers}: {assignment.group.members.join(', ')}
            </p>
          </CardBody>
        </Card>
      ) : null}
      {submission ? (
        <Card tint="mint">
          <CardBody className="flex flex-col gap-2">
            <p className="flex items-center gap-2 font-display font-bold">
              <CheckCircle2 className="h-5 w-5" aria-hidden /> {t.assignments.detail.submissionReceived}
            </p>
            <p className="text-sm text-ink-soft">
              {fmt(t.assignments.detail.scoreLine, {
                score: submission.score ?? '—',
                points: assignment.points,
              })}
            </p>
            {submission.feedback ? (
              <p className="text-sm">
                <strong>{t.assignments.detail.feedbackLine}:</strong> {submission.feedback}
              </p>
            ) : null}
            {submission.fileName ? (
              <a
                href={`/api/assignments/submissions/${submission.id}/file`}
                className="text-sm font-semibold text-coral-deep underline underline-offset-2"
              >
                {submission.fileName}
              </a>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {!open ? (
        <Notice tone="error">
          <Clock className="mr-1 inline h-4 w-4" aria-hidden /> {t.assignments.detail.overdue}
        </Notice>
      ) : null}

      <Card>
        <CardBody>
          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="assignmentId" value={assignment.id} />
            {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
            {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}

            {quiz ? (
              <div className="flex flex-col gap-5">
                <p className="text-sm text-ink-soft">{t.assignments.detail.quizNote}</p>
                {assignment.questions.map((question, index) => (
                  <fieldset key={question.id} className="rounded-xl border-2 border-line/60 p-4">
                    <legend className="px-1 font-semibold">
                      {index + 1}. {question.prompt}
                    </legend>
                    {question.hasImage ? (
                      <Image
                        src={`/api/assignments/questions/${question.id}/image`}
                        alt=""
                        width={640}
                        height={360}
                        unoptimized
                        className="mt-2 h-auto max-h-64 w-auto rounded-lg border-2 border-line/30"
                      />
                    ) : null}
                    {question.kind === 'single' ? (
                      <div className="mt-2 flex flex-col gap-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`q_${question.id}`}
                              value={optionIndex}
                              required
                              defaultChecked={submission?.answers[question.id] === String(optionIndex)}
                            />
                            <span>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Textarea
                        name={`q_${question.id}`}
                        rows={4}
                        className="mt-2"
                        defaultValue={submission?.answers[question.id] ?? ''}
                      />
                    )}
                  </fieldset>
                ))}
              </div>
            ) : (
              <>
                <Field label={t.assignments.detail.textAnswer} htmlFor="assignment-answer">
                  <Textarea
                    id="assignment-answer"
                    name="textContent"
                    rows={7}
                    maxLength={20000}
                    defaultValue={submission?.textContent ?? ''}
                    placeholder={t.assignments.detail.answerPlaceholder}
                  />
                </Field>
                <Field label={t.assignments.detail.file} htmlFor="assignment-file" hint={t.assignments.detail.fileHint}>
                  <Input
                    id="assignment-file"
                    name="file"
                    type="file"
                    className="h-auto py-2"
                  />
                </Field>
              </>
            )}

            <div className="flex items-center gap-3">
              <SubmitButton pendingText={t.assignments.detail.submitting}>
                <FileUp className="h-4 w-4" aria-hidden />
                {submission ? t.assignments.detail.resubmit : t.assignments.detail.submit}
              </SubmitButton>
              <Badge tint={quiz ? 'sky' : 'butter'}>
                {fmt(t.assignments.points, { points: assignment.points })}
              </Badge>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
