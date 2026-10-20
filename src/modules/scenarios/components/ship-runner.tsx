'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, FlaskConical, RotateCcw, ShieldCheck, Wrench, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, cn } from '@/components/ui';
import { resetScenario, shipAdvance, shipChoose, shipDecideAfterRepair, shipRepair } from '../actions';

export interface ShipRunnerProps {
  turnIndex: number;
  total: number;
  quality: number;
  minutes: number;
  budget: number;
  phase: 'decide' | 'repair' | 'verdict' | 'result' | 'done';
  evidenceShown: boolean;
  turn: {
    title: string;
    claim: string;
    diff: string[];
    evidence: string;
    minutes: { approve: number; reject: number; repair: number; evidence: number };
    canRepair: boolean;
  } | null;
  repair: {
    prompt: string;
    stepIndex: number;
    stepTotal: number;
    options: Array<{ id: string; label: string }>;
  } | null;
  pending: { delta: number; note: string } | null;
  ending: { title: string; body: string; insight: string; takeaway: string; score: number } | null;
  history: Array<{ title: string; action: string; note: string; delta: number }>;
}

function Meters({ quality, minutes, budget }: { quality: number; minutes: number; budget: number }) {
  const timePercent = Math.round((minutes / budget) * 100);
  const lowQuality = quality <= 50;
  const lowTime = minutes <= 6;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Project quality</span>
          <span className={cn('font-display text-2xl font-bold', lowQuality && 'text-danger')}>{quality}</span>
        </div>
        <ProgressBar value={quality} label="Project quality" tint={lowQuality ? 'coral' : 'mint'} size="sm" />
        <p className="mt-1 text-[0.7rem] text-ink-soft">Never goes back up. Every wrong call takes some.</p>
      </div>
      <div className="rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Review time</span>
          <span className={cn('font-display text-2xl font-bold', lowTime && 'text-danger')}>{minutes}</span>
        </div>
        <ProgressBar value={timePercent} label="Review time left" tint={lowTime ? 'coral' : 'sky'} size="sm" />
        <p className="mt-1 text-[0.7rem] text-ink-soft">Unspent minutes count as 35% of the final score.</p>
      </div>
    </div>
  );
}

function Verb({
  icon,
  label,
  minutes,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number;
  onClick: () => void;
  disabled: boolean;
  tone?: 'repair' | 'evidence';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between gap-3 rounded-blob border-2 border-line px-4 py-3 text-left',
        'shadow-sticker-sm transition-transform hover:-translate-y-0.5 hover:shadow-sticker',
        'disabled:pointer-events-none disabled:opacity-60',
        tone === 'repair' ? 'bg-sky-soft' : tone === 'evidence' ? 'bg-lilac-soft' : 'bg-paper',
      )}
    >
      <span className="flex items-center gap-2 font-semibold">
        {icon}
        {label}
      </span>
      <span className="shrink-0 rounded-pill border-2 border-line bg-cream px-2 py-0.5 text-xs font-semibold">
        {minutes} min
      </span>
    </button>
  );
}

export function ShipRunner(props: ShipRunnerProps) {
  const {
    turnIndex,
    total,
    quality,
    minutes,
    budget,
    phase,
    evidenceShown,
    turn,
    repair,
    pending,
    ending,
    history,
  } = props;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
    });

  if (ending) {
    const tone = ending.score >= 85 ? 'mint' : ending.score >= 60 ? 'butter' : 'coral';
    return (
      <div className="flex flex-col gap-4">
        <Card tint={tone}>
          <CardHeader
            title={ending.title}
            subtitle={`${ending.score} / 100 · quality ${quality} · ${minutes} min left`}
            action={<Badge tint="paper">Result</Badge>}
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
              <Button
                variant="primary"
                onClick={() => run(() => resetScenario({ key: 'ship-it' }))}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Play again
              </Button>
              <Button variant="ghost" onClick={() => router.push('/scenarios')}>
                Back to scenarios
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Every turn" subtitle={`${history.length} responses`} />
          <CardBody>
            <ol className="flex flex-col gap-2">
              {history.map((h, i) => (
                <li
                  key={`${h.title}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-blob border-2 border-line bg-paper px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{h.title}</div>
                    <div className="text-xs text-ink-soft">{h.note}</div>
                  </div>
                  <Badge
                    tint={h.delta < 0 ? 'coral' : h.action === 'evidence' ? 'lilac' : 'mint'}
                    className="shrink-0"
                  >
                    {h.action === 'evidence' ? 'read' : h.delta < 0 ? h.delta : 'ok'}
                  </Badge>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!turn) {
    return (
      <Card>
        <CardBody>
          <p className="text-ink-soft">Nothing left to review.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tint="coral">
          Turn {turnIndex + 1} of {total}
        </Badge>
        <span className="text-sm font-semibold text-ink-soft">
          {phase === 'repair'
            ? 'Repairing the output'
            : phase === 'verdict'
              ? 'Now decide'
              : evidenceShown
                ? 'You have seen the tests'
                : 'Read the change'}
        </span>
      </div>
      <ProgressBar
        value={Math.round(((turnIndex + (phase === 'result' ? 1 : 0)) / total) * 100)}
        label="Review progress"
        size="sm"
      />

      <Meters quality={quality} minutes={minutes} budget={budget} />

      <Card tint="butter">
        <CardHeader title={turn.title} subtitle="The agent says" />
        <CardBody className="flex flex-col gap-3">
          <p className="font-display text-lg leading-snug font-semibold">“{turn.claim}”</p>
          <pre className="overflow-x-auto rounded-blob border-2 border-line bg-ink px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-cream">
            {turn.diff.join('\n')}
          </pre>
        </CardBody>
      </Card>

      {evidenceShown ? (
        <Card tint="lilac">
          <CardHeader title="What the tests say" subtitle="Paid for with review time" />
          <CardBody>
            <pre className="overflow-x-auto rounded-blob border-2 border-line bg-ink px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-cream">
              {turn.evidence}
            </pre>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'result' && pending ? (
        <Card tint={pending.delta < 0 ? 'coral' : 'mint'}>
          <CardHeader
            title={pending.delta < 0 ? 'That cost quality' : 'That held'}
            subtitle={`${pending.delta < 0 ? pending.delta : '0'} quality`}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{pending.note}</p>
            <div>
              <Button variant="primary" onClick={() => run(() => shipAdvance())} disabled={isPending}>
                Next turn <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'repair' && repair ? (
        <Card tint="sky">
          <CardHeader
            title="Make the output good enough first"
            subtitle={`Step ${repair.stepIndex + 1} of ${repair.stepTotal} · ${repair.prompt}`}
          />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {repair.options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => shipRepair({ optionId: o.id }))}
                    className="flex w-full items-center gap-3 rounded-blob border-2 border-line bg-paper px-4 py-3 text-left shadow-sticker-sm transition-transform hover:-translate-y-0.5 hover:shadow-sticker disabled:opacity-60"
                  >
                    <Wrench className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
                    <span className="text-sm font-semibold">{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-soft">
              A wrong choice still moves you on, and still costs quality. There is no retry.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'verdict' ? (
        <Card tint="mint">
          <CardHeader title="The change is sound now" subtitle="Ship it, or throw the work away" />
          <CardBody className="flex flex-wrap gap-2">
            <Button
              variant="mint"
              onClick={() => run(() => shipDecideAfterRepair({ action: 'approve' }))}
              disabled={isPending}
            >
              <Check className="h-4 w-4" aria-hidden /> Approve
            </Button>
            <Button
              variant="secondary"
              onClick={() => run(() => shipDecideAfterRepair({ action: 'reject' }))}
              disabled={isPending}
            >
              <X className="h-4 w-4" aria-hidden /> Reject
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'decide' ? (
        <div className="flex flex-col gap-2">
          {!evidenceShown ? (
            <Verb
              icon={<FlaskConical className="h-4 w-4 text-lilac" aria-hidden />}
              label="Read the tests and the log"
              minutes={turn.minutes.evidence}
              onClick={() => run(() => shipChoose({ action: 'evidence' }))}
              disabled={isPending}
              tone="evidence"
            />
          ) : null}
          <Verb
            icon={<Check className="h-4 w-4 text-mint-deep" aria-hidden />}
            label="Approve the change"
            minutes={turn.minutes.approve}
            onClick={() => run(() => shipChoose({ action: 'approve' }))}
            disabled={isPending}
          />
          <Verb
            icon={<X className="h-4 w-4 text-coral-deep" aria-hidden />}
            label="Reject and send it back"
            minutes={turn.minutes.reject}
            onClick={() => run(() => shipChoose({ action: 'reject' }))}
            disabled={isPending}
          />
          {turn.canRepair ? (
            <Verb
              icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              label="Repair it, then decide"
              minutes={turn.minutes.repair}
              onClick={() => run(() => shipChoose({ action: 'repair' }))}
              disabled={isPending}
              tone="repair"
            />
          ) : null}
          <p className="mt-1 text-xs text-ink-soft">
            Reading the tests costs time and no quality. Guessing costs quality and no time.
          </p>
        </div>
      ) : null}
    </div>
  );
}
