// Release Week: the third long scenario. Same shape as Sprint Zero (three weeks, a bank per
// week, four stats), but the stats are time, trust, early testers and quality, and the story
// is one release from kickoff to launch day.
//
// Reusing the sprint state machine keeps one engine for both. Text that the engine composes
// lives in RELEASE_COPY so the i18n dictionary can pair it with the Chinese copy.
import type {
  SprintEnding,
  SprintScenario,
  SprintWeek,
  Stats,
} from './types';

export interface ReleaseCopy {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  minutes: number;
  stats: SprintScenario['stats'];
  weeks: SprintWeek[];
  endings: Record<'clean' | 'bruised' | 'burned', Omit<SprintEnding, 'key'>>;
  advice: {
    trust: string;
    quality: string;
    time: string;
    testers: string;
    calm: string;
  };
}

const W1: SprintWeek['bank'] = [
  {
    id: 'fixed-date',
    act: 1,
    title: 'The fixed date, the open scope',
    body: 'The client wants the full list by Friday. Nobody has agreed what "full" means, and the team has not estimated the last two items.',
    choices: [
      {
        id: 'slice',
        label: 'Agree the smallest slice that is still useful, in writing',
        cost: 'one hour',
        effects: { morale: 12, quality: 4, budget: -6 },
        outcome: 'The list shrinks to four items everyone can name. The client signs off on the cut.',
      },
      {
        id: 'promise',
        label: 'Promise the full list and hope the team catches up',
        cost: 'no hard choices',
        effects: { budget: 10, quality: -8, morale: -6 },
        outcome: 'Nobody argues today. In week three the missing items become somebody\'s weekend.',
      },
      {
        id: 'delay',
        label: 'Ask for two more weeks before starting',
        cost: 'a delay',
        effects: { morale: -6, budget: 6, quality: 4 },
        outcome: 'The team gets room, but the client hears "slow" before hearing "clear".',
      },
    ],
  },
  {
    id: 'big-pr',
    act: 2,
    title: 'The 800-line pull request',
    body: 'A teammate used an agent to build the settings screen. The tests pass. The diff touches eleven files and nobody has read it.',
    choices: [
      {
        id: 'smaller',
        label: 'Ask for the intent and a smaller first slice',
        cost: 'one review round',
        effects: { quality: 10, morale: 6, budget: -6 },
        outcome: 'The screen is split into three reviewable pieces. One of them hides a real bug.',
      },
      {
        id: 'merge',
        label: 'Merge it, the tests are green',
        cost: 'trust in green',
        effects: { budget: 10, quality: -10, morale: -4 },
        outcome: 'It ships. Three days later someone finds a permission check that never ran.',
      },
      {
        id: 'close',
        label: 'Close it without a comment',
        cost: 'silence',
        effects: { morale: -8, budget: -4 },
        outcome: 'The author learns nothing and stops asking. The settings screen restarts from zero.',
      },
    ],
  },
  {
    id: 'small-thing',
    act: 3,
    title: 'One small thing',
    body: 'The client asks for "one small thing" before launch. It is not small: it needs a permission model nobody has built.',
    choices: [
      {
        id: 'trade',
        label: 'Trade: drop an item or move the date, their choice',
        cost: 'one conversation',
        effects: { morale: 10, quality: 4, budget: -4 },
        outcome: 'They drop the item. The trade is now visible in writing, not discovered in week three.',
      },
      {
        id: 'absorb',
        label: 'Say yes and absorb it into the plan',
        cost: 'hidden debt',
        effects: { budget: 6, quality: -8, morale: -4 },
        outcome: 'The plan says yes. The calendar says no. The team pays the difference.',
      },
      {
        id: 'refuse',
        label: 'Say no, with no alternative',
        cost: 'a closed door',
        effects: { morale: -10, quality: -4 },
        outcome: 'The item is gone and so is some of the goodwill. They stop asking early.',
      },
    ],
  },
];

const W2: SprintWeek['bank'] = [
  {
    id: 'dependency',
    act: 1,
    title: 'The dependency slips',
    body: 'The payment provider says its sandbox will be three days late. The launch plan assumes it works today.',
    choices: [
      {
        id: 'tell',
        label: 'Tell the client today, with two options',
        cost: 'a hard call',
        effects: { morale: 10, quality: 2, budget: -4 },
        outcome: 'They pick the safer date. Nobody is surprised on launch day.',
      },
      {
        id: 'wait',
        label: 'Wait until you know more',
        cost: 'quiet',
        effects: { morale: -8, budget: -4 },
        outcome: 'Two days pass. The team plans against a date everyone now privately doubts.',
      },
      {
        id: 'drop',
        label: 'Quietly drop a feature to protect the date',
        cost: 'a surprise',
        effects: { morale: -10, quality: -4 },
        outcome: 'The date holds. The client finds out from the demo, not from you.',
      },
    ],
  },
  {
    id: 'logout-bug',
    act: 2,
    title: 'The random logout',
    body: 'Review finds a bug that logs users out at random. It is rare, and the cause is not obvious.',
    choices: [
      {
        id: 'block',
        label: 'Block the release, fix it and add a test',
        cost: 'two days',
        effects: { quality: 12, budget: -8, morale: 4 },
        outcome: 'The cause is a stale token. The test now fails every time the bug comes back.',
      },
      {
        id: 'ship-hotfix',
        label: 'Ship it and hotfix after launch',
        cost: 'a public bug',
        effects: { budget: 8, quality: -12, morale: -6 },
        outcome: 'Launch day includes a support queue and a fix nobody can verify in production.',
      },
      {
        id: 'disable',
        label: 'Disable the feature and say nothing',
        cost: 'silence',
        effects: { quality: -4, morale: -8 },
        outcome: 'The bug is hidden, the feature is gone, and the team learns to hide things too.',
      },
    ],
  },
  {
    id: 'argument',
    act: 3,
    title: 'Two engineers, one argument',
    body: 'Two engineers disagree about the data model. The meeting has repeated the same two positions for forty minutes.',
    choices: [
      {
        id: 'write',
        label: 'Ask each to write the trade-off, then decide on criteria',
        cost: 'one page each',
        effects: { morale: 6, budget: 4, quality: 4 },
        outcome: 'The decision takes fifteen minutes once the criteria are on paper.',
      },
      {
        id: 'decide',
        label: 'Decide yourself and move on',
        cost: 'speed',
        effects: { budget: 10, morale: -6 },
        outcome: 'The team moves. One engineer stops raising concerns in meetings.',
      },
      {
        id: 'discuss',
        label: 'Let them keep talking',
        cost: 'the afternoon',
        effects: { budget: -10 },
        outcome: 'The argument ends where it started, minus an afternoon of build time.',
      },
    ],
  },
];

const W3: SprintWeek['bank'] = [
  {
    id: 'demo',
    act: 1,
    title: 'The demo is tomorrow',
    body: 'The demo is tomorrow morning. The key flow still fails about one time in five, and nobody knows why.',
    choices: [
      {
        id: 'rehearse',
        label: 'Rehearse the exact flow, fix what breaks',
        cost: 'the afternoon',
        effects: { quality: 10, budget: -4, morale: 4 },
        outcome: 'The failure is a race in the loading state. You find it by doing the demo twice.',
      },
      {
        id: 'happy',
        label: 'Rehearse the happy path only',
        cost: 'hope',
        effects: { budget: 4, quality: -8, morale: -4 },
        outcome: 'The demo works until someone clicks the second item. Then the room goes quiet.',
      },
      {
        id: 'cancel',
        label: 'Cancel the demo',
        cost: 'a signal',
        effects: { morale: -10, budget: -6 },
        outcome: 'The team gets a day back and the client starts asking what else is not ready.',
      },
    ],
  },
  {
    id: 'exhausted',
    act: 2,
    title: 'The exhausted teammate',
    body: 'A teammate has worked three late nights and asks to stop for the day. Two items are still open.',
    choices: [
      {
        id: 'cut',
        label: 'Cut today\'s scope and protect the team',
        cost: 'two items',
        effects: { morale: 12, budget: -6, quality: 4 },
        outcome: 'Two items move to post-launch. The person who would have quit stays.',
      },
      {
        id: 'push',
        label: 'Push through the night',
        cost: 'a person',
        effects: { budget: 8, quality: -10, morale: -8 },
        outcome: 'Both items land. One of them is wrong, and the reviewer is too tired to notice.',
      },
      {
        id: 'later',
        label: 'Ask them to rest after launch',
        cost: 'a promise',
        effects: { morale: -10, budget: 2 },
        outcome: 'They finish the items. The promise is the fourth one made this month.',
      },
    ],
  },
  {
    id: 'launch-day',
    act: 3,
    title: 'Launch day, errors up 2%',
    body: 'The release is live. Error monitoring shows a 2% increase, mostly one endpoint. It could be noise.',
    choices: [
      {
        id: 'rollback',
        label: 'Roll back, tell everyone, investigate',
        cost: 'an hour',
        effects: { morale: 10, quality: 8, budget: -6 },
        outcome: 'It was a bad migration. Rolling back takes ten minutes; the postmortem takes an hour.',
      },
      {
        id: 'watch',
        label: 'Watch it for an hour before deciding',
        cost: 'an hour',
        effects: { budget: 4, quality: -6 },
        outcome: 'The errors keep climbing while you watch. The rollback happens later, and worse.',
      },
      {
        id: 'ignore',
        label: 'Ignore it, 2% is within noise',
        cost: 'a gamble',
        effects: { quality: -10, morale: -8 },
        outcome: 'By evening the endpoint is timing out for everyone. The graph was the warning.',
      },
    ],
  },
];

export const RELEASE_COPY: ReleaseCopy = {
  key: 'release-week',
  title: 'Release Week',
  tagline: 'Three weeks, one date, four numbers',
  summary:
    'You own a release with a fixed date. Nine decisions across three weeks: what to build, what to cut, what to tell the client. Time and trust only get cheaper if you spend them early.',
  meta: '3 weeks, 9 decisions',
  minutes: 20,
  stats: [
    { key: 'budget', label: 'Time', max: 100, danger: 25 },
    { key: 'morale', label: 'Trust', max: 100, danger: 30 },
    { key: 'users', label: 'Early testers', max: 100, danger: 10 },
    { key: 'quality', label: 'Quality', max: 100, danger: 35 },
  ],
  weeks: [
    { id: 'kickoff', title: 'Week 1: Kickoff', tagline: 'The date is fixed. The scope is not.', bank: W1, draw: [1, 1, 1] },
    { id: 'build', title: 'Week 2: Build', tagline: 'The plan meets reality.', bank: W2, draw: [1, 1, 1] },
    { id: 'launch', title: 'Week 3: Launch', tagline: 'Everything you postponed arrives at once.', bank: W3, draw: [1, 1, 1] },
  ],
  endings: {
    clean: {
      title: 'Shipped without drama',
      body: 'The date held, the team is intact, and the launch story is boring. That was the goal.',
      insight:
        'The decisions that mattered were the ones that traded scope early and told people the truth while there was still time to act.',
      takeaway: 'A calm launch is built in the first week, not the last.',
    },
    bruised: {
      title: 'Shipped, with a bill',
      body: 'It went out. Trust, quality or time took a hit that will be paid next quarter.',
      insight:
        'Each shortcut looked small at the time. Together they made a release nobody wants to repeat.',
      takeaway: 'A date you hit by spending trust is a date you pay for twice.',
    },
    burned: {
      title: 'The launch that cost the team',
      body: 'The release happened. The team or the product did not survive it intact.',
      insight:
        'The warning signs were visible days earlier: a scope nobody agreed to, a bug nobody owned, a person nobody rested.',
      takeaway: 'Reversibility first. Then the date.',
    },
  },
  advice: {
    trust: 'Trust is the constraint now. One honest update buys more than one more feature.',
    quality: 'Quality is low enough that the next bug lands in public. Spend a decision on it.',
    time: 'Time is the constraint. Every decision should either cut scope or buy a day.',
    testers: 'Almost nobody has tried it. The team is guessing at what users need.',
    calm: 'Nothing is on fire. That is the moment to fix the thing you keep postponing.',
  },
};

const { endings, advice, ...copy } = RELEASE_COPY;

function scoreOf(stats: Stats): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Math.min(100, stats.morale) * 0.3 +
          Math.min(100, stats.quality) * 0.3 +
          Math.max(0, Math.min(100, stats.budget)) * 0.2 +
          Math.min(100, stats.users) * 0.2,
      ),
    ),
  );
}

export const RELEASE_WEEK: SprintScenario = {
  ...copy,
  start: (): Stats => ({ budget: 80, morale: 65, users: 30, quality: 75 }),
  score: (stats) => scoreOf(stats),
  ending: (stats) => {
    const score = scoreOf(stats);
    const key =
      stats.morale < 30 || stats.quality < 30 || stats.budget <= 0
        ? ('burned' as const)
        : score >= 75 && stats.morale >= 50 && stats.quality >= 55
          ? ('clean' as const)
          : ('bruised' as const);
    return { key, ...endings[key] };
  },
  advice: (stats) => {
    if (stats.morale < 35) return advice.trust;
    if (stats.quality < 40) return advice.quality;
    if (stats.budget < 30) return advice.time;
    if (stats.users < 40) return advice.testers;
    return advice.calm;
  },
};

/** The six decisions the course game uses: two per week, from the same bank. */
const RELEASE_GAME_STEPS: string[][] = [
  ['big-pr', 'small-thing'],
  ['dependency', 'logout-bug'],
  ['exhausted', 'launch-day'],
];

/**
 * Builds the config for the `release-run` activity inside the People course. The course
 * player gets the text as config, so the lesson page's normal content localisation applies.
 */
export function releaseGameConfig(copy: ReleaseCopy = RELEASE_COPY) {
  const rounds = copy.weeks.map((week, i) => {
    const ids = RELEASE_GAME_STEPS[i] ?? [];
    return {
      title: week.title,
      tagline: week.tagline,
      steps: ids.map((id) => {
        const step = week.bank.find((s) => s.id === id);
        if (!step) throw new Error(`Release game decision missing: ${id}`);
        return {
          title: step.title,
          body: step.body,
          choices: step.choices.map((c) => ({
            id: c.id,
            label: c.label,
            cost: c.cost,
            effects: c.effects,
            outcome: c.outcome,
          })),
        };
      }),
    };
  });

  return {
    intro: copy.summary,
    stats: copy.stats,
    start: { budget: 80, morale: 65, users: 30, quality: 75 },
    rounds,
    endings: copy.endings,
  };
}
