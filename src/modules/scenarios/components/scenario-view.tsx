import { notFound } from 'next/navigation';
import type { SessionUser } from '@/core/types';
import { Card, CardBody, CardHeader, PageHeader, PipSays } from '@/components/ui';
import { growthStage } from '@/core/progress/xp';
import { getUserStats } from '@/core/progress/service';
import { getRun } from '../queries';
import {
  SHIP_TIME_BUDGET,
  shipEnding,
  shipScore,
  shipTotalTurns,
  shipTurn,
  sprintEnding,
  sprintScore,
  sprintStep,
  sprintWeekDef,
  sprintWeekSummary,
  startShip,
  startSprint,
  type ShipState,
  type SprintState,
} from '../engine';
import { SHIP_IT } from '../content/ship-it';
import { SPRINT_ZERO } from '../content/sprint-zero';
import { StartPanel } from './start-panel';
import { ShipRunner } from './ship-runner';
import { SprintRunner } from './sprint-runner';

const DELTA_LABEL: Record<string, string> = {
  budget: 'Budget',
  morale: 'Morale',
  users: 'Users',
  quality: 'Quality',
};

function Intro({ title, summary, scenarioKey, stage }: { title: string; summary: string; scenarioKey: string; stage: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex flex-col gap-4">
      <PipSays mood="happy" stage={stage} size={76}>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{summary}</p>
      </PipSays>
      <StartPanel scenarioKey={scenarioKey} />
      <Card>
        <CardHeader title="How it works" />
        <CardBody>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-ink-soft">
            <li>Every decision moves a number, and the numbers carry forward.</li>
            <li>There is no timer on the page. The cost of a bad call arrives later.</li>
            <li>You can play it again; only your best score is kept.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export async function ScenarioView({ user, scenarioKey }: { user: SessionUser; scenarioKey: string }) {
  if (scenarioKey !== SHIP_IT.key && scenarioKey !== SPRINT_ZERO.key) notFound();

  const [run, userStats] = await Promise.all([getRun(user.id, scenarioKey), getUserStats(user.id)]);
  const stage = growthStage(userStats.level.level);
  const state = run?.state as ShipState | SprintState | undefined;
  const started = run !== null && (run.status === 'active' || !!state);

  const isShip = scenarioKey === SHIP_IT.key;
  const header = (
    <PageHeader
      eyebrow={isShip ? SHIP_IT.meta : SPRINT_ZERO.meta}
      title={isShip ? SHIP_IT.title : SPRINT_ZERO.title}
      subtitle={isShip ? SHIP_IT.tagline : SPRINT_ZERO.tagline}
    />
  );

  // ---- Ship It ----
  if (scenarioKey === SHIP_IT.key) {
    const ship = (state ?? startShip()) as ShipState;
    const turn = shipTurn(ship);
    const done = ship.phase === 'done';

    if (!started && !done) {
      return (
        <div className="flex flex-col gap-6">
          {header}
          <Intro title={SHIP_IT.title} summary={SHIP_IT.summary} scenarioKey={SHIP_IT.key} stage={stage} />
        </div>
      );
    }

    const repairTurn = turn?.repair?.steps[ship.repairIndex];
    const endingNow = done ? { ...shipEnding(ship), score: shipScore(ship) } : null;

    return (
      <div className="flex flex-col gap-6">
        {header}
        <ShipRunner
          turnIndex={ship.turnIndex}
          total={shipTotalTurns(ship)}
          quality={ship.quality}
          minutes={ship.minutes}
          budget={SHIP_TIME_BUDGET}
          phase={ship.phase}
          evidenceShown={ship.evidenceShown}
          turn={
            turn
              ? {
                  title: turn.title,
                  claim: turn.claim,
                  diff: turn.diff,
                  evidence: turn.evidence,
                  minutes: turn.minutes,
                  canRepair: Boolean(turn.repair && turn.repair.steps.length > 0),
                }
              : null
          }
          repair={
            repairTurn && turn?.repair
              ? {
                  prompt: turn.repair.prompt,
                  stepIndex: ship.repairIndex,
                  stepTotal: turn.repair.steps.length,
                  options: repairTurn.options.map((o) => ({ id: o.id, label: o.label })),
                }
              : null
          }
          pending={ship.pending ? { delta: ship.pending.delta, note: ship.pending.note } : null}
          ending={endingNow}
          history={ship.history.map((h) => ({
            title: h.title,
            action: String(h.action),
            note: h.note,
            delta: h.delta,
          }))}
        />
      </div>
    );
  }

  // ---- Sprint Zero ----
  const sprint = (state ?? startSprint()) as SprintState;
  const step = sprintStep(sprint);
  const weekDef = sprintWeekDef(sprint.week);
  const drawnCount = sprint.drawn.length || (weekDef ? weekDef.draw[0] + weekDef.draw[1] + weekDef.draw[2] : 8);

  if (!started && sprint.view === 'select' && sprint.allHistory.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Intro title={SPRINT_ZERO.title} summary={SPRINT_ZERO.summary} scenarioKey={SPRINT_ZERO.key} stage={stage} />
      </div>
    );
  }

  const summary = sprint.view === 'summary' ? sprintWeekSummary(sprint) : null;
  const endingNow =
    sprint.view === 'ending'
      ? { ...sprintEnding(sprint), score: sprintScore(sprint), fatal: Boolean(sprint.fatal) }
      : null;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <SprintRunner
        view={sprint.view}
        week={sprint.week}
        stats={SPRINT_ZERO.stats.map((s) => ({
          key: s.key,
          label: s.label,
          value: sprint.stats[s.key],
          max: s.max,
          danger: s.danger,
        }))}
        weeks={SPRINT_ZERO.weeks.map((w, i) => {
          const total = w.draw[0] + w.draw[1] + w.draw[2];
          const done = sprint.completed[i] ? total : sprint.week === i ? sprint.stepIndex : 0;
          return {
            index: i,
            title: w.title,
            tagline: w.tagline,
            done,
            total,
            complete: Boolean(sprint.completed[i]),
            // Week 0 is always open; a later week opens only when the one before it is finished.
            available: i === 0 || Boolean(sprint.completed[i - 1]),
          };
        })}
        step={
          step
            ? {
                title: step.title,
                body: step.body,
                index: sprint.stepIndex,
                total: drawnCount,
                choices: step.choices.map((c) => ({ id: c.id, label: c.label, cost: c.cost })),
                seconds: step.seconds,
                timeoutChoice: step.timeoutChoice ?? step.choices.length - 1,
              }
            : null
        }
        pending={
          sprint.pending
            ? {
                label: sprint.pending.label,
                outcome: sprint.pending.outcome,
                deltas: Object.entries(sprint.pending.effects)
                  .filter(([, v]) => v !== 0)
                  .map(([k, v]) => ({ label: DELTA_LABEL[k] ?? k, value: v as number })),
                timedOut: sprint.pending.timedOut,
              }
            : null
        }
        summary={
          summary
            ? {
                delta: summary.delta.map((d) => ({
                  label: DELTA_LABEL[d.key] ?? d.key,
                  from: d.from,
                  to: d.to,
                  change: d.change,
                })),
                advice: summary.advice,
              }
            : null
        }
        ending={endingNow}
        history={sprint.allHistory.map((h) => ({
          title: h.title,
          choiceLabel: h.choiceLabel,
          outcome: h.outcome,
        }))}
      />
    </div>
  );
}

