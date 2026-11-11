'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Lightbulb, Minus, RotateCcw, SkipForward } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { useLocale } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { answerInterview, skipInterviewQuestion, startInterviewRun } from '../actions';
import { analyseAnswer, type AnswerSignals } from '../content/interview-engine';
import type { InterviewReport } from '../content/interview-engine';
import { Radar } from './radar';

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
  const t = useT();
  const tint = score >= 4 ? 'mint' : score >= 3 ? 'butter' : 'coral';
  return <Badge tint={tint}>{fmt(t.scenarios.interview.scoreOutOf, { score: score.toFixed(1) })}</Badge>;
}

type SignalKey = 'example' | 'numbers' | 'tradeoff' | 'structure' | 'verification';

/** Live checklist: the same signals the server scores on, shown while you type. */
function AnswerChecklist({ text }: { text: string }) {
  const t = useT();
  const signals: AnswerSignals = analyseAnswer(text);
  const items: Array<{ key: SignalKey; label: string }> = [
    { key: 'example', label: t.scenarios.interview.signalExample },
    { key: 'numbers', label: t.scenarios.interview.signalNumbers },
    { key: 'tradeoff', label: t.scenarios.interview.signalTradeoff },
    { key: 'structure', label: t.scenarios.interview.signalStructure },
    { key: 'verification', label: t.scenarios.interview.signalVerification },
  ];
  const met = items.filter((s) => signals[s.key]).length;

  return (
    <div className="rounded-blob border-2 border-dashed border-line/60 bg-cream px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {t.scenarios.interview.listenFor}
        </span>
        <span className="text-xs font-semibold">
          {met} / {items.length}
        </span>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((s) => {
          const on = signals[s.key];
          return (
            <li
              key={s.key}
              className={cn(
                'flex items-center gap-1 rounded-pill border-2 px-2 py-0.5 text-xs font-semibold',
                on ? 'border-mint-deep bg-mint-soft' : 'border-line/30 bg-paper text-ink-soft',
              )}
            >
              {on ? (
                <Check className="h-3 w-3 text-mint-deep" aria-hidden />
              ) : (
                <Minus className="h-3 w-3 text-ink-soft" aria-hidden />
              )}
              {s.label}
            </li>
          );
        })}
      </ul>
      {met === items.length ? (
        <p className="mt-1.5 text-xs font-semibold text-mint-deep">{t.scenarios.interview.allSignals}</p>
      ) : null}
    </div>
  );
}

export function InterviewRunner(props: InterviewRunnerProps) {
  const { typeId, typeName, blurb, started, questionIndex, total, question, followUp, answers, report } = props;
  const t = useT();
  const locale = useLocale();
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const cjkCount = (answer.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = locale === 'zh' ? Math.round(cjkCount / 2) : answer.trim().split(/\s+/).filter(Boolean).length;

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
            title={fmt(t.scenarios.interview.overall, { score: report.overall.toFixed(1) })}
            subtitle={report.nextTime}
            action={<Badge tint="paper">{t.scenarios.interview.debrief}</Badge>}
          />
          <CardBody className="flex flex-col gap-4">
            <div>
              <h4 className="mb-2 font-display font-semibold">{t.scenarios.interview.strengths}</h4>
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
              <h4 className="mb-2 font-display font-semibold">{t.scenarios.interview.gaps}</h4>
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
            title={t.scenarios.interview.fiveDimensions}
            subtitle={t.scenarios.interview.dimensionsSubtitle}
          />
          <CardBody className="mx-auto w-full max-w-[360px]">
            <Radar
              axes={report.dimensions.map((d) => ({
                key: d.competency,
                label: d.competency,
                value: d.score,
                max: 5,
                danger: 2,
              }))}
              decimals={1}
              tone="lilac"
              label={t.scenarios.interview.competencyScores}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t.scenarios.interview.aiFluency}
            subtitle={
              report.aiDiscussed ? t.scenarios.interview.aiScored : t.scenarios.interview.aiNotScored
            }
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
              <p className="mt-3 text-sm text-ink-soft">{t.scenarios.interview.aiGapNote}</p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t.scenarios.interview.sevenDays}
            subtitle={t.scenarios.interview.sevenDaysSubtitle}
          />
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
            <RotateCcw className="h-4 w-4" aria-hidden /> {t.scenarios.interview.runAgain}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/scenarios')}>
            {t.scenarios.common.backToScenarios}
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
          <p className="text-sm text-ink-soft">{t.scenarios.interview.introBody}</p>
          <Button variant="primary" onClick={begin} disabled={isPending}>
            {t.scenarios.interview.startInterview} <ArrowRight className="h-4 w-4" aria-hidden />
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
          {fmt(t.scenarios.interview.questionOf, { current: questionIndex + 1, total })}
        </span>
        <Badge tint="lilac">{question.competency}</Badge>
      </div>
      <ProgressBar
        value={Math.round((questionIndex / total) * 100)}
        label={t.scenarios.interview.progressLabel}
        size="sm"
      />

      <Card tint="lilac">
        <CardHeader title={t.scenarios.interview.interviewer} subtitle={typeName} />
        <CardBody>
          <p className="text-[1.02rem] leading-relaxed">{question.prompt}</p>
        </CardBody>
      </Card>

      {followUp ? (
        <Card tint="butter">
          <CardHeader
            title={t.scenarios.interview.followingUp}
            subtitle={t.scenarios.interview.followingUpSubtitle}
          />
          <CardBody>
            <p className="text-sm">{followUp}</p>
          </CardBody>
        </Card>
      ) : null}

      {revealed.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {revealed.map((hint, i) => (
            <li key={hint} className="rounded-blob border-2 border-line bg-butter-soft px-3 py-2 text-sm">
              <span className="mr-2 text-xs font-bold tracking-wide text-ink-soft uppercase">
                {fmt(t.scenarios.interview.hint, { number: i + 1 })}
              </span>
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <label htmlFor="interview-answer" className="mb-1 block text-sm font-semibold">
          {t.scenarios.interview.yourAnswer}
        </label>
        <textarea
          id="interview-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder={t.scenarios.interview.answerPlaceholder}
          className="w-full rounded-blob border-2 border-line bg-paper px-4 py-3 text-[0.95rem] shadow-sticker-sm"
        />
        <div className="mt-1 flex justify-between text-xs font-semibold text-ink-soft">
          <span className={cn(words >= 40 && 'text-mint-deep')}>
            {fmt(t.scenarios.interview.wordCount, { count: words })}
          </span>
          <span>{t.scenarios.interview.answerHint}</span>
        </div>
      </div>

      <AnswerChecklist text={answer} />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={submit} disabled={isPending || words < 5}>
          {isPending ? t.scenarios.interview.sending : t.scenarios.interview.answer}{' '}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="secondary"
          onClick={() => setHintsUsed((n) => Math.min(3, n + 1))}
          disabled={hintsUsed >= 3}
        >
          <Lightbulb className="h-4 w-4" aria-hidden />{' '}
          {hintsUsed === 0 ? t.scenarios.interview.stuck : t.scenarios.interview.anotherHint}
        </Button>
        <Button variant="ghost" onClick={skip} disabled={isPending}>
          <SkipForward className="h-4 w-4" aria-hidden /> {t.scenarios.interview.skip}
        </Button>
      </div>

      {answers.length > 0 ? (
        <Card>
          <CardHeader
            title={t.scenarios.interview.answeredSoFar}
            subtitle={fmt(t.scenarios.interview.answeredCount, { done: answers.length, total })}
          />
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
