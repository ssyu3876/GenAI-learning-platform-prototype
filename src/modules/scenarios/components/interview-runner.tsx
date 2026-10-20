'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lightbulb, RotateCcw, SkipForward } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, cn } from '@/components/ui';
import { answerInterview, skipInterviewQuestion, startInterviewRun } from '../actions';
import type { InterviewReport } from '../content/interview-engine';

export interface InterviewRunnerProps {
  typeId: string;
  typeName: string;
  blurb: string;
  started: boolean;
  questionIndex: number;
  total: number;
  question: { prompt: string; competency: string; hints: string[] } | null;
  followUp: string | null;
  answers: Array<{ prompt: string; answer: string; score: number; hintsUsed: number }>;
  report: InterviewReport | null;
}

function ScorePill({ score }: { score: number }) {
  const tint = score >= 4 ? 'mint' : score >= 3 ? 'butter' : 'coral';
  return <Badge tint={tint}>{score.toFixed(1)} / 5</Badge>;
}

export function InterviewRunner(props: InterviewRunnerProps) {
  const { typeId, typeName, blurb, started, questionIndex, total, question, followUp, answers, report } = props;
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  const begin = () =>
    startTransition(async () => {
      await startInterviewRun({ typeId });
    });

  const submit = () => {
    if (words < 5) return;
    startTransition(async () => {
      await answerInterview({ typeId, answer, hintsUsed });
      setAnswer('');
      setHintsUsed(0);
    });
  };

  const skip = () =>
    startTransition(async () => {
      await skipInterviewQuestion({ typeId });
      setAnswer('');
      setHintsUsed(0);
    });

  // ---- report ----
  if (report) {
    const tone = report.overall >= 3.5 ? 'mint' : report.overall >= 2.5 ? 'butter' : 'coral';
    return (
      <div className="flex flex-col gap-4">
        <Card tint={tone}>
          <CardHeader
            title={`Overall ${report.overall.toFixed(1)} / 5`}
            subtitle={report.nextTime}
            action={<Badge tint="paper">Debrief</Badge>}
          />
          <CardBody className="flex flex-col gap-4">
            <div>
              <h4 className="mb-2 font-display font-semibold">What you did well</h4>
              <ul className="flex flex-col gap-2">
                {report.strengths.map((s) => (
                  <li key={s.competency} className="rounded-blob border-2 border-line bg-paper px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold">{s.competency}</span>
                      <ScorePill score={s.score} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{s.strength}</p>
                    <blockquote className="mt-1 border-l-4 border-mint pl-3 text-sm italic text-ink-soft">
                      {s.evidence}
                    </blockquote>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-display font-semibold">Fix these first</h4>
              <ol className="flex flex-col gap-2">
                {report.gaps.map((g, i) => (
                  <li key={g.competency} className="rounded-blob border-2 border-line bg-paper px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold">
                        {i + 1}. {g.competency}
                      </span>
                      <ScorePill score={g.score} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{g.gap}</p>
                    <blockquote className="mt-1 border-l-4 border-coral pl-3 text-sm italic text-ink-soft">
                      {g.evidence}
                    </blockquote>
                  </li>
                ))}
              </ol>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="AI fluency"
            subtitle={report.aiDiscussed ? 'Scored from what you actually said' : 'AI never came up, so this could not be scored'}
          />
          <CardBody>
            <ul className="grid gap-2 sm:grid-cols-2">
              {report.fluency.map((f) => (
                <li key={f.key} className="rounded-blob border-2 border-line bg-paper px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{f.label}</span>
                    <span className="font-display font-bold">{f.score > 0 ? `${f.score}/5` : '—'}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{f.comment}</p>
                </li>
              ))}
            </ul>
            {!report.aiDiscussed ? (
              <p className="mt-3 text-sm text-ink-soft">
                In a real engineering conversation, never mentioning how you work with AI is itself a gap.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Seven days" subtitle="Small, specific, doable" />
          <CardBody>
            <ol className="flex flex-col gap-2">
              {report.plan.map((p) => (
                <li key={p.day} className="flex gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2">
                  <span className="w-14 shrink-0 text-xs font-bold tracking-wide text-ink-soft uppercase">{p.day}</span>
                  <span className="text-sm">{p.task}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={begin} disabled={isPending}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Run it again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/scenarios')}>
            Back to scenarios
          </Button>
        </div>
      </div>
    );
  }

  // ---- not started ----
  if (!started || !question) {
    return (
      <Card>
        <CardHeader title={typeName} subtitle={blurb} />
        <CardBody className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">
            Five questions. Answer in your own words; there is no model marking you on style. You can ask for a
            hint at any point, and using one lowers the score slightly, because the point is to answer unaided.
          </p>
          <Button variant="primary" onClick={begin} disabled={isPending}>
            Start the interview <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </CardBody>
      </Card>
    );
  }

  // ---- in progress ----
  const revealed = question.hints.slice(0, hintsUsed);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-soft">
          Question {questionIndex + 1} of {total}
        </span>
        <Badge tint="lilac">{question.competency}</Badge>
      </div>
      <ProgressBar value={Math.round((questionIndex / total) * 100)} label="Interview progress" size="sm" />

      <Card tint="lilac">
        <CardHeader title="Interviewer" subtitle={typeName} />
        <CardBody>
          <p className="text-[1.02rem] leading-relaxed">{question.prompt}</p>
        </CardBody>
      </Card>

      {followUp ? (
        <Card tint="butter">
          <CardHeader title="Following up" subtitle="The answer was missing something specific" />
          <CardBody>
            <p className="text-sm">{followUp}</p>
          </CardBody>
        </Card>
      ) : null}

      {revealed.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {revealed.map((hint, i) => (
            <li key={hint} className="rounded-blob border-2 border-line bg-butter-soft px-3 py-2 text-sm">
              <span className="mr-2 text-xs font-bold tracking-wide text-ink-soft uppercase">Hint {i + 1}</span>
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <label htmlFor="interview-answer" className="mb-1 block text-sm font-semibold">
          Your answer
        </label>
        <textarea
          id="interview-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder="Type it as you would say it. Specifics beat polish."
          className="w-full rounded-blob border-2 border-line bg-paper px-4 py-3 text-[0.95rem] shadow-sticker-sm"
        />
        <div className="mt-1 flex justify-between text-xs font-semibold text-ink-soft">
          <span className={cn(words >= 40 && 'text-mint-deep')}>{words} words</span>
          <span>Aim for 40 or more, with one concrete example.</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={submit} disabled={isPending || words < 5}>
          {isPending ? 'Sending...' : 'Answer'} <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="secondary"
          onClick={() => setHintsUsed((n) => Math.min(3, n + 1))}
          disabled={hintsUsed >= 3}
        >
          <Lightbulb className="h-4 w-4" aria-hidden /> {hintsUsed === 0 ? 'I am stuck' : 'Another hint'}
        </Button>
        <Button variant="ghost" onClick={skip} disabled={isPending}>
          <SkipForward className="h-4 w-4" aria-hidden /> Skip
        </Button>
      </div>

      {answers.length > 0 ? (
        <Card>
          <CardHeader title="Answered so far" subtitle={`${answers.length} of ${total}`} />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {answers.map((a, i) => (
                <li key={`${a.prompt}-${i}`} className="flex items-start justify-between gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2">
                  <span className="min-w-0 text-sm text-ink-soft">{a.prompt}</span>
                  <ScorePill score={a.score} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
