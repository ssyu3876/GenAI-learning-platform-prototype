'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { recordEvent } from '@/core/events';
import { newId } from '@/core/ids';
import type { ActionResult } from '@/core/types';
import { INTERVIEW_TYPES, interviewType } from './content/interview';
import {
  analyseAnswer,
  buildInterviewReport,
  nextMove,
  pickQuestions,
  scoreAnswer,
} from './content/interview-engine';
import {
  shipComplete,
  shipDecide,
  shipNext,
  shipRepairPick,
  shipScore,
  shipVerdict,
  sprintAdvance,
  sprintChoose,
  sprintEnterWeek,
  sprintLeaveSummary,
  sprintScore,
  startShip,
  startSprint,
  startInterview,
  type InterviewRunState,
  type ShipState,
  type SprintState,
} from './engine';
import { scenarioRuns } from './schema';
import { getRun } from './queries';
import { SPRINT_ZERO } from './content/sprint-zero';
import { SHIP_IT } from './content/ship-it';

export type AnyState = ShipState | SprintState | InterviewRunState;

const keySchema = z.string().min(1).max(64);

async function loadState<T>(userId: string, key: string): Promise<T | null> {
  const run = await getRun(userId, key);
  return run ? (run.state as unknown as T) : null;
}

async function saveState(
  userId: string,
  key: string,
  state: unknown,
  patch: { status?: 'active' | 'finished'; score?: number; completions?: number } = {},
): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: scenarioRuns.id, bestScore: scenarioRuns.bestScore, completions: scenarioRuns.completions })
    .from(scenarioRuns)
    .where(and(eq(scenarioRuns.userId, userId), eq(scenarioRuns.scenarioKey, key)))
    .limit(1);

  const bestScore = Math.max(existing?.bestScore ?? 0, patch.score ?? 0);
  const completions = patch.completions ?? existing?.completions ?? 0;

  if (existing) {
    await db
      .update(scenarioRuns)
      .set({ state, status: patch.status ?? 'active', bestScore, completions, updatedAt: new Date() })
      .where(eq(scenarioRuns.id, existing.id));
  } else {
    await db.insert(scenarioRuns).values({
      id: newId('run'),
      userId,
      scenarioKey: key,
      status: patch.status ?? 'active',
      state,
      bestScore,
      completions,
    });
  }
}

/** Grant XP once per finished run. Only improvement over the previous best is awarded. */
async function awardIfFinished(userId: string, key: string, state: AnyState): Promise<AnyState> {
  if (state.awarded) return state;

  let score = 0;
  let finished = false;

  if (state.kind === 'ship') {
    finished = shipComplete(state);
    if (finished) score = shipScore(state);
  } else if (state.kind === 'sprint') {
    finished = state.view === 'ending';
    if (finished) score = sprintScore(state);
  } else if (state.interview) {
    const type = interviewType(state.interview.typeId);
    if (type) {
      finished = state.interview.questionIndex >= pickQuestions(type).length;
      if (finished) score = Math.round(buildInterviewReport(type, state.interview.answers).overall * 20);
    }
  }
  if (!finished) return state;

  const existing = await getRun(userId, key);
  const gained = Math.max(0, score - (existing?.bestScore ?? 0));
  if (gained > 0) {
    await recordEvent({
      userId,
      type: 'scenario.completed',
      xp: gained,
      payload: { scenarioKey: key, score },
    });
  }

  const marked = { ...state, awarded: true } as AnyState;
  await saveState(userId, key, marked, {
    status: 'finished',
    score,
    completions: (existing?.completions ?? 0) + 1,
  });
  return marked;
}

async function persist(userId: string, key: string, next: AnyState): Promise<ActionResult> {
  const awarded = await awardIfFinished(userId, key, next);
  if (!awarded.awarded) await saveState(userId, key, awarded);
  revalidatePath('/scenarios');
  revalidatePath(`/scenarios/${key}`);
  revalidatePath('/home');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Start / reset
// ---------------------------------------------------------------------------

const startSchema = z.object({ key: keySchema });

export async function startScenario(input: z.infer<typeof startSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { key } = startSchema.parse(input);
  if (key !== SHIP_IT.key && key !== SPRINT_ZERO.key) {
    return { ok: false, error: 'Unknown scenario.' };
  }
  const existing = await getRun(user.id, key);
  if (existing && existing.status === 'active') return { ok: true, message: 'Resumed.' };

  const fresh = key === SHIP_IT.key ? startShip() : startSprint();
  await saveState(user.id, key, fresh, { status: 'active' });
  revalidatePath('/scenarios');
  revalidatePath(`/scenarios/${key}`);
  return { ok: true };
}

export async function resetScenario(input: z.infer<typeof startSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { key } = startSchema.parse(input);
  if (key !== SHIP_IT.key && key !== SPRINT_ZERO.key) {
    return { ok: false, error: 'Unknown scenario.' };
  }
  const fresh = key === SHIP_IT.key ? startShip() : startSprint();
  await saveState(user.id, key, fresh, { status: 'active' });
  revalidatePath(`/scenarios/${key}`);
  return { ok: true, message: 'Reset.' };
}

// ---------------------------------------------------------------------------
// Ship It
// ---------------------------------------------------------------------------

const shipActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'repair', 'evidence']),
});

export async function shipChoose(input: z.infer<typeof shipActionSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { action } = shipActionSchema.parse(input);
  const state = await loadState<ShipState>(user.id, SHIP_IT.key);
  if (!state || state.kind !== 'ship') return { ok: false, error: 'Start the scenario first.' };
  return persist(user.id, SHIP_IT.key, shipDecide(state, action));
}

const shipRepairSchema = z.object({ optionId: z.string().min(1).max(64) });

export async function shipRepair(input: z.infer<typeof shipRepairSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { optionId } = shipRepairSchema.parse(input);
  const state = await loadState<ShipState>(user.id, SHIP_IT.key);
  if (!state || state.kind !== 'ship') return { ok: false, error: 'Start the scenario first.' };
  return persist(user.id, SHIP_IT.key, shipRepairPick(state, optionId));
}

const shipVerdictSchema = z.object({ action: z.enum(['approve', 'reject']) });

export async function shipDecideAfterRepair(
  input: z.infer<typeof shipVerdictSchema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const { action } = shipVerdictSchema.parse(input);
  const state = await loadState<ShipState>(user.id, SHIP_IT.key);
  if (!state || state.kind !== 'ship') return { ok: false, error: 'Start the scenario first.' };
  return persist(user.id, SHIP_IT.key, shipVerdict(state, action));
}

export async function shipAdvance(): Promise<ActionResult> {
  const user = await requireUser();
  const state = await loadState<ShipState>(user.id, SHIP_IT.key);
  if (!state || state.kind !== 'ship') return { ok: false, error: 'Nothing in progress.' };
  return persist(user.id, SHIP_IT.key, shipNext(state));
}

// ---------------------------------------------------------------------------
// Sprint Zero
// ---------------------------------------------------------------------------

const enterWeekSchema = z.object({ week: z.number().int().min(0).max(2) });

export async function sprintEnter(input: z.infer<typeof enterWeekSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { week } = enterWeekSchema.parse(input);
  const state = await loadState<SprintState>(user.id, SPRINT_ZERO.key);
  if (!state || state.kind !== 'sprint') return { ok: false, error: 'Start the scenario first.' };

  // A fresh seed each time you enter, so two runs of the same week differ.
  const seed = Math.floor(Math.random() * 2 ** 31);
  return persist(user.id, SPRINT_ZERO.key, sprintEnterWeek(state, week, seed));
}

const sprintChooseSchema = z.object({
  choiceId: z.string().min(1).max(64),
  timedOut: z.boolean().optional(),
});

export async function sprintPick(input: z.infer<typeof sprintChooseSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const data = sprintChooseSchema.parse(input);
  const state = await loadState<SprintState>(user.id, SPRINT_ZERO.key);
  if (!state || state.kind !== 'sprint') return { ok: false, error: 'Start the scenario first.' };
  return persist(user.id, SPRINT_ZERO.key, sprintChoose(state, data.choiceId, data.timedOut));
}

export async function sprintGoOn(): Promise<ActionResult> {
  const user = await requireUser();
  const state = await loadState<SprintState>(user.id, SPRINT_ZERO.key);
  if (!state || state.kind !== 'sprint') return { ok: false, error: 'Nothing in progress.' };
  return persist(user.id, SPRINT_ZERO.key, sprintAdvance(state));
}

export async function sprintLeaveWeekSummary(): Promise<ActionResult> {
  const user = await requireUser();
  const state = await loadState<SprintState>(user.id, SPRINT_ZERO.key);
  if (!state || state.kind !== 'sprint') return { ok: false, error: 'Nothing in progress.' };
  return persist(user.id, SPRINT_ZERO.key, sprintLeaveSummary(state));
}

// ---------------------------------------------------------------------------
// Interview
// ---------------------------------------------------------------------------

const interviewStartSchema = z.object({ typeId: z.string().min(1).max(64) });

export async function startInterviewRun(
  input: z.infer<typeof interviewStartSchema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const { typeId } = interviewStartSchema.parse(input);
  const type = INTERVIEW_TYPES.find((t) => t.id === typeId);
  if (!type) return { ok: false, error: 'Unknown interview type.' };

  const key = `interview:${typeId}`;
  await saveState(user.id, key, startInterview(typeId), { status: 'active' });
  revalidatePath('/scenarios');
  return { ok: true };
}

const answerSchema = z.object({
  typeId: z.string().min(1).max(64),
  answer: z.string().min(1).max(4000),
  hintsUsed: z.number().int().min(0).max(3),
});

export async function answerInterview(input: z.infer<typeof answerSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const data = answerSchema.parse(input);
  const type = interviewType(data.typeId);
  if (!type) return { ok: false, error: 'Unknown interview type.' };

  const key = `interview:${data.typeId}`;
  const state = await loadState<InterviewRunState>(user.id, key);
  if (!state?.interview) return { ok: false, error: 'Start the interview first.' };

  const questions = pickQuestions(type);
  const question = questions[state.interview.questionIndex];
  if (!question) return { ok: false, error: 'That was the last question.' };

  const signals = analyseAnswer(data.answer);
  const score = scoreAnswer(signals, data.hintsUsed);

  // One follow-up per question, then move on. Without this cap a learner who keeps
  // answering without an example stays on the same question indefinitely.
  const probes = state.interview.probes ?? 0;
  const move = probes >= 1 ? { kind: 'advance' as const, label: '' } : nextMove(signals);
  const advanceNow = move.kind === 'advance';

  const next = {
    ...state,
    interview: {
      ...state.interview,
      answers: [
        ...state.interview.answers,
        {
          questionId: question.id,
          prompt: question.prompt,
          answer: data.answer,
          hintsUsed: data.hintsUsed,
          score,
          competency: question.competency,
        },
      ],
      followUp: advanceNow ? null : { label: move.label, answered: false },
      questionIndex: state.interview.questionIndex + (advanceNow ? 1 : 0),
      probes: advanceNow ? 0 : probes + 1,
      hintsUsed: 0,
    },
  };

  return persist(user.id, key, next);
}

const skipSchema = z.object({ typeId: z.string().min(1).max(64) });

export async function skipInterviewQuestion(input: z.infer<typeof skipSchema>): Promise<ActionResult> {
  const user = await requireUser();
  const { typeId } = skipSchema.parse(input);
  const type = interviewType(typeId);
  if (!type) return { ok: false, error: 'Unknown interview type.' };

  const key = `interview:${typeId}`;
  const state = await loadState<InterviewRunState>(user.id, key);
  if (!state?.interview) return { ok: false, error: 'Start the interview first.' };

  const questions = pickQuestions(type);
  const question = questions[state.interview.questionIndex];
  if (!question) return { ok: false, error: 'That was the last question.' };

  const next = {
    ...state,
    interview: {
      ...state.interview,
      answers: [
        ...state.interview.answers,
        {
          questionId: question.id,
          prompt: question.prompt,
          answer: '',
          hintsUsed: 3,
          score: 1,
          competency: question.competency,
        },
      ],
      followUp: null,
      questionIndex: state.interview.questionIndex + 1,
      probes: 0,
      hintsUsed: 0,
    },
  };

  return persist(user.id, key, next);
}

