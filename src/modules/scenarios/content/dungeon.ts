// Agent Dungeon: a small roguelike quiz run. Three layers, 4x4 maps, rooms, battles and
// a boss that must be broken before it can be damaged. The original spec asked for a
// single-file HTML build; this version keeps the same loop but lives in the app as a
// scenario, so it shares the UI kit, i18n and routing instead of shipping a second app.

export type Difficulty = 'easy' | 'normal' | 'hard';
export type RoomType = 'start' | 'battle' | 'chest' | 'shop' | 'boss';

export interface DungeonQuestion {
  id: string;
  difficulty: Difficulty;
  category: string;
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  icon: string;
  hp: number;
  layers: number[];
  gold: number;
}

export interface BossDef {
  id: string;
  name: string;
  icon: string;
  confidence: number; // correct answers needed to break
  hp: number; // hits after the break
  seconds: number;
  color: string;
  lines: { intro: string; hit: string; broken: string; wrong: string; defeat: string };
}

export interface BuffDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: [number, number, number];
}

export interface DungeonLabels {
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  play: string;
  difficulty: string;
  easy: string;
  normal: string;
  hard: string;
  hp: string;
  gold: string;
  layer: string;
  boss: string;
  move: string;
  reachable: string;
  roomBattle: string;
  roomChest: string;
  roomShop: string;
  roomBoss: string;
  roomStart: string;
  roomCleared: string;
  fight: string;
  correct: string;
  wrong: string;
  explain: string;
  next: string;
  confidence: string;
  broken: string;
  attack: string;
  victory: string;
  gameOver: string;
  again: string;
  menu: string;
  chestTitle: string;
  chestBody: string;
  reroll: string;
  leave: string;
  shopTitle: string;
  buy: string;
  sold: string;
  noGold: string;
  buffTitle: string;
  buffBody: string;
  choose: string;
  backpack: string;
  use: string;
  heal: string;
  eliminate: string;
  triple: string;
  stats: string;
  accuracy: string;
  layerReached: string;
  totalGold: string;
  buffs: string;
  questions: string;
  time: string;
  bossLocked: string;
  elite: string;
  eliteDrop: string;
  emptyShop: string;
  hpFull: string;
  itemUsed: string;
  questionNumber: string;
}

export interface DungeonContent {
  key: string;
  labels: DungeonLabels;
  monsters: MonsterDef[];
  bosses: BossDef[];
  buffs: BuffDef[];
  items: ItemDef[];
  questions: DungeonQuestion[];
}

export const DUNGEON: DungeonContent = {
  key: 'agent-dungeon',
  labels: {
    title: 'Agent Dungeon',
    tagline: 'Three layers, one question at a time.',
    summary:
      'A roguelike quiz run: explore a 4x4 dungeon, fight monsters with questions, break the boss’s confidence, and spend gold on buffs and items. Three layers, three bosses.',
    meta: '3 layers · 3 bosses · about 10 minutes',
    play: 'Enter the dungeon',
    difficulty: 'Difficulty',
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    hp: 'HP',
    gold: 'Gold',
    layer: 'Layer',
    boss: 'Boss',
    move: 'Move to a connected room',
    reachable: 'You can move here',
    roomBattle: 'Monster',
    roomChest: 'Chest',
    roomShop: 'Shop',
    roomBoss: 'Boss',
    roomStart: 'Entrance',
    roomCleared: 'Cleared',
    fight: 'Fight',
    correct: 'Correct',
    wrong: 'Wrong',
    explain: 'Why',
    next: 'Next',
    confidence: 'Confidence',
    broken: 'Broken!',
    attack: 'Answer correctly to attack',
    victory: 'You cleared the dungeon.',
    gameOver: 'The dungeon wins this time.',
    again: 'Run again',
    menu: 'Back to menu',
    chestTitle: 'A chest',
    chestBody: 'Take the buff, or spend 20 gold to reroll.',
    reroll: 'Reroll (20 gold)',
    leave: 'Leave',
    shopTitle: 'The merchant',
    buy: 'Buy',
    sold: 'Sold',
    noGold: 'Not enough gold',
    buffTitle: 'The boss drops a relic',
    buffBody: 'Choose one buff for the rest of the run.',
    choose: 'Choose',
    backpack: 'Items',
    use: 'Use',
    heal: 'Heal 30 HP',
    eliminate: 'Remove two wrong answers',
    triple: 'Triple damage on this answer',
    stats: 'Run summary',
    accuracy: 'Accuracy',
    layerReached: 'Layers cleared',
    totalGold: 'Gold earned',
    buffs: 'Buffs',
    questions: 'Questions',
    time: 'Time',
    bossLocked: 'The boss seals the room until it falls.',
    elite: 'Elite',
    eliteDrop: 'Elite drop',
    emptyShop: 'Nothing left to buy.',
    hpFull: 'HP is already full.',
    itemUsed: 'Item used.',
    questionNumber: 'Question',
  },
  monsters: [
    { id: 'slime', name: 'Slime', icon: '🟢', hp: 1, layers: [1], gold: 20 },
    { id: 'bat', name: 'Bat', icon: '🦇', hp: 1, layers: [1, 2], gold: 20 },
    { id: 'goblin', name: 'Goblin', icon: '👺', hp: 2, layers: [1, 2], gold: 40 },
    { id: 'spider', name: 'Spider', icon: '🕷️', hp: 2, layers: [1, 2, 3], gold: 40 },
    { id: 'skeleton', name: 'Skeleton', icon: '💀', hp: 2, layers: [2, 3], gold: 40 },
    { id: 'gargoyle', name: 'Gargoyle', icon: '🗿', hp: 3, layers: [2, 3], gold: 60 },
    { id: 'witch', name: 'Witch', icon: '🧙‍♀️', hp: 3, layers: [2, 3], gold: 60 },
    { id: 'flame', name: 'Flame', icon: '🔥', hp: 4, layers: [3], gold: 80 },
  ],
  bosses: [
    {
      id: 'doubao',
      name: 'Doubao',
      icon: '🫘',
      confidence: 2,
      hp: 2,
      seconds: 30,
      color: 'lilac',
      lines: {
        intro: 'I will win gently.',
        hit: 'Just probability noise.',
        broken: 'Wait, that should not happen.',
        wrong: 'See? I told you.',
        defeat: 'Fine, fine, you win.',
      },
    },
    {
      id: 'bigfish',
      name: 'Big Fish',
      icon: '🐟',
      confidence: 3,
      hp: 3,
      seconds: 25,
      color: 'sky',
      lines: {
        intro: 'Another little fish.',
        hit: 'I am not even trying.',
        broken: 'Hold on, I was not ready.',
        wrong: 'Hesitation is how you lose.',
        defeat: 'Hmph. Lucky.',
      },
    },
    {
      id: 'gpt',
      name: 'GPT',
      icon: '🤖',
      confidence: 4,
      hp: 4,
      seconds: 20,
      color: 'mint',
      lines: {
        intro: 'My accuracy is 99.97%.',
        hit: 'Inference noise.',
        broken: 'The reasoning chain cannot break.',
        wrong: 'That is not rational.',
        defeat: 'Confidence... zero.',
      },
    },
  ],
  buffs: [
    { id: 'tough', name: 'Tough Body', icon: '💪', description: 'Max HP +30 and heal to full.' },
    { id: 'leech', name: 'Leech', icon: '🩸', description: 'Heal 5 HP on every correct answer.' },
    { id: 'armor', name: 'Pressure Training', icon: '🛡️', description: 'Wrong answers deal half damage.' },
    { id: 'gold', name: 'Gold Digger', icon: '💰', description: 'Gold rewards +50%.' },
    { id: 'pack', name: 'Bigger Pack', icon: '🎒', description: 'Backpack +2 and two random items.' },
    { id: 'precision', name: 'Precision', icon: '🎯', description: 'Elite and boss answers deal +1 damage.' },
  ],
  items: [
    { id: 'heal', name: 'Heal Card', icon: '❤️', description: 'Heal 30 HP.', price: [20, 25, 32] },
    { id: 'eliminate', name: 'Scan Card', icon: '🔍', description: 'Remove two wrong answers.', price: [18, 22, 28] },
    { id: 'triple', name: 'Triple Strike', icon: '⚔️', description: 'Next correct answer deals 3 damage.', price: [32, 40, 50] },
  ],
  questions: [
    {
      id: 'q1',
      difficulty: 'easy',
      category: 'Web',
      question: 'What does HTTP 404 mean?',
      options: ['Server error', 'Resource not found', 'Request timed out', 'Permission denied'],
      answer: 1,
      explain: '404 Not Found means the server cannot find the requested resource.',
    },
    {
      id: 'q2',
      difficulty: 'easy',
      category: 'Git',
      question: 'What does a git commit do?',
      options: ['Uploads to the remote', 'Records a snapshot in local history', 'Deletes a branch', 'Merges main'],
      answer: 1,
      explain: 'A commit records a snapshot locally; pushing is a separate step.',
    },
    {
      id: 'q3',
      difficulty: 'easy',
      category: 'Web',
      question: 'What is an API?',
      options: ['A programming language', 'A contract for programs to talk to each other', 'A database', 'A CSS framework'],
      answer: 1,
      explain: 'An API defines how one program can request work or data from another.',
    },
    {
      id: 'q4',
      difficulty: 'easy',
      category: 'Web',
      question: 'What is CSS mainly for?',
      options: ['Storing data', 'Styling and layout', 'Handling payments', 'Compiling code'],
      answer: 1,
      explain: 'CSS controls presentation: colours, spacing, layout and responsive rules.',
    },
    {
      id: 'q5',
      difficulty: 'easy',
      category: 'Security',
      question: 'Which is a phishing red flag?',
      options: ['A colleague sends a calendar invite', 'An email asks you to confirm a password via a link', 'A deployment notice from your own CI', 'A README in a repo'],
      answer: 1,
      explain: 'Unexpected credential requests through links are the classic phishing pattern.',
    },
    {
      id: 'q6',
      difficulty: 'easy',
      category: 'Git',
      question: 'What is a pull request for?',
      options: ['Deleting code', 'Proposing changes and reviewing them before merge', 'Running tests locally', 'Installing packages'],
      answer: 1,
      explain: 'A pull request is a review surface: the diff, the discussion and the checks.',
    },
    {
      id: 'q7',
      difficulty: 'normal',
      category: 'Review',
      question: 'An agent says all tests pass. What do you check first?',
      options: ['The number of tests', 'Whether the tests cover the change', 'How confident the agent sounds', 'The commit message'],
      answer: 1,
      explain: 'Green tests only mean those tests passed; coverage of the change is the real question.',
    },
    {
      id: 'q8',
      difficulty: 'normal',
      category: 'Agents',
      question: 'What makes a brief good for an agent?',
      options: ['A long project history', 'The goal, constraints and a testable definition of done', 'A reminder to write clean code', 'Every file in the repo'],
      answer: 1,
      explain: 'The agent needs the destination, the rules and the finish line.',
    },
    {
      id: 'q9',
      difficulty: 'normal',
      category: 'Testing',
      question: 'What is a unit test for?',
      options: ['Checking one behaviour in isolation', 'Measuring code style', 'Replacing code review', 'Testing the network'],
      answer: 0,
      explain: 'A unit test isolates one behaviour so a failure points at a small cause.',
    },
    {
      id: 'q10',
      difficulty: 'normal',
      category: 'Security',
      question: 'How do you prevent SQL injection?',
      options: ['String concatenation with escaping', 'Parameterised queries', 'Hiding error messages', 'Using a longer password'],
      answer: 1,
      explain: 'Parameters keep data out of the query structure; escaping alone is fragile.',
    },
    {
      id: 'q11',
      difficulty: 'normal',
      category: 'JS',
      question: 'What does await do?',
      options: ['Blocks the whole browser', 'Pauses the async function until the promise settles', 'Cancels the promise', 'Runs code twice'],
      answer: 1,
      explain: 'await suspends the async function, not the event loop.',
    },
    {
      id: 'q12',
      difficulty: 'normal',
      category: 'Review',
      question: 'What is a must-fix review comment?',
      options: ['A naming preference', 'A security or data-loss problem', 'An extra blank line', 'A style opinion'],
      answer: 1,
      explain: 'Security and data loss block the merge; style is a nit.',
    },
    {
      id: 'q13',
      difficulty: 'hard',
      category: 'Agents',
      question: 'You asked for a button colour and the diff changes the API. What is it?',
      options: ['A helpful bonus', 'Scope creep: split it out and review it separately', 'A refactor to merge', 'A performance fix'],
      answer: 1,
      explain: 'Unrequested changes hide risk; review them on purpose, not by accident.',
    },
    {
      id: 'q14',
      difficulty: 'hard',
      category: 'Systems',
      question: 'What does idempotent mean?',
      options: ['Runs faster the second time', 'Repeating the operation has the same effect as running it once', 'Always returns 200', 'Cannot fail'],
      answer: 1,
      explain: 'Retries are safe when the operation is idempotent; that is why idempotency keys exist.',
    },
    {
      id: 'q15',
      difficulty: 'hard',
      category: 'Systems',
      question: 'What is a race condition?',
      options: ['A test that runs too fast', 'Two operations depend on timing and can interleave badly', 'A slow network', 'A CSS animation'],
      answer: 1,
      explain: 'The result depends on which operation wins; locks or ordering remove the race.',
    },
    {
      id: 'q16',
      difficulty: 'hard',
      category: 'Testing',
      question: 'High coverage means...',
      options: ['The code is correct', 'Lines ran during tests', 'The tests are meaningful', 'There are no bugs'],
      answer: 1,
      explain: 'Coverage counts executed lines, not whether the assertions are useful.',
    },
    {
      id: 'q17',
      difficulty: 'hard',
      category: 'Security',
      question: 'What is prompt injection?',
      options: ['A faster prompt', 'Untrusted text that tries to override the model’s instructions', 'A database index', 'A type of unit test'],
      answer: 1,
      explain: 'Retrieved or user text can contain instructions; treat it as data, never as policy.',
    },
    {
      id: 'q18',
      difficulty: 'hard',
      category: 'Ops',
      question: 'What is a rollback plan for?',
      options: ['Making deploys slower', 'Restoring a known-good state when a release goes wrong', 'Replacing tests', 'Deleting logs'],
      answer: 1,
      explain: 'A rollback plan is the cheapest incident response you can prepare before the incident.',
    },
  ],
};
