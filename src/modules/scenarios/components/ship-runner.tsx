'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, FlaskConical, RotateCcw, ShieldCheck, Wrench, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
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
  const t = useT();
  const timePercent = Math.round((minutes / budget) * 100);
  const lowQuality = quality <= 50;
  const lowTime = minutes <= 6;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{t.scenarios.ship.quality}</span>
          <span className={cn('font-display text-2xl font-bold', lowQuality && 'text-danger')}>{quality}</span>
        </div>
        <ProgressBar
          value={quality}
          label={t.scenarios.ship.quality}
          tint={lowQuality ? 'coral' : 'mint'}
          size="sm"
        />
        <p className="mt-1 text-[0.7rem] text-ink-soft">{t.scenarios.ship.qualityHint}</p>
      </div>
      <div className="rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{t.scenarios.ship.reviewTime}</span>
          <span className={cn('font-display text-2xl font-bold', lowTime && 'text-danger')}>{minutes}</span>
        </div>
        <ProgressBar
          value={timePercent}
          label={t.scenarios.ship.reviewTimeLeft}
          tint={lowTime ? 'coral' : 'sky'}
          size="sm"
        />
        <p className="mt-1 text-[0.7rem] text-ink-soft">{t.scenarios.ship.reviewTimeHint}</p>
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
  const t = useT();
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
        {fmt(t.scenarios.ship.minutes, { minutes })}
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
  const t = useT();
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
            subtitle={fmt(t.scenarios.ship.endingSubtitle, {
              score: ending.score,
              quality,
              minutes,
            })}
            action={<Badge tint="paper">{t.scenarios.common.result}</Badge>}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{ending.body}</p>
            <div className="rounded-blob border-2 border-line bg-paper px-4 py-3">
              <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {t.scenarios.common.whatDecided}
              </div>
              <p className="mt-1 text-sm">{ending.insight}</p>
            </div>
            <div className="rounded-blob border-2 border-dashed border-line/60 px-4 py-3">
              <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {t.scenarios.common.keepThis}
              </div>
              <p className="mt-1 font-display font-semibold">{ending.takeaway}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => run(() => resetScenario({ key: 'ship-it' }))}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> {t.scenarios.common.playAgain}
              </Button>
              <Button variant="ghost" onClick={() => router.push('/scenarios')}>
                {t.scenarios.common.backToScenarios}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t.scenarios.ship.everyTurn}
            subtitle={fmt(t.scenarios.ship.responses, { count: history.length })}
          />
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
                    {h.action === 'evidence' ? t.scenarios.ship.read : h.delta < 0 ? h.delta : t.scenarios.ship.ok}
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
          <p className="text-ink-soft">{t.scenarios.ship.nothingLeft}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tint="coral">{fmt(t.scenarios.ship.turnOf, { current: turnIndex + 1, total })}</Badge>
        <span className="text-sm font-semibold text-ink-soft">
          {phase === 'repair'
            ? t.scenarios.ship.repairing
            : phase === 'verdict'
              ? t.scenarios.ship.nowDecide
              : evidenceShown
                ? t.scenarios.ship.seenTests
                : t.scenarios.ship.readChange}
        </span>
      </div>
      <ProgressBar
        value={Math.round(((turnIndex + (phase === 'result' ? 1 : 0)) / total) * 100)}
        label={t.scenarios.ship.reviewProgress}
        size="sm"
      />

      <Meters quality={quality} minutes={minutes} budget={budget} />

      <Card tint="butter">
        <CardHeader title={turn.title} subtitle={t.scenarios.ship.agentSays} />
        <CardBody className="flex flex-col gap-3">
          <p className="font-display text-lg leading-snug font-semibold">“{turn.claim}”</p>
          <pre className="overflow-x-auto rounded-blob border-2 border-line bg-ink px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-cream">
            {turn.diff.join('\n')}
          </pre>
        </CardBody>
      </Card>

      {evidenceShown ? (
        <Card tint="lilac">
          <CardHeader title={t.scenarios.ship.testsSay} subtitle={t.scenarios.ship.testsPaid} />
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
            title={pending.delta < 0 ? t.scenarios.ship.costQuality : t.scenarios.ship.held}
            subtitle={fmt(t.scenarios.ship.qualityDelta, { delta: pending.delta < 0 ? pending.delta : '0' })}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{pending.note}</p>
            <div>
              <Button variant="primary" onClick={() => run(() => shipAdvance())} disabled={isPending}>
                {t.scenarios.ship.nextTurn} <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'repair' && repair ? (
        <Card tint="sky">
          <CardHeader
            title={t.scenarios.ship.repairTitle}
            subtitle={fmt(t.scenarios.ship.repairStep, {
              current: repair.stepIndex + 1,
              total: repair.stepTotal,
              prompt: repair.prompt,
            })}
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
            <p className="mt-2 text-xs text-ink-soft">{t.scenarios.ship.repairHint}</p>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'verdict' ? (
        <Card tint="mint">
          <CardHeader title={t.scenarios.ship.verdictTitle} subtitle={t.scenarios.ship.verdictSubtitle} />
          <CardBody className="flex flex-wrap gap-2">
            <Button
              variant="mint"
              onClick={() => run(() => shipDecideAfterRepair({ action: 'approve' }))}
              disabled={isPending}
            >
              <Check className="h-4 w-4" aria-hidden /> {t.scenarios.ship.approve}
            </Button>
            <Button
              variant="secondary"
              onClick={() => run(() => shipDecideAfterRepair({ action: 'reject' }))}
              disabled={isPending}
            >
              <X className="h-4 w-4" aria-hidden /> {t.scenarios.ship.reject}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {phase === 'decide' ? (
        <div className="flex flex-col gap-2">
          {!evidenceShown ? (
            <Verb
              icon={<FlaskConical className="h-4 w-4 text-lilac" aria-hidden />}
              label={t.scenarios.ship.readTests}
              minutes={turn.minutes.evidence}
              onClick={() => run(() => shipChoose({ action: 'evidence' }))}
              disabled={isPending}
              tone="evidence"
            />
          ) : null}
          <Verb
            icon={<Check className="h-4 w-4 text-mint-deep" aria-hidden />}
            label={t.scenarios.ship.approveChange}
            minutes={turn.minutes.approve}
            onClick={() => run(() => shipChoose({ action: 'approve' }))}
            disabled={isPending}
          />
          <Verb
            icon={<X className="h-4 w-4 text-coral-deep" aria-hidden />}
            label={t.scenarios.ship.rejectChange}
            minutes={turn.minutes.reject}
            onClick={() => run(() => shipChoose({ action: 'reject' }))}
            disabled={isPending}
          />
          {turn.canRepair ? (
            <Verb
              icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              label={t.scenarios.ship.repairThenDecide}
              minutes={turn.minutes.repair}
              onClick={() => run(() => shipChoose({ action: 'repair' }))}
              disabled={isPending}
              tone="repair"
            />
          ) : null}
          <p className="mt-1 text-xs text-ink-soft">{t.scenarios.ship.decideHint}</p>
        </div>
      ) : null}
    </div>
  );
}
