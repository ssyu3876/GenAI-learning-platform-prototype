// /assignments/[assignmentId]: teacher review/grading or student submission.
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarClock, Download, FileText, Send, Users } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, Markdown, Notice, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { gradeSubmission, publishAssignment, remindAssignment, uploadQuestionImage } from '../actions';
import { StudentAssignmentForm } from '../components/student-form';
import { PeerReviewPanel } from '../components/peer-review-panel';
import { getPeerReviewData, getStudentAssignment, getTeacherAssignment } from '../queries';

function typeTint(type: 'quiz' | 'project' | 'assignment') {
  return type === 'quiz' ? 'sky' : type === 'project' ? 'lilac' : 'butter';
}

function dateLabel(value: Date, locale: 'en' | 'zh') {
  return value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function AssignmentDetailPage({
  user,
  assignmentId,
  reminded,
}: {
  user: SessionUser;
  assignmentId: string;
  reminded?: number;
}) {
  const { locale, t } = await getT();
  const isTeacher = user.role !== 'learner';
  const teacher = isTeacher ? await getTeacherAssignment(user, assignmentId) : null;
  const student = !isTeacher ? await getStudentAssignment(user, assignmentId) : null;
  const assignment = teacher ?? student;
  const peerData =
    student?.submission && student.peerReviewCount > 0
      ? await getPeerReviewData(user, assignmentId)
      : { targets: [], reviews: [] };

  if (!assignment) {
    return (
      <div>
        <PageHeader
          title={t.assignments.detail.notAvailable}
          eyebrow={
            <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
            </Link>
          }
        />
      </div>
    );
  }

  const type = assignment.type;
  const due = dateLabel(assignment.dueAt, locale);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/assignments" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.title}
          </Link>
        }
        title={assignment.title}
        subtitle={`${assignment.courseTitle}${assignment.lessonTitle ? ` · ${assignment.lessonTitle}` : ''}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tint={typeTint(type)}>{t.assignments.type[type]}</Badge>
            <Badge tint="paper">{fmt(t.assignments.week, { week: assignment.weekNo })}</Badge>
            {teacher ? (
              <Badge tint={teacher.publishedAt ? 'mint' : 'paper'}>
                {teacher.publishedAt ? t.assignments.published : t.assignments.draft}
              </Badge>
            ) : null}
          </div>
        }
      />

      {reminded !== undefined ? (
        <Notice tone="success" className="mb-4">
          {fmt(t.assignments.detail.reminded, { count: reminded })}
        </Notice>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardBody className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t.assignments.detail.instructions}
              </p>
              <Markdown>{assignment.instructions}</Markdown>
              {'file' in assignment && assignment.file ? (
                <a
                  href={`/api/assignments/${assignment.id}/file`}
                  className="inline-flex w-fit items-center gap-2 rounded-pill border-2 border-line bg-paper px-3 py-2 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" aria-hidden /> {assignment.file.filename}
                </a>
              ) : null}
            </CardBody>
          </Card>

          {teacher && teacher.questions.length > 0 ? (
            <Card>
              <CardBody className="flex flex-col gap-4">
                <h2 className="font-display text-xl font-bold">{t.assignments.detail.questions}</h2>
                {teacher.questions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border-2 border-line/40 p-3">
                    <p className="font-semibold">
                      {index + 1}. {question.prompt}
                    </p>
                    {question.hasImage ? (
                      <Image
                        src={`/api/assignments/questions/${question.id}/image`}
                        alt=""
                        width={640}
                        height={360}
                        unoptimized
                        className="mt-2 h-auto max-h-72 w-auto rounded-lg border-2 border-line/30"
                      />
                    ) : null}
                    {question.options.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-1 text-sm">
                        {question.options.map((option, optionIndex) => (
                          <li
                            key={option}
                            className={String(optionIndex) === question.answer ? 'font-semibold text-mint-deep' : ''}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-ink-soft">Answer: {question.answer || '—'}</p>
                    )}
                    <form action={uploadQuestionImage} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="assignmentId" value={teacher.id} />
                      <input type="hidden" name="questionId" value={question.id} />
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        required
                        className="max-w-48 text-xs"
                      />
                      <button type="submit" className={buttonClasses('ghost', 'sm')}>
                        {t.assignments.detail.uploadImage}
                      </button>
                    </form>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {student ? (
            <>
              <StudentAssignmentForm assignment={student} />
              <PeerReviewPanel
                assignmentId={student.id}
                targets={peerData.targets}
                reviews={peerData.reviews}
              />
            </>
          ) : teacher ? (
            <>
              <Card>
                <CardBody className="flex flex-wrap items-center gap-2">
                  {!teacher.publishedAt ? (
                    <form action={publishAssignment}>
                      <input type="hidden" name="assignmentId" value={teacher.id} />
                      <button type="submit" className={buttonClasses('primary', 'sm')}>
                        <Send className="h-4 w-4" aria-hidden /> {t.assignments.detail.publish}
                      </button>
                    </form>
                  ) : (
                    <form action={remindAssignment}>
                      <input type="hidden" name="assignmentId" value={teacher.id} />
                      <button type="submit" className={buttonClasses('secondary', 'sm')}>
                        <Send className="h-4 w-4" aria-hidden /> {t.assignments.detail.remind}
                      </button>
                    </form>
                  )}
                  <p className="text-sm text-ink-soft">
                    {teacher.publishedAt ? t.assignments.detail.publishHint : ''}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                    <Users className="h-5 w-5" aria-hidden /> {t.assignments.detail.submissions}
                  </h2>
                  {teacher.submissions.length === 0 ? (
                    <p className="text-sm text-ink-soft">{t.assignments.detail.noSubmissions}</p>
                  ) : (
                    teacher.submissions.map((submission) => (
                      <div key={submission.id} className="rounded-xl border-2 border-line/40 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {submission.groupName ?? submission.studentName}{' '}
                            {submission.groupName ? (
                              <span className="font-normal text-ink-soft">· {submission.studentName}</span>
                            ) : null}{' '}
                            <Badge tint={submission.status === 'graded' ? 'mint' : 'sky'}>
                              {t.assignments.submissionStatus[submission.status]}
                            </Badge>
                          </p>
                          <span className="text-xs text-ink-soft">{dateLabel(submission.submittedAt, locale)}</span>
                        </div>
                        {submission.textContent ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm">{submission.textContent}</p>
                        ) : null}
                        {submission.fileName ? (
                          <a
                            href={`/api/assignments/submissions/${submission.id}/file`}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-coral-deep underline"
                          >
                            <FileText className="h-4 w-4" aria-hidden /> {submission.fileName}
                          </a>
                        ) : null}
                        <form action={gradeSubmission} className="mt-3 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="submissionId" value={submission.id} />
                          <input type="hidden" name="assignmentId" value={teacher.id} />
                          <label className="text-sm font-semibold">
                            {t.assignments.detail.score}
                            <input
                              name="score"
                              type="number"
                              min={0}
                              max={teacher.points}
                              defaultValue={submission.score ?? ''}
                              className="mt-1 block h-9 w-24 rounded-xl border-2 border-line bg-paper px-2"
                            />
                          </label>
                          <label className="min-w-48 flex-1 text-sm font-semibold">
                            {t.assignments.detail.feedback}
                            <input
                              name="feedback"
                              defaultValue={submission.feedback}
                              placeholder={t.assignments.detail.gradePlaceholder}
                              className="mt-1 block h-9 w-full rounded-xl border-2 border-line bg-paper px-2"
                            />
                          </label>
                          <button type="submit" className={buttonClasses('secondary', 'sm')}>
                            {t.assignments.detail.saveGrade}
                          </button>
                        </form>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </>
          ) : null}
        </div>

        <Card tint="sky" className="p-4">
          <div className="flex flex-col gap-3 text-sm">
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" aria-hidden />
              <strong>{t.assignments.detail.dueLabel}:</strong> {due}
            </p>
            <p>
              <strong>{t.assignments.detail.pointsLabel}:</strong> {assignment.points}
            </p>
            <p>
              <strong>{t.assignments.detail.weightLabel}:</strong> {assignment.weight}
            </p>
            <p>
              <strong>{t.assignments.detail.classLabel}:</strong> {assignment.className}
            </p>
            <p>
              <strong>{t.assignments.detail.courseLabel}:</strong> {assignment.courseTitle}
            </p>
            <p>
              <strong>{t.assignments.detail.weekLabel}:</strong> {assignment.weekNo}
            </p>
            <p>
              <strong>{t.assignments.detail.typeLabel}:</strong> {t.assignments.type[type]}
            </p>
            {'groupSize' in assignment && assignment.groupSize > 1 ? (
              <p>
                <strong>{t.assignments.create.groupSize}:</strong> {assignment.groupSize}
              </p>
            ) : null}
            {'peerReviewCount' in assignment && assignment.peerReviewCount > 0 ? (
              <p>
                <strong>{t.assignments.create.peerReview}:</strong> {assignment.peerReviewCount}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
