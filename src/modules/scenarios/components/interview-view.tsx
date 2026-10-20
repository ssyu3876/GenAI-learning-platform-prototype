import Link from 'next/link';
import type { SessionUser } from '@/core/types';
import { Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { getRun } from '../queries';
import { INTERVIEW_TYPES, interviewType } from '../content/interview';
import { buildInterviewReport, pickQuestions } from '../content/interview-engine';
import { InterviewRunner } from './interview-runner';

export async function InterviewView({
  user,
  typeId,
}: {
  user: SessionUser;
  typeId: string | undefined;
}) {
  const type = typeId ? interviewType(typeId) : undefined;

  if (!type) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Scenarios" title="Practice interviews" subtitle="Pick a format. Each one takes about ten minutes." />
        <div className="grid gap-3 sm:grid-cols-2">
          {INTERVIEW_TYPES.map((t) => (
            <Card key={t.id} interactive>
              <CardHeader
                title={t.name}
                subtitle={t.blurb}
                action={<Badge tint="lilac">{t.questions.length} questions</Badge>}
              />
              <CardBody>
                <p className="mb-3 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                  {t.competencies.join(' / ')}
                </p>
                <Link
                  href={`/scenarios/interview?type=${t.id}`}
                  className="inline-flex h-9 items-center rounded-pill border-2 border-line bg-paper px-4 text-sm font-semibold shadow-sticker-sm"
                >
                  Open
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const key = `interview:${type.id}`;
  const run = await getRun(user.id, key);
  const questions = pickQuestions(type);
  // Narrow the union: only an interview run has .interview.
  const state = run && run.state.kind === 'interview' ? run.state.interview : undefined;
  const started = Boolean(state);
  const index = state?.questionIndex ?? 0;
  const finished = started && index >= questions.length;
  const question = !finished ? questions[index] : undefined;

  const report = finished && state ? buildInterviewReport(type, state.answers) : null;

  // Shown until the learner answers again; each answer replaces it.
  const pendingFollowUp = state?.followUp ? state.followUp.label : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Practice interview"
        title={type.name}
        subtitle={type.blurb}
        action={<Badge tint="lilac">{questions.length} questions</Badge>}
      />

      <InterviewRunner
        typeId={type.id}
        typeName={type.name}
        blurb={type.blurb}
        started={started}
        questionIndex={index}
        total={questions.length}
        question={
          question
            ? { prompt: question.prompt, competency: question.competency, hints: [...question.hints] }
            : null
        }
        followUp={pendingFollowUp}
        answers={
          state
            ? state.answers.map((a) => ({
                prompt: a.prompt,
                answer: a.answer,
                score: a.score,
                hintsUsed: a.hintsUsed,
              }))
            : []
        }
        report={report}
      />

      {finished ? (
        <p className="text-sm text-ink-soft">
          <Link href="/scenarios/interview" className="underline underline-offset-4">
            Try a different interview format
          </Link>
          , or read the recommended courses on your badges page.
        </p>
      ) : null}
    </div>
  );
}
