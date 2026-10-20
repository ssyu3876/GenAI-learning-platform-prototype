// Deterministic scoring for the interview coach. No model call: the same answer always
// produces the same score, which makes the feedback trustworthy and testable. A model can
// be layered on later for the wording, but the anchors stay here.
import type { InterviewQuestion, InterviewType } from './interview';

export interface AnswerSignals {
  words: number;
  example: boolean;
  numbers: boolean;
  tradeoff: boolean;
  structure: boolean;
  verification: boolean;
  mentionsAi: boolean;
  delegation: boolean;
  description: boolean;
  discernment: boolean;
  diligence: boolean;
  reflection: boolean;
}

type FlagKey = Exclude<keyof AnswerSignals, 'words'>;

const RULES: Array<[FlagKey, RegExp]> = [
  ['example', /\b(for example|for instance|e\.g\.|once,? i|at my|in my (last|previous)|we had|i built|i worked|last (year|month|week))\b/i],
  ['numbers', /\d/],
  ['tradeoff', /\b(instead|rather than|trade.?off|gave up|chose .* over|alternative|downside|cost of|because we)\b/i],
  ['structure', /\b(first|then|after that|finally|because|so that|as a result|the result|which meant)\b/i],
  ['verification', /\b(test|verif|check|review|validat|assert|log|metric|measur|monitor)\b/i],
  ['mentionsAi', /\b(ai|agent|copilot|cursor|chatgpt|claude|llm|model)\b/i],
  ['delegation', /\b(delegat|hand(ed)? (it )?to|let (the )?ai|wouldn.?t give|keep .* myself|do it myself)\b/i],
  ['description', /\b(spec|requirement|prompt|constraint|signature|input|output|exactly|state)\b/i],
  ['discernment', /\b(wrong|bug|flaw|hallucinat|caught|incorrect|missed|assumption|suspicious)\b/i],
  ['diligence', /\b(log|record|document|accountab|own(ed)?|responsib|track|note)\b/i],
  ['reflection', /\b(learned|realis|realiz|next time|would do differently|mistake)\b/i],
];

export function analyseAnswer(text: string): AnswerSignals {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const out: AnswerSignals = {
    words,
    example: false,
    numbers: false,
    tradeoff: false,
    structure: false,
    verification: false,
    mentionsAi: false,
    delegation: false,
    description: false,
    discernment: false,
    diligence: false,
    reflection: false,
  };
  for (const [key, re] of RULES) out[key] = re.test(text);
  return out;
}

/** 1-5. Hints cost 0.4 each, so a scaffolded answer cannot look self-sufficient. */
export function scoreAnswer(signals: AnswerSignals, hintCount: number): number {
  let score = 1;
  if (signals.words >= 25) score += 1;
  if (signals.structure) score += 1;
  if (signals.example || signals.numbers) score += 1;
  if (signals.tradeoff || signals.verification) score += 1;
  if (signals.words >= 80 && signals.example && signals.tradeoff) score += 1;
  score -= hintCount * 0.4;
  return Math.max(1, Math.min(5, Math.round(score * 10) / 10));
}

export type MoveKind = 'clarify' | 'probe' | 'advance';

/** What the interviewer would do next. One thing at a time. */
export function nextMove(signals: AnswerSignals): { kind: MoveKind; label: string } {
  if (signals.words < 18) {
    return { kind: 'clarify', label: 'Could you expand on that? What did you actually do?' };
  }
  if (!signals.example) {
    return { kind: 'probe', label: 'Can you give me a specific example, with the situation and the result?' };
  }
  if (!signals.tradeoff) {
    return { kind: 'probe', label: 'What did you give up in that decision, and why that way?' };
  }
  if (signals.mentionsAi && !signals.discernment) {
    return { kind: 'probe', label: 'You mentioned AI. How did you check what it produced?' };
  }
  return { kind: 'advance', label: '' };
}

export interface AnsweredQuestion {
  questionId: string;
  prompt: string;
  answer: string;
  hintsUsed: number;
  score: number;
  competency: string;
}

export interface DimensionResult {
  competency: string;
  score: number;
  evidence: string;
  strength: string;
  gap: string;
}

export type FluencyKey = 'delegation' | 'description' | 'discernment' | 'diligence';

export interface FluencyScore {
  key: FluencyKey;
  label: string;
  score: number;
  comment: string;
}

export interface InterviewReport {
  overall: number;
  dimensions: DimensionResult[];
  fluency: FluencyScore[];
  aiDiscussed: boolean;
  strengths: DimensionResult[];
  gaps: DimensionResult[];
  plan: Array<{ day: string; task: string }>;
  nextTime: string;
}

const GAP_BY_SCORE = [
  'The answer did not address the question.',
  'It was usually missing a concrete example.',
  'It had the right shape but no trade-off.',
  'Add the outcome and how you checked it.',
  'Raise the difficulty: test it against an edge case.',
];

const STRENGTH_BY_SCORE = [
  'Not demonstrated yet',
  'Started, but needs evidence',
  'Solid, uneven',
  'Consistent across answers',
  'Strong and specific',
];

const FLUENCY_META: Array<{ key: FluencyKey; label: string; flag: FlagKey }> = [
  { key: 'delegation', label: 'Delegation', flag: 'delegation' },
  { key: 'description', label: 'Description', flag: 'description' },
  { key: 'discernment', label: 'Discernment', flag: 'discernment' },
  { key: 'diligence', label: 'Diligence', flag: 'diligence' },
];

/** Take one sentence from the answer so the learner sees their own words back. */
export function quote(answer: string, maxLength = 150): string {
  const clean = answer.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '));
  return lastStop > 60 ? cut.slice(0, lastStop + 1) : `${cut}...`;
}

export function buildInterviewReport(
  type: InterviewType,
  answers: AnsweredQuestion[],
): InterviewReport {
  const byCompetency = new Map<string, AnsweredQuestion[]>();
  for (const a of answers) {
    const list = byCompetency.get(a.competency) ?? [];
    list.push(a);
    byCompetency.set(a.competency, list);
  }

  const dimensions: DimensionResult[] = type.competencies.map((competency) => {
    const rows = byCompetency.get(competency) ?? [];
    const raw = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 1;
    const score = Math.round(raw * 10) / 10;
    const band = Math.max(0, Math.min(4, Math.round(score) - 1));
    const best = [...rows].sort((a, b) => b.score - a.score)[0];
    return {
      competency,
      score,
      evidence: best ? quote(best.answer) : 'No answer recorded.',
      strength: STRENGTH_BY_SCORE[band]!,
      gap: GAP_BY_SCORE[band]!,
    };
  });

  const overall = dimensions.length
    ? Math.round((dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) * 10) / 10
    : 1;

  const signals = analyseAnswer(answers.map((a) => a.answer).join(' '));
  const aiDiscussed = signals.mentionsAi;

  const fluency: FluencyScore[] = FLUENCY_META.map(({ key, label, flag }) => ({
    key,
    label,
    score: aiDiscussed ? (signals[flag] ? 4 : 1) : 0,
    comment: !aiDiscussed
      ? 'Not discussed in this interview.'
      : signals[flag]
        ? 'Raised with some specificity.'
        : 'AI came up, but this part was not addressed.',
  }));

  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const gaps = sorted.slice(0, 3);
  const strengths = [...sorted].reverse().slice(0, 3);

  const plan: Array<{ day: string; task: string }> = [
    { day: 'Day 1', task: `Rewrite your weakest answer (${gaps[0]?.competency ?? 'the first one'}) with one number in it.` },
    { day: 'Day 2', task: 'Answer the same question in 90 seconds and listen for the missing example.' },
    { day: 'Day 3', task: `Practise ${gaps[1]?.competency ?? 'trade-offs'}: every answer should name what you gave up.` },
    { day: 'Day 4', task: 'Write one answer using the arc: situation, what you wanted, what you gave up, result.' },
    {
      day: 'Day 5',
      task: aiDiscussed
        ? 'Describe a task you delegated and how you checked it.'
        : 'Describe how you would use an AI tool, and how you would check it.',
    },
    { day: 'Day 6', task: 'Run this interview again on a harder setting.' },
    { day: 'Day 7', task: 'Try a different interview type. The weak spots usually follow you.' },
  ];

  return {
    overall,
    dimensions,
    fluency,
    aiDiscussed,
    strengths,
    gaps,
    plan,
    nextTime:
      overall >= 3.5
        ? 'Your structure is there. What separates this from a strong interview is the density of specific evidence.'
        : 'Most answers had the right instinct and stopped before the concrete part. That is the fastest thing to fix.',
  };
}

export function pickQuestions(type: InterviewType, count = 5): InterviewQuestion[] {
  return type.questions.slice(0, Math.max(1, Math.min(count, type.questions.length)));
}
