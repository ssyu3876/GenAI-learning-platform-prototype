import type { FarmLevel, FarmQuestion } from './farm-engine';

// Farm Lab: a review map for the Agents course. Each ripe plot carries one question; the
// drone stops on it, the learner answers, and a correct answer harvests the plot. The
// programming puzzle (loops, turns, order) stays, but the point is active recall.
export interface FarmCopy {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  minutes: number;
  labels: {
    run: string;
    reset: string;
    stop: string;
    program: string;
    commands: string;
    empty: string;
    loop: string;
    harvest: string;
    plant: string;
    forward: string;
    left: string;
    right: string;
    levelLabel: string;
    goal: string;
    steps: string;
    success: string;
    tryAgain: string;
    tooMany: string;
    hint: string;
    next: string;
    question: string;
    correct: string;
    wrong: string;
    mastered: string;
    weak: string;
    reviewLesson: string;
    close: string;
    retry: string;
  };
  levels: FarmLevel[];
}

const BRIEF_Q: FarmQuestion[] = [
  {
    id: 'brief-1',
    concept: 'Goal and constraints',
    prompt: 'What should a good brief start with?',
    options: [
      'The goal, the constraints, and how you will check the result',
      'The exact keystrokes to type',
      'A list of every file in the repo',
    ],
    answerIndex: 0,
    explanation: 'An agent needs the destination, the rules of the road, and the finish line.',
  },
  {
    id: 'brief-2',
    concept: 'Vague briefs',
    prompt: 'A brief says "make the settings page better". What usually happens?',
    options: [
      'The agent guesses what better means and changes the wrong thing',
      'The agent asks three clarifying questions',
      'The agent refuses to work',
    ],
    answerIndex: 0,
    explanation: 'Agents rarely stop to ask. A vague goal becomes a guess, and a guess becomes a diff.',
  },
  {
    id: 'brief-3',
    concept: 'Context',
    prompt: 'Which context helps an agent most?',
    options: [
      'The file paths, an example of the pattern to follow, and the failing test',
      'A long story about the project history',
      'A reminder to write clean code',
    ],
    answerIndex: 0,
    explanation: 'Point at the files, the pattern and the failure. Stories are for humans.',
  },
  {
    id: 'brief-4',
    concept: 'Scope',
    prompt: 'What is worth leaving out of a brief?',
    options: [
      'Step-by-step keystrokes for work the agent can figure out',
      'The definition of done',
      'The constraints you cannot compromise on',
    ],
    answerIndex: 0,
    explanation: 'Give the destination and the rules, not the finger movements.',
  },
  {
    id: 'brief-5',
    concept: 'Definition of done',
    prompt: 'Which "done when" is testable?',
    options: [
      'The empty cart shows 0 and the checkout test passes',
      'The page looks nicer',
      'The code is high quality',
    ],
    answerIndex: 0,
    explanation: 'A check someone can run beats an adjective nobody can measure.',
  },
  {
    id: 'brief-6',
    concept: 'Plan first',
    prompt: 'The task touches five files. What should the brief ask for first?',
    options: [
      'A short plan before any edits',
      'All five edits in one pass',
      'A rewrite of the whole module',
    ],
    answerIndex: 0,
    explanation: 'A plan is cheap to review and expensive to discover after twenty edits.',
  },
];

const DELEGATE_Q: FarmQuestion[] = [
  {
    id: 'delegate-1',
    concept: 'What to delegate',
    prompt: 'Which task is the safest to hand to an agent?',
    options: [
      'A repetitive form built from an existing pattern',
      'Deciding whether to drop a feature',
      'Choosing the auth model',
    ],
    answerIndex: 0,
    explanation: 'Boilerplate with a clear pattern is agent-shaped; judgement calls stay with you.',
  },
  {
    id: 'delegate-2',
    concept: 'What to keep',
    prompt: 'Which decision should stay with a human?',
    options: [
      'Who can read another user’s data',
      'Renaming a local variable',
      'Adding a loading spinner',
    ],
    answerIndex: 0,
    explanation: 'Security and permissions are accountability decisions, not chores.',
  },
  {
    id: 'delegate-3',
    concept: 'Handover',
    prompt: 'What makes a handover good?',
    options: [
      'The goal, the relevant files, the constraints and the check',
      'A deadline and a shrug',
      'The full repository pasted into the prompt',
    ],
    answerIndex: 0,
    explanation: 'The agent needs the same four things a junior teammate would ask for.',
  },
  {
    id: 'delegate-4',
    concept: 'Unclear requirements',
    prompt: 'The requirement is still unclear. What do you do?',
    options: [
      'Clarify it before delegating',
      'Delegate it and see what comes back',
      'Ask the agent to decide',
    ],
    answerIndex: 0,
    explanation: 'Delegating an unclear requirement produces a confident wrong answer.',
  },
  {
    id: 'delegate-5',
    concept: 'Reviewing delegated work',
    prompt: 'The agent returns a working feature. What next?',
    options: [
      'Read the diff and check the edge cases before merging',
      'Merge it because the demo works',
      'Ask the agent whether it is good',
    ],
    answerIndex: 0,
    explanation: 'A working demo is not a review. The diff and the edges are.',
  },
  {
    id: 'delegate-6',
    concept: 'Mental model',
    prompt: 'Which mental model fits a coding agent best?',
    options: [
      'A fast junior teammate with no memory of yesterday’s meeting',
      'A compiler that is always right',
      'A search engine with a chat box',
    ],
    answerIndex: 0,
    explanation: 'Brief it like a junior teammate, and review its work like one.',
  },
];

const REVIEW_Q: FarmQuestion[] = [
  {
    id: 'review-1',
    concept: 'Evidence',
    prompt: 'The agent says "all tests pass". What do you check first?',
    options: [
      'What the tests cover, and whether they exercise the change',
      'How many tests there are',
      'Whether the agent sounds confident',
    ],
    answerIndex: 0,
    explanation: 'Green tests only mean the tests passed, not that they tested the thing.',
  },
  {
    id: 'review-2',
    concept: 'Read the diff',
    prompt: 'What is the first thing to read in an agent’s pull request?',
    options: [
      'The diff, file by file, including files you did not expect',
      'The summary the agent wrote',
      'The number of lines changed',
    ],
    answerIndex: 0,
    explanation: 'The summary is a claim. The diff is the evidence.',
  },
  {
    id: 'review-3',
    concept: 'Scope creep',
    prompt: 'You asked for a button colour. The diff also changes the API. What is that?',
    options: [
      'Scope creep: reject it and ask for a separate change',
      'A helpful bonus: merge it',
      'A refactor: always welcome',
    ],
    answerIndex: 0,
    explanation: 'Unrequested changes hide risk. Split them out and review them on purpose.',
  },
  {
    id: 'review-4',
    concept: 'Edge cases',
    prompt: 'Which edge case should you check on a cart total?',
    options: [
      'An empty cart, a missing price, and a negative quantity',
      'The happy path with one item',
      'The colour of the total',
    ],
    answerIndex: 0,
    explanation: 'The happy path is the demo. The edges are where the bugs live.',
  },
  {
    id: 'review-5',
    concept: 'Ask for evidence',
    prompt: 'The agent claims a fix works. What is the cheapest evidence?',
    options: [
      'The command it ran and the output, or a test that fails before and passes after',
      'A longer explanation',
      'A screenshot of the code',
    ],
    answerIndex: 0,
    explanation: 'A command and its output can be checked. An explanation cannot.',
  },
  {
    id: 'review-6',
    concept: 'Ownership',
    prompt: 'An agent-written change breaks production. What belongs in the retro?',
    options: [
      'What you will change in the process next time',
      'That the agent wrote it',
      'That nobody told you to test it',
    ],
    answerIndex: 0,
    explanation: 'The agent cannot attend the retro. Ownership is the change you make.',
  },
];

const BRIEFING: FarmLevel = {
  id: 'briefing',
  name: 'Field 1 · Briefing',
  brief: 'Six ripe plots, one per briefing idea. Drive onto each, answer, then harvest.',
  lesson: { title: 'Description: briefing an agent properly', href: '/courses/working-with-ai-coding-agents' },
  width: 7,
  height: 5,
  start: { x: 0, y: 2, dir: 1 },
  tiles: [1, 2, 3, 4, 5, 6].map((x, i) => ({ x, y: 2, crop: 'ripe' as const, questionId: BRIEF_Q[i]!.id })),
  questions: BRIEF_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 24,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const DELEGATION: FarmLevel = {
  id: 'delegation',
  name: 'Field 2 · Delegation',
  brief: 'Six plots along the top and right edge. One program, then loop it.',
  lesson: { title: 'Delegation: what to hand over, what to keep', href: '/courses/working-with-ai-coding-agents' },
  width: 5,
  height: 5,
  start: { x: 0, y: 0, dir: 1 },
  tiles: [
    { x: 1, y: 0, crop: 'ripe', questionId: 'delegate-1' },
    { x: 2, y: 0, crop: 'ripe', questionId: 'delegate-2' },
    { x: 3, y: 0, crop: 'ripe', questionId: 'delegate-3' },
    { x: 3, y: 1, crop: 'ripe', questionId: 'delegate-4' },
    { x: 3, y: 2, crop: 'ripe', questionId: 'delegate-5' },
    { x: 3, y: 3, crop: 'ripe', questionId: 'delegate-6' },
  ],
  questions: DELEGATE_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 40,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const REVIEW: FarmLevel = {
  id: 'review',
  name: 'Field 3 · Review',
  brief: 'Six plots in a row. Harvest only what you can justify.',
  lesson: { title: 'Discernment & diligence: review the agent’s code', href: '/courses/working-with-ai-coding-agents' },
  width: 7,
  height: 4,
  start: { x: 0, y: 1, dir: 1 },
  tiles: [1, 2, 3, 4, 5, 6].map((x, i) => ({ x, y: 1, crop: 'ripe' as const, questionId: REVIEW_Q[i]!.id })),
  questions: REVIEW_Q,
  goal: 'harvest',
  target: 6,
  maxSteps: 24,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

export const FARM_LAB: FarmCopy = {
  key: 'farm-lab',
  title: 'Farm Lab',
  tagline: 'Harvest the Agents course, one question at a time.',
  summary:
    'A review map for Working with AI Coding Agents: program the drone, drive onto a ripe plot, answer the question, and harvest it. Three fields, 18 concepts.',
  meta: '3 fields · 18 questions · about 12 minutes',
  minutes: 12,
  labels: {
    run: 'Run program',
    reset: 'Reset',
    stop: 'Stop',
    program: 'Program',
    commands: 'Commands',
    empty: 'Add commands from the palette.',
    loop: 'Repeat',
    harvest: 'Harvest',
    plant: 'Plant',
    forward: 'Forward',
    left: 'Turn left',
    right: 'Turn right',
    levelLabel: 'Field',
    goal: 'Harvested',
    steps: 'Steps',
    success: 'Field cleared. The concepts are yours.',
    tryAgain: 'Not quite. Change the program and run it again.',
    tooMany: 'The drone ran out of steps.',
    hint: 'Hint: put one side in the program, then repeat it.',
    next: 'Next field',
    question: 'Review question',
    correct: 'Correct — harvest it.',
    wrong: 'Not quite.',
    mastered: 'Concepts',
    weak: 'Weak spots',
    reviewLesson: 'Review this lesson',
    close: 'Close',
    retry: 'Try again',
  },
  levels: [BRIEFING, DELEGATION, REVIEW],
};
