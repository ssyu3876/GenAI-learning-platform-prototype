'use client';

import { useEffect, useState, useTransition } from 'react';
import { ArrowRight, Check, Clock, Lock, Play, RotateCcw } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, cn } from '@/components/ui';
import { sprintEnter, sprintGoOn, sprintLeaveWeekSummary, sprintPick, resetScenario } from '../actions';

export interface SprintRunnerProps {
  view: 'select' | 'week' | 'summary' | 'ending';
  week: number;
  stats: Array<{ key: string; label: string; value: number; max: number; danger: number }>;
  weeks: Array<{
    index: number;
    title: string;
    tagline: string;
    done: number;
    total: number;
    complete: boolean;
    available: boolean;
  }>;
  step: {
    title: string;
    body: string;
    index: number;
    total: number;
    choices: Array<{ id: string; label: string; cost: string }>;
    seconds?: number;
    timeoutChoice: number;
  } | null;
  pending: { label: string; outcome: string; deltas: Array<{ label: string; value: number }>; timedOut: boolean } | null;
  summary: {
    delta: Array<{ label: string; from: number; to: number; change: number }>;
    advice: string;
  } | null;
  ending: { title: string; body: string; insight: string; takeaway: string; score: number; fatal: boolean } | null;
  history: Array<{ title: string; choiceLabel: string; outcome: string }>;
}

function StatBars({ stats }: { stats: SprintRunnerProps['stats'] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {stats.map((s) => {
        const percent = Math.max(0, Math.min(100, Math.round((s.value / s.max) * 100)));
        const low = s.value <= s.danger;
        return (
          <div key={s.key} className="rounded-blob border-2 border-line bg-paper px-3 py-2 shadow-sticker-sm">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{s.label}</span>
              <span className={cn('font-display text-lg font-bold', low && 'text-danger')}>{s.value}</span>
            </div>
            <ProgressBar value={percent} label={s.label} size="sm" tint={low ? 'coral' : 'mint'} />
          </div>
        );
      })}
    </div>
  );
}

function Countdown({ seconds, onTimeout }: { seconds: number; onTimeout: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          clearInterval(id);
          onTimeout();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);
  return (
    <Badge tint={left <= 5 ? 'coral' : 'butter'} className="gap-1.5">
      <Clock className="h-3.5 w-3.5" aria-hidden /> {left}s left
    </Badge>
  );
}

export function SprintRunner(props: SprintRunnerProps) {
  const { view, week, stats, weeks, step, pending, summary, ending, history } = props;
  const [isPending, startTransition] = useTransition();

  const act = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
    });

  // ---- ending ----
  if (view === 'ending' && ending) {
    const tone = ending.fatal ? 'coral' : ending.score >= 70 ? 'mint' : ending.score >= 40 ? 'butter' : 'coral';
    return (
      <div className="flex flex-col gap-4">
        <Card tint={tone}>
          <CardHeader
            title={ending.title}
            subtitle={ending.fatal ? 'The run ended early' : `${ending.score} / 100`}
            action={<Badge tint="paper">{ending.fatal ? 'Ended' : 'Result'}</Badge>}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{ending.body}</p>
            <div className="rounded-blob border-2 border-line bg-paper px-4 py-3">
              <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">What decided it</div>
              <p className="mt-1 text-sm">{ending.insight}</p>
            </div>
            <div className="rounded-blob border-2 border-dashed border-line/60 px-4 py-3">
              <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Keep this</div>
              <p className="mt-1 font-display font-semibold">{ending.takeaway}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => act(() => resetScenario({ key: 'sprint-zero' }))} disabled={isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Play again
              </Button>
              <Button variant="ghost" onClick={() => window.location.assign('/scenarios')}>
                Back to scenarios
              </Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Your decisions" subtitle={`${history.length} recorded`} />
          <CardBody>
            <ol className="flex flex-col gap-2">
              {history.map((h, i) => (
                <li key={`${h.title}-${i}`} className="rounded-blob border-2 border-line bg-paper px-3 py-2">
                  <div className="text-sm font-semibold">{h.choiceLabel}</div>
                  <p className="text-xs text-ink-soft">{h.outcome}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ---- week summary ----
  if (view === 'summary' && summary) {
    const worst = [...summary.delta].sort((a, b) => a.change - b.change)[0];
    return (
      <div className="flex flex-col gap-4">
        <Card tint="sky">
          <CardHeader
            title={`End of week ${week + 1}`}
            subtitle="What moved, and what to watch"
            action={<Badge tint="paper">Summary</Badge>}
          />
          <CardBody className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {summary.delta.map((d) => (
                <li
                  key={d.label}
                  className="flex items-center justify-between gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2"
                >
                  <span className="text-sm font-semibold">{d.label}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-ink-soft">
                      {d.from} → {d.to}
                    </span>
                    <Badge tint={d.change > 0 ? 'mint' : d.change < 0 ? 'coral' : 'paper'}>
                      {d.change > 0 ? `+${d.change}` : d.change === 0 ? '0' : d.change}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
            <div className="rounded-blob border-2 border-line bg-paper px-4 py-3">
              <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Advice</div>
              <p className="mt-1 text-sm">{summary.advice}</p>
              {worst && worst.change < 0 ? (
                <p className="mt-1 text-xs text-ink-soft">
                  The biggest drop this week was {worst.label.toLowerCase()}, down {Math.abs(worst.change)}.
                </p>
              ) : null}
            </div>
            <div>
              <Button variant="primary" onClick={() => act(() => sprintLeaveWeekSummary())} disabled={isPending}>
                Back to weeks <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
        <StatBars stats={stats} />
      </div>
    );
  }

  // ---- week picker ----
  if (view === 'select') {
    return (
      <div className="flex flex-col gap-4">
        <StatBars stats={stats} />
        <Card>
          <CardHeader title="Pick a week" subtitle="A week you finished can be replayed, and later weeks re-lock when you do." />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {weeks.map((w) => (
                <li
                  key={w.index}
                  className={cn(
                    'rounded-blob border-2 border-line px-4 py-3',
                    w.available ? 'bg-paper shadow-sticker-sm' : 'bg-cream opacity-70',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold">{w.title}</span>
                        {w.complete ? (
                          <Badge tint="mint">
                            <Check className="h-3 w-3" aria-hidden /> done
                          </Badge>
                        ) : w.available ? (
                          <Badge tint="butter">available</Badge>
                        ) : (
                          <Badge tint="paper">
                            <Lock className="h-3 w-3" aria-hidden /> locked
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-soft">{w.tagline}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {w.done} of {w.total} decisions
                      </p>
                    </div>
                    {w.available ? (
                      <Button
                        variant={w.complete ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isPending}
                        onClick={() => act(() => sprintEnter({ week: w.index }))}
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden />
                        {w.complete ? 'Replay' : w.done > 0 ? 'Continue' : 'Start'}
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-ink-soft">Finish week {w.index} first</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={Math.round((w.done / w.total) * 100)} label={`${w.title} progress`} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <p className="text-xs text-ink-soft">
          Replaying a week restores the numbers it started on and clears everything after it.
        </p>
      </div>
    );
  }

  // ---- a decision ----
  if (!step) {
    return (
      <Card>
        <CardBody>
          <p className="text-ink-soft">Nothing left this week.</p>
        </CardBody>
      </Card>
    );
  }

  if (pending) {
    return (
      <div className="flex flex-col gap-4">
        <StatBars stats={stats} />
        <Card tint={pending.deltas.some((d) => d.value < 0) ? 'coral' : 'mint'}>
          <CardHeader
            title="What happened"
            subtitle={pending.timedOut ? 'The timer ran out, so this was decided for you.' : `You chose: ${pending.label}`}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{pending.outcome}</p>
            <div className="flex flex-wrap gap-2">
              {pending.deltas.length === 0 ? (
                <Badge tint="paper">No change</Badge>
              ) : (
                pending.deltas.map((d) => (
                  <Badge key={d.label} tint={d.value > 0 ? 'mint' : 'coral'}>
                    {d.label} {d.value > 0 ? '+' : ''}
                    {d.value}
                  </Badge>
                ))
              )}
            </div>
            <div>
              <Button variant="primary" onClick={() => act(() => sprintGoOn())} disabled={isPending}>
                Next <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tint="sky">Week {week + 1}</Badge>
          <span className="text-sm font-semibold text-ink-soft">
            Decision {step.index + 1} of {step.total}
          </span>
        </div>
        {step.seconds ? (
          <Countdown
            seconds={step.seconds}
            onTimeout={() =>
              act(() => sprintPick({ choiceId: step.choices[step.timeoutChoice]?.id ?? step.choices[0]!.id, timedOut: true }))
            }
          />
        ) : null}
      </div>

      <ProgressBar value={Math.round(((step.index + 1) / step.total) * 100)} label="Week progress" size="sm" />
      <StatBars stats={stats} />

      <Card tint="butter">
        <CardHeader title={step.title} subtitle={`Decision ${step.index + 1}`} />
        <CardBody>
          <p className="text-[1.02rem] leading-relaxed">{step.body}</p>
        </CardBody>
      </Card>

      <ul className="flex flex-col gap-2">
        {step.choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => act(() => sprintPick({ choiceId: choice.id }))}
              disabled={isPending}
              className="flex w-full items-center justify-between gap-3 rounded-blob border-2 border-line bg-paper px-4 py-3 text-left shadow-sticker-sm transition-transform hover:-translate-y-0.5 hover:shadow-sticker disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="font-semibold">{choice.label}</span>
              <span className="shrink-0 rounded-pill border-2 border-line bg-cream px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                {choice.cost}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
