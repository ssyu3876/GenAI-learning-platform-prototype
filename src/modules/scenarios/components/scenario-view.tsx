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
import { RELEASE_WEEK } from '../content/release-week';
import { StartPanel } from './start-panel';
import { ShipRunner } from './ship-runner';
import { SprintRunner } from './sprint-runner';

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
  if (scenarioKey !== SHIP_IT.key && scenarioKey !== SPRINT_ZERO.key && scenarioKey !== RELEASE_WEEK.key) {
    notFound();
  }

  const { locale, t } = await getT();
  const shipCopy = localizeContent(SHIP_IT, locale);
  const sprintCopy = localizeContent(SPRINT_ZERO, locale);
  const releaseCopy = localizeContent(RELEASE_WEEK, locale);
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
  const isRelease = scenarioKey === RELEASE_WEEK.key;
  const longCopy = isRelease ? releaseCopy : sprintCopy;
  const header = (
    <PageHeader
      eyebrow={isShip ? shipCopy.meta : longCopy.meta}
      title={isShip ? shipCopy.title : longCopy.title}
      subtitle={isShip ? shipCopy.tagline : longCopy.tagline}
    />
  );

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

  // ---- Sprint Zero / Release Week ----
  const scenarioDef = isRelease ? RELEASE_WEEK : SPRINT_ZERO;
  const sprint = (state ?? startSprint(scenarioDef)) as SprintState;
  const rawStep = sprintStep(sprint, scenarioDef);
  const step = rawStep ? localizeContent(rawStep, locale) : null;
  const weekDef = sprintWeekDef(sprint.week, scenarioDef);
  const localizedWeeks = localizeContent(longCopy.weeks, locale);
  const drawnCount = sprint.drawn.length || (weekDef ? weekDef.draw[0] + weekDef.draw[1] + weekDef.draw[2] : 8);
  const statLabel = (key: string) =>
    isRelease
      ? (longCopy.stats.find((s) => s.key === key)?.label ?? key)
      : (statLabels[key] ?? key);

  if (!started && sprint.view === 'select' && sprint.allHistory.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Intro title={longCopy.title} summary={longCopy.summary} scenarioKey={scenarioDef.key} stage={stage} t={t} />
      </div>
    );
  }

  const summary =
    sprint.view === 'summary' ? localizeContent(sprintWeekSummary(sprint, scenarioDef), locale) : null;
  const endingNow =
    sprint.view === 'ending'
      ? {
          ...localizeContent(sprintEnding(sprint, scenarioDef), locale),
          score: sprintScore(sprint, scenarioDef),
          fatal: Boolean(sprint.fatal),
        }
      : null;
  const pending = sprint.pending ? localizeContent(sprint.pending, locale) : null;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <SprintRunner
        scenarioKey={scenarioDef.key}
        view={sprint.view}
        week={sprint.week}
        stats={longCopy.stats.map((s) => ({
          key: s.key,
          label: statLabel(s.key),
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
                  .map(([k, v]) => ({ label: statLabel(k), value: v as number })),
                timedOut: pending.timedOut,
              }
            : null
        }
        summary={
          summary
            ? {
                delta: summary.delta.map((d) => ({
                  label: statLabel(d.key),
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
