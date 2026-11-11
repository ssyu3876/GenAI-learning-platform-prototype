// Deterministic scoring for the interview coach. No model call: the same answer always
// produces the same score, which makes the feedback trustworthy and testable. A model can
// be layered on later for the wording, but the anchors stay here.
import type { Locale } from '@/i18n/config';
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

// Patterns for both English and Chinese answers: the coach must score a Chinese answer the
// same way it scores an English one.
const RULES: Array<[FlagKey, RegExp]> = [
  ['example', /\b(for example|for instance|e\.g\.|once,? i|at my|in my (last|previous)|we had|i built|i worked|last (year|month|week))\b|例子|比如|例如|有一次|上次|上一家|我做过|我们团队/i],
  ['numbers', /\d/],
  ['tradeoff', /\b(instead|rather than|trade.?off|gave up|chose .* over|alternative|downside|cost of|because we)\b|取舍|权衡|放弃|而不是|替代方案|代价|成本|选择了/i],
  ['structure', /\b(first|then|after that|finally|because|so that|as a result|the result|which meant)\b|首先|然后|接着|最后|因为|所以|结果|这意味着/i],
  ['verification', /\b(test|verif|check|review|validat|assert|log|metric|measur|monitor)\b|测试|验证|检查|评审|断言|日志|指标|衡量|监控/i],
  ['mentionsAi', /\b(ai|agent|copilot|cursor|chatgpt|claude|llm|model)\b|智能体|助手|模型/i],
  ['delegation', /\b(delegat|hand(ed)? (it )?to|let (the )?ai|wouldn.?t give|keep .* myself|do it myself)\b|交给|委派|让 ?AI|自己做|不交给/i],
  ['description', /\b(spec|requirement|prompt|constraint|signature|input|output|exactly|state)\b|需求|规格|提示词|约束|输入|输出|签名|明确/i],
  ['discernment', /\b(wrong|bug|flaw|hallucinat|caught|incorrect|missed|assumption|suspicious)\b|错误|缺陷|问题|幻觉|发现|遗漏|假设|可疑|不对/i],
  ['diligence', /\b(log|record|document|accountab|own(ed)?|responsib|track|note)\b|记录|文档|负责|追踪|日志|备注|复盘/i],
  ['reflection', /\b(learned|realis|realiz|next time|would do differently|mistake)\b|学到|意识到|下次|本可以|教训/i],
];

const CJK = /[\u4e00-\u9fff]/g;

/** Chinese has no spaces: count CJK characters, then map to English-like "words". */
function wordCount(text: string): number {
  const cjk = text.match(CJK)?.length ?? 0;
  const latin = text.replace(CJK, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.round(cjk / 2) + latin;
}

export function analyseAnswer(text: string): AnswerSignals {
  const words = wordCount(text);
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
export function nextMove(signals: AnswerSignals, locale: Locale = 'en'): { kind: MoveKind; label: string } {
  if (locale === 'zh') {
    if (signals.words < 18) {
      return { kind: 'clarify', label: '能再展开说说吗？你当时具体做了什么？' };
    }
    if (!signals.example) {
      return { kind: 'probe', label: '能举一个具体的例子吗？说说当时的场景和结果。' };
    }
    if (!signals.tradeoff) {
      return { kind: 'probe', label: '那个决定里你放弃了什么？为什么这样选？' };
    }
    if (signals.mentionsAi && !signals.discernment) {
      return { kind: 'probe', label: '你提到了 AI。你是怎么检查它产出的内容的？' };
    }
    return { kind: 'advance', label: '' };
  }
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

const GAP_BY_SCORE_EN = [
  'The answer did not address the question.',
  'It was usually missing a concrete example.',
  'It had the right shape but no trade-off.',
  'Add the outcome and how you checked it.',
  'Raise the difficulty: test it against an edge case.',
];

const STRENGTH_BY_SCORE_EN = [
  'Not demonstrated yet',
  'Started, but needs evidence',
  'Solid, uneven',
  'Consistent across answers',
  'Strong and specific',
];

const GAP_BY_SCORE_ZH = [
  '回答没有正面回应问题。',
  '通常缺少一个具体的例子。',
  '结构对了，但没有取舍。',
  '补上结果，以及你如何检查它。',
  '把难度提高：用一个边界情况检验它。',
];

const STRENGTH_BY_SCORE_ZH = [
  '还没有体现出来',
  '已经开始，但需要证据',
  '扎实，但不够稳定',
  '多次回答都保持住了',
  '有力且具体',
];

const FLUENCY_META: Array<{ key: FluencyKey; label: string; labelZh: string; flag: FlagKey }> = [
  { key: 'delegation', label: 'Delegation', labelZh: '委派', flag: 'delegation' },
  { key: 'description', label: 'Description', labelZh: '描述', flag: 'description' },
  { key: 'discernment', label: 'Discernment', labelZh: '辨别', flag: 'discernment' },
  { key: 'diligence', label: 'Diligence', labelZh: '勤勉', flag: 'diligence' },
];

/** Take one sentence from the answer so the learner sees their own words back. */
export function quote(answer: string, maxLength = 150): string {
  const clean = answer.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf('。'), cut.lastIndexOf('，'));
  return lastStop > 60 ? cut.slice(0, lastStop + 1) : `${cut}...`;
}

export function buildInterviewReport(
  type: InterviewType,
  answers: AnsweredQuestion[],
  locale: Locale = 'en',
): InterviewReport {
  const zh = locale === 'zh';
  const GAP_BY_SCORE = zh ? GAP_BY_SCORE_ZH : GAP_BY_SCORE_EN;
  const STRENGTH_BY_SCORE = zh ? STRENGTH_BY_SCORE_ZH : STRENGTH_BY_SCORE_EN;

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
      evidence: best ? quote(best.answer) : zh ? '没有记录到回答。' : 'No answer recorded.',
      strength: STRENGTH_BY_SCORE[band]!,
      gap: GAP_BY_SCORE[band]!,
    };
  });

  const overall = dimensions.length
    ? Math.round((dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) * 10) / 10
    : 1;

  const signals = analyseAnswer(answers.map((a) => a.answer).join(' '));
  const aiDiscussed = signals.mentionsAi;

  const fluency: FluencyScore[] = FLUENCY_META.map(({ key, label, labelZh, flag }) => ({
    key,
    label: zh ? labelZh : label,
    score: aiDiscussed ? (signals[flag] ? 4 : 1) : 0,
    comment: !aiDiscussed
      ? zh
        ? '这次面试没有谈到 AI。'
        : 'Not discussed in this interview.'
      : signals[flag]
        ? zh
          ? '提到了，而且有一定细节。'
          : 'Raised with some specificity.'
        : zh
          ? '谈到了 AI，但这部分没有涉及。'
          : 'AI came up, but this part was not addressed.',
  }));

  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const gaps = sorted.slice(0, 3);
  const strengths = [...sorted].reverse().slice(0, 3);

  const plan: Array<{ day: string; task: string }> = zh
    ? [
        { day: '第 1 天', task: `重写你最弱的一个回答（${gaps[0]?.competency ?? '第一个'}），里面至少放一个数字。` },
        { day: '第 2 天', task: '用 90 秒回答同一个问题，留意自己漏掉的例子。' },
        { day: '第 3 天', task: `练习${gaps[1]?.competency ?? '取舍'}：每个回答都要说清你放弃了什么。` },
        { day: '第 4 天', task: '用这个结构写一个回答：情境、你想要什么、你放弃了什么、结果。' },
        {
          day: '第 5 天',
          task: aiDiscussed ? '描述一个你委派出去的任务，以及你如何检查它。' : '描述你会怎样使用 AI 工具，以及你会怎样检查它。',
        },
        { day: '第 6 天', task: '换一个更难的设置，再做一次这场面试。' },
        { day: '第 7 天', task: '试试另一种面试类型。薄弱点通常会跟着你。' },
      ]
    : [
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
    nextTime: zh
      ? overall >= 3.5
        ? '结构已经立住了。决定你离一场优秀面试还有多远的，是具体证据的密度。'
        : '大多数回答方向都对，但停在具体细节之前。这是最快能补上的部分。'
      : overall >= 3.5
        ? 'Your structure is there. What separates this from a strong interview is the density of specific evidence.'
        : 'Most answers had the right instinct and stopped before the concrete part. That is the fastest thing to fix.',
  };
}

export function pickQuestions(type: InterviewType, count = 5): InterviewQuestion[] {
  return type.questions.slice(0, Math.max(1, Math.min(count, type.questions.length)));
}
