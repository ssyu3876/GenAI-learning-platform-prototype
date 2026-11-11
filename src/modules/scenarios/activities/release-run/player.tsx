'use client';

// Release Week, the small version: six decisions, four meters, one screen. Built as an
// activity so it lives inside a course lesson and earns XP like any other activity.
// The look is a dark control panel with live meters, which is deliberately different from
// the paper cards used by the long scenarios.
import { useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Heart, RotateCcw, ShieldCheck, Users, X } from 'lucide-react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Badge, Button, Card, CardBody, CardHeader, cn, Pip } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import type { ReleaseRunConfig } from './schema';
import { clampStat, releaseRunEndingKey, releaseRunScore, type ReleaseStats, type ReleaseStatKey } from './score';

type Phase = 'intro' | 'play' | 'feedback' | 'week' | 'done';
type Stats = ReleaseStats;

const ORDER: ReleaseStatKey[] = ['budget', 'morale', 'users', 'quality'];
const ICONS = { budget: Clock, morale: Heart, users: Users, quality: ShieldCheck } as const;

function clamp(value: number): number {
  return clampStat(value);
}

function Meters({ config, stats }: { config: ReleaseRunConfig; stats: Stats }) {
  return (
    <div className="rounded-blob border-2 border-line bg-ink px-4 py-3 text-cream">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {config.stats.map((stat) => {
          const Icon = ICONS[stat.key];
          const value = stats[stat.key];
          const low = value <= stat.danger;
          const percent = Math.round((value / stat.max) * 100);
          return (
            <div key={stat.key}>
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[0.68rem] font-semibold tracking-wide uppercase opacity-75">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {stat.label}
                </span>
                <span
                  className={cn(
                    'font-display text-lg leading-none font-bold transition-colors',
                    low ? 'text-coral' : 'text-cream',
                  )}
                >
                  {value}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-pill bg-cream/15">
                <div
                  className={cn(
                    'h-full rounded-pill transition-[width] duration-500',
                    low ? 'bg-coral' : 'bg-mint',
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReleaseRunPlayer({
  activity,
  config,
  onComplete,
  previousBest,
}: ActivityPlayerProps<ReleaseRunConfig>) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [stats, setStats] = useState<Stats>({ ...config.start });
  const [last, setLast] = useState<{
    outcome: string;
    deltas: Array<{ key: ReleaseStatKey; label: string; value: number }>;
  } | null>(null);
  const [score, setScore] = useState(0);
  const submitted = useRef(false);

  const roundDef = config.rounds[round]!;
  const stepDef = roundDef.steps[step]!;

  const labelFor = (key: ReleaseStatKey) => config.stats.find((s) => s.key === key)?.label ?? key;

  function choose(choiceId: string) {
    const choice = stepDef.choices.find((c) => c.id === choiceId) ?? stepDef.choices[0]!;
    const next: Stats = { ...stats };
    const deltas: Array<{ key: ReleaseStatKey; label: string; value: number }> = [];

    for (const key of ORDER) {
      const delta = choice.effects[key] ?? 0;
      if (delta === 0) continue;
      next[key] = clamp(next[key] + delta);
      deltas.push({ key, label: labelFor(key), value: delta });
    }

    setStats(next);
    setLast({ outcome: choice.outcome, deltas });
    setPhase('feedback');
  }

  function finish(nextStats: Stats) {
    const finalScore = releaseRunScore(nextStats);
    setScore(finalScore);
    setPhase('done');
    if (!submitted.current) {
      submitted.current = true;
      void onComplete({ score: finalScore, detail: { stats: nextStats } });
    }
  }

  function advance() {
    setLast(null);
    if (step < roundDef.steps.length - 1) {
      setStep(step + 1);
      setPhase('play');
      return;
    }
    if (round < config.rounds.length - 1) {
      setPhase('week');
      return;
    }
    finish(stats);
  }

  function nextRound() {
    setRound(round + 1);
    setStep(0);
    setPhase('play');
  }

  function restart() {
    submitted.current = false;
    setStats({ ...config.start });
    setRound(0);
    setStep(0);
    setScore(0);
    setLast(null);
    setPhase('play');
  }

  if (phase === 'intro') {
    return (
      <Card>
        <CardHeader
          title={activity.title}
          action={<Badge tint="butter">{fmt(t.activities.frame.xp, { xp: activity.xpReward })}</Badge>}
        />
        <CardBody className="flex flex-col gap-4">
          <p>{config.intro}</p>
          <Meters config={config} stats={stats} />
          <div>
            <Button variant="primary" onClick={() => setPhase('play')}>
              {t.scenarios.common.start} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (phase === 'done') {
    const ending =
      config.endings[releaseRunEndingKey(score)];
    const tone = score >= 75 ? 'mint' : score >= 45 ? 'butter' : 'coral';

    return (
      <Card tint={tone}>
        <CardHeader
          title={ending.title}
          subtitle={`${score} / 100`}
          action={<Badge tint="paper">{t.scenarios.common.result}</Badge>}
        />
        <CardBody className="flex flex-col gap-4">
          <p>{ending.body}</p>
          <div className="rounded-blob border-2 border-dashed border-line/60 bg-paper px-4 py-3">
            <div className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
              {t.scenarios.common.keepThis}
            </div>
            <p className="mt-1 font-display font-semibold">{ending.takeaway}</p>
          </div>
          <Meters config={config} stats={stats} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={restart}>
              <RotateCcw className="h-4 w-4" aria-hidden /> {t.scenarios.common.playAgain}
            </Button>
            {previousBest !== null && previousBest !== undefined ? (
              <span className="text-sm font-semibold text-ink-soft">
                {t.activities.frame.best}: {previousBest}
              </span>
            ) : null}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (phase === 'week') {
    return (
      <div className="flex flex-col gap-3">
        <Card tint="sky">
          <CardHeader
            title={roundDef.title}
            subtitle={roundDef.tagline}
            action={<Badge tint="paper">{fmt(t.scenarios.sprint.week, { week: round + 1 })}</Badge>}
          />
          <CardBody className="flex flex-col gap-4">
            <Meters config={config} stats={stats} />
            <div>
              <Button variant="primary" onClick={nextRound}>
                {t.scenarios.common.next} <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (phase === 'feedback' && last) {
    const bad = last.deltas.some((d) => d.value < 0);
    return (
      <div className="flex flex-col gap-3">
        <Meters config={config} stats={stats} />
        <Card tint={bad ? 'coral' : 'mint'}>
          <CardHeader
            title={bad ? t.scenarios.ship.costQuality : t.scenarios.ship.held}
            subtitle={roundDef.title}
            action={<Pip mood={bad ? 'think' : 'cheer'} stage={2} size={44} />}
          />
          <CardBody className="flex flex-col gap-3">
            <p>{last.outcome}</p>
            <div className="flex flex-wrap gap-2">
              {last.deltas.length === 0 ? (
                <Badge tint="paper">{t.scenarios.sprint.noChange}</Badge>
              ) : (
                last.deltas.map((delta) => (
                  <Badge key={delta.key} tint={delta.value > 0 ? 'mint' : 'coral'}>
                    {delta.value > 0 ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
                    {delta.label} {delta.value > 0 ? `+${delta.value}` : delta.value}
                  </Badge>
                ))
              )}
            </div>
            <div>
              <Button variant="primary" onClick={advance}>
                {t.scenarios.common.next} <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Meters config={config} stats={stats} />
      <div className="flex items-center gap-2" aria-hidden>
        {config.rounds.map((r, i) => (
          <div key={r.title} className="flex-1">
            <div
              className={cn(
                'h-2 rounded-pill border-2 border-line',
                i < round ? 'bg-mint' : i === round ? 'bg-coral' : 'bg-paper',
              )}
            />
          </div>
        ))}
      </div>
      <Card tint="butter">
        <CardHeader
          title={stepDef.title}
          subtitle={`${roundDef.title} · ${step + 1} / ${roundDef.steps.length}`}
          action={<Badge tint="paper">{`${step + 1} / ${roundDef.steps.length}`}</Badge>}
        />
        <CardBody className="flex flex-col gap-3">
          <p>{stepDef.body}</p>
          <div className="flex flex-col gap-2">
            {stepDef.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice.id)}
                className="flex w-full items-center justify-between gap-3 rounded-blob border-2 border-line bg-paper px-4 py-3 text-left shadow-sticker-sm transition-transform hover:-translate-y-0.5 hover:shadow-sticker"
              >
                <span className="font-semibold">{choice.label}</span>
                <span className="shrink-0 rounded-pill border-2 border-line bg-cream px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                  {choice.cost}
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


