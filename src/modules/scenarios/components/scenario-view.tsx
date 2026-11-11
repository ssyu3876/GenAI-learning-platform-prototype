import { notFound } from 'next/navigation';
import type { SessionUser } from '@/core/types';
import { Card, CardBody, CardHeader, PageHeader, PipSays } from '@/components/ui';
import { growthStage } from '@/core/progress/xp';
import { getUserStats } from '@/core/progress/service';
import { getT, type Translations } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { localizeShipEnding } from '@/i18n/content/ship-endings';
import { getRun } from '../queries';
import {
  SHIP_TIME_BUDGET,
  shipAlternatives,
  shipEnding,
  shipQualitySeries,
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
import { DUNGEON } from '../content/dungeon';
import { StartPanel } from './start-panel';
import { ShipRunner } from './ship-runner';
import { SprintRunner } from './sprint-runner';
import { AgentDungeon } from './agent-dungeon';

function Intro({
  title,
  summary,
  scenarioKey,
  stage,
  t,
}: {
  title: string;
  summary: string;
  scenarioKey: string;
  stage: 0 | 1 | 2 | 3 | 4;
  t: Translations;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PipSays mood="happy" stage={stage} size={76}>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{summary}</p>
      </PipSays>
      <StartPanel scenarioKey={scenarioKey} />
      <Card>
        <CardHeader title={t.scenarios.intro.howItWorks} />
        <CardBody>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-ink-soft">
            <li>{t.scenarios.intro.decisions}</li>
            <li>{t.scenarios.intro.timing}</li>
            <li>{t.scenarios.intro.replay}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export async function ScenarioView({ user, scenarioKey }: { user: SessionUser; scenarioKey: string }) {
  if (scenarioKey !== SHIP_IT.key && scenarioKey !== SPRINT_ZERO.key && scenarioKey !== DUNGEON.key) notFound();

  const { locale, t } = await getT();
  const shipCopy = localizeContent(SHIP_IT, locale);
  const sprintCopy = localizeContent(SPRINT_ZERO, locale);
  const dungeonCopy = localizeContent(DUNGEON, locale);
  const statLabels: Record<string, string> = {
    budget: t.scenarios.stats.budget,
    morale: t.scenarios.stats.morale,
    users: t.scenarios.stats.users,
    quality: t.scenarios.stats.quality,
  };

  const [run, userStats] = await Promise.all([getRun(user.id, scenarioKey), getUserStats(user.id)]);
  const stage = growthStage(userStats.level.level);
  const state = run?.state as ShipState | SprintState | undefined;
  const started = run !== null && (run.status === 'active' || !!state);

  const isShip = scenarioKey === SHIP_IT.key;
  const header = (
    <PageHeader
      eyebrow={scenarioKey === DUNGEON.key ? dungeonCopy.labels.meta : isShip ? shipCopy.meta : sprintCopy.meta}
      title={scenarioKey === DUNGEON.key ? dungeonCopy.labels.title : isShip ? shipCopy.title : sprintCopy.title}
      subtitle={scenarioKey === DUNGEON.key ? dungeonCopy.labels.tagline : isShip ? shipCopy.tagline : sprintCopy.tagline}
    />
  );

  // ---- Agent Dungeon ----
  if (scenarioKey === DUNGEON.key) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <AgentDungeon copy={dungeonCopy} />
      </div>
    );
  }

  // ---- Ship It ----
  if (scenarioKey === SHIP_IT.key) {
    const ship = (state ?? startShip()) as ShipState;
    const rawTurn = shipTurn(ship);
    const turn = rawTurn ? localizeContent(rawTurn, locale) : null;
    const done = ship.phase === 'done';

    if (!started && !done) {
      return (
        <div className="flex flex-col gap-6">
          {header}
          <Intro title={shipCopy.title} summary={shipCopy.summary} scenarioKey={SHIP_IT.key} stage={stage} t={t} />
        </div>
      );
    }

    const repairTurn = turn?.repair?.steps[ship.repairIndex];
    const endingNow = done
      ? localizeShipEnding({ ...shipEnding(ship), score: shipScore(ship) }, locale)
      : null;

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
                  id: turn.id,
                  title: turn.title,
                  claim: turn.claim,
                  diff: turn.diff,
                  risks: turn.risks ?? [],
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
          series={shipQualitySeries(ship)}
          alternatives={shipAlternatives(ship)}
          history={ship.history.map((h) => ({
            title: localizeContent(h.title, locale),
            action: String(h.action),
            note: localizeContent(h.note, locale),
            delta: h.delta,
          }))}
        />
      </div>
    );
  }

  // ---- Sprint Zero ----
  const sprint = (state ?? startSprint()) as SprintState;
  const rawStep = sprintStep(sprint);
  const step = rawStep ? localizeContent(rawStep, locale) : null;
  const weekDef = sprintWeekDef(sprint.week);
  const localizedWeeks = localizeContent(sprintCopy.weeks, locale);
  const drawnCount = sprint.drawn.length || (weekDef ? weekDef.draw[0] + weekDef.draw[1] + weekDef.draw[2] : 8);

  if (!started && sprint.view === 'select' && sprint.allHistory.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Intro title={sprintCopy.title} summary={sprintCopy.summary} scenarioKey={SPRINT_ZERO.key} stage={stage} t={t} />
      </div>
    );
  }

  const summary = sprint.view === 'summary' ? localizeContent(sprintWeekSummary(sprint), locale) : null;
  const endingNow =
    sprint.view === 'ending'
      ? {
          ...localizeContent(sprintEnding(sprint), locale),
          score: sprintScore(sprint),
          fatal: Boolean(sprint.fatal),
        }
      : null;
  const pending = sprint.pending ? localizeContent(sprint.pending, locale) : null;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <SprintRunner
        view={sprint.view}
        week={sprint.week}
        stats={sprintCopy.stats.map((s) => ({
          key: s.key,
          label: statLabels[s.key] ?? s.label,
          value: sprint.stats[s.key],
          max: s.max,
          danger: s.danger,
        }))}
        weeks={localizedWeeks.map((w, i) => {
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
          pending
            ? {
                label: pending.label,
                outcome: pending.outcome,
                deltas: Object.entries(pending.effects)
                  .filter(([, v]) => v !== 0)
                  .map(([k, v]) => ({ label: statLabels[k] ?? k, value: v as number })),
                timedOut: pending.timedOut,
              }
            : null
        }
        summary={
          summary
            ? {
                delta: summary.delta.map((d) => ({
                  label: statLabels[d.key] ?? d.key,
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
          title: localizeContent(h.title, locale),
          choiceLabel: localizeContent(h.choiceLabel, locale),
          outcome: localizeContent(h.outcome, locale),
        }))}
      />
    </div>
  );
}
