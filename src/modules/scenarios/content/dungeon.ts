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
  /** Small label above the title on the dungeon menu. */
  eyebrow: string;
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
  studyPoints: string;
  points: string;
  bossLocked: string;
  elite: string;
  eliteDrop: string;
  emptyShop: string;
  hpFull: string;
  itemUsed: string;
  /** Shown when the backpack is at its cap, so a disabled Buy button has a reason. */
  bagFull: string;
  /** The layer-change transition. */
  descending: string;
  questionNumber: string;
  charactersSection: string;
  talentsSection: string;
  tierSection: string;
  modeSection: string;
  volumeLabel: string;
  metaLine: string;
  scoreLabel: string;
  streakBestLabel: string;
  flawlessLabel: string;
  achievementLabel: string;
  /** What happened to the run once the server was told about it. */
  saveSaving: string;
  saveOk: string;
  saveFailed: string;
  modes: Record<'free' | 'daily' | 'weekly', string>;
  /** Display copy for the meta definitions, which keep their English defaults in code. */
  characters: Record<string, DungeonVocab>;
  talents: Record<string, DungeonVocab>;
  modifiers: Record<string, DungeonVocab>;
  achievements: Record<string, DungeonVocab>;
  /** One line per tier, index 0 = tier 1. */
  tierPressure: string[];
}

export interface DungeonVocab {
  name: string;
  description: string;
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
    eyebrow: 'Roguelike quiz',
    tagline: 'Three layers, one question at a time.',
    summary:
      'A roguelike quiz: explore a 4x4 dungeon, fight monsters by answering questions, break each boss’s confidence, then spend the gold on buffs and items.',
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
    studyPoints: 'Study points',
    points: 'points',
    bossLocked: 'The boss seals the room until it falls.',
    elite: 'Elite',
    eliteDrop: 'Elite drop',
    emptyShop: 'Nothing left to buy.',
    hpFull: 'HP is already full.',
    itemUsed: 'Item used.',
    bagFull: 'Your backpack is full.',
    descending: 'Going deeper',
    questionNumber: 'Question',
    charactersSection: 'Characters',
    talentsSection: 'Talents (max 2)',
    tierSection: 'Tier',
    modeSection: 'Mode',
    volumeLabel: 'Volume',
    metaLine: '3 layers · 3 bosses',
    scoreLabel: 'Score',
    streakBestLabel: 'Best streak',
    flawlessLabel: 'Flawless layers',
    achievementLabel: 'Achievement',
    saveSaving: 'Saving this run…',
    saveOk: 'Run saved. Badges will update.',
    saveFailed: 'Could not save this run. Badges may not update.',
    modes: { free: 'Free', daily: 'Daily', weekly: 'Weekly' },
    characters: {
      rookie: { name: 'Rookie', description: 'No bonus. Learn the dungeon first.' },
      tank: { name: 'Tank', description: 'Max HP +30.' },
      merchant: { name: 'Merchant', description: 'Start with +40 gold.' },
      scholar: { name: 'Scholar', description: 'Start with an extra item.' },
      duelist: { name: 'Duelist', description: 'Broken bosses take +1 damage.' },
    },
    talents: {
      hp20: { name: 'Bigger Heart', description: 'Max HP +20.' },
      gold25: { name: 'Pocket Money', description: 'Start with +25 gold.' },
      heal: { name: 'First Aid', description: 'Start with a Heal Card.' },
      scan: { name: 'Scanner', description: 'Start with a Scan Card.' },
      time10: { name: 'Extra Minute', description: 'Boss timers +10 seconds.' },
      discount: { name: 'Haggler', description: 'Shop prices -20%.' },
      revive: { name: 'One More Try', description: 'Survive one fatal hit with 20 HP.' },
      power: { name: 'Sharp Edge', description: 'Broken bosses take +1 damage.' },
      gold50: { name: 'Treasure Sense', description: 'Gold rewards +50%.' },
      items2: { name: 'Prepared', description: 'Start with 2 random items.' },
    },
    modifiers: {
      tight: { name: 'Tight Clock', description: 'Boss timer -5 seconds.' },
      heavy: { name: 'Heavy Blow', description: 'Wrong answers deal double damage.' },
      thin: { name: 'Thin Pack', description: 'You can hold at most 2 items.' },
      pricey: { name: 'Pricey', description: 'Shop prices +30%.' },
    },
    achievements: {
      flawless: { name: 'Untouchable', description: 'Clear a layer without taking damage.' },
      streak10: { name: 'On Fire', description: 'Answer 10 questions correctly in a row.' },
      minimalist: { name: 'Light Packer', description: 'Win holding at most one item.' },
    },
    tierPressure: [
      'No extra pressure.',
      'Max HP -10, boss timer -2s.',
      'Max HP -20, boss timer -4s.',
      'Max HP -30, boss timer -6s, wrong hits +3.',
      'Max HP -40, boss timer -8s, wrong hits +5.',
    ],
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
    { id: 'revive', name: 'Undying', icon: '🕯️', description: 'Survive one fatal hit and return with 30 HP.' },
    { id: 'time', name: 'Time Bank', icon: '⏱️', description: 'Boss timers are 10 seconds longer.' },
    { id: 'crit', name: 'Deep Cut', icon: '🗡️', description: 'Broken bosses and elites take +1 damage.' },
    { id: 'tough2', name: 'Iron Body', icon: '🦾', description: 'Max HP +40 and heal to full.' },
    { id: 'leech2', name: 'Blood Pact', icon: '🧛', description: 'Heal 10 HP on every correct answer.' },
    { id: 'armor2', name: 'Hardened', icon: '🪨', description: 'Wrong answers deal 25% damage.' },
    { id: 'gold2', name: 'Midas Touch', icon: '🪙', description: 'Gold rewards +100%.' },
    { id: 'time2', name: 'Long Night', icon: '🕰️', description: 'Boss timers are 15 seconds longer.' },
    { id: 'crit2', name: 'Executioner', icon: '⚔️', description: 'Broken bosses and elites take +2 damage.' },
    { id: 'precision2', name: 'Weak Point', icon: '🎯', description: 'Elite and boss answers deal +2 damage.' },
    { id: 'revive2', name: 'Second Life', icon: '✨', description: 'Survive one more fatal hit with 30 HP.' },
    { id: 'discount', name: 'Merchant Friend', icon: '🏷️', description: 'Shop prices are 30% lower.' },
    { id: 'pack2', name: 'Deep Pockets', icon: '🎒', description: 'Gain 3 random items now.' },
    { id: 'berserk', name: 'Last Stand', icon: '🔥', description: 'Deal +2 damage while below 30% HP.' },
  ],
  items: [
    { id: 'heal', name: 'Heal Card', icon: '❤️', description: 'Heal 30 HP.', price: [20, 25, 32] },
    { id: 'eliminate', name: 'Scan Card', icon: '🔍', description: 'Remove two wrong answers.', price: [18, 22, 28] },
    { id: 'triple', name: 'Triple Strike', icon: '⚔️', description: 'Next correct answer deals 3 damage.', price: [32, 40, 50] },
    { id: 'shield', name: 'Barrier', icon: '🛡️', description: 'Block the next damage you would take.', price: [22, 28, 36] },
    { id: 'hourglass', name: 'Hourglass', icon: '⏳', description: 'Add 15 seconds to the boss timer.', price: [16, 20, 26] },
    { id: 'bomb', name: 'Confidence Bomb', icon: '💣', description: 'Remove 1 confidence point, or 2 HP if already broken.', price: [30, 38, 48] },
    { id: 'gold', name: 'Gold Pouch', icon: '💰', description: 'Gain 40 gold.', price: [24, 30, 38] },
    { id: 'reroll', name: 'New Angle', icon: '🔄', description: 'Replace the current question with a new one.', price: [20, 26, 34] },
    { id: 'freeze', name: 'Freeze', icon: '🧊', description: 'Add 30 seconds to the boss timer.', price: [18, 24, 30] },
    { id: 'ward', name: 'Ward', icon: '🔮', description: 'Block the next damage you would take.', price: [26, 32, 40] },
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
    {
      id: 'q19',
      difficulty: 'easy',
      category: 'Basics',
      question: 'What is a database index for?',
      options: ['Making writes faster', 'Speeding up lookups at the cost of writes and space', 'Storing backups', 'Encrypting rows'],
      answer: 1,
      explain: 'An index is a lookup structure; it speeds reads and adds work to writes.',
    },
    {
      id: 'q20',
      difficulty: 'easy',
      category: 'Basics',
      question: 'What does a test assertion do?',
      options: ['Runs the code', 'States what must be true and fails when it is not', 'Formats the output', 'Deploys the app'],
      answer: 1,
      explain: 'An assertion is the part of a test that can fail on purpose.',
    },
    {
      id: 'q21',
      difficulty: 'normal',
      category: 'Basics',
      question: 'What is the smallest safe change?',
      options: ['One that touches as little as possible and can be reviewed alone', 'One that rewrites the module', 'One that fixes several bugs together', 'One without tests'],
      answer: 0,
      explain: 'Small changes are easier to review, test and roll back.',
    },
    {
      id: 'q22',
      difficulty: 'normal',
      category: 'Basics',
      question: 'Why write down a decision?',
      options: ['To make the document longer', 'So future teammates know what was chosen and why', 'To avoid testing', 'To replace code review'],
      answer: 1,
      explain: 'A short decision record saves the next person from re-litigating it.',
    },
    {
      id: 'q23',
      difficulty: 'easy',
      category: 'People',
      question: 'What makes review feedback useful?',
      options: ['It points at the line and names the failure', 'It is long', 'It is funny', 'It comes from a manager'],
      answer: 0,
      explain: 'Specific, about the code, and actionable.',
    },
    {
      id: 'q24',
      difficulty: 'normal',
      category: 'People',
      question: 'What belongs in a STAR answer?',
      options: ['Situation, task, action, result', 'Story, theory, argument, reply', 'Summary, topic, answer, recap', 'Skill, tool, ambition, role'],
      answer: 0,
      explain: 'Four boxes: where you were, what you owned, what you did, what changed.',
    },
    {
      id: 'q25',
      difficulty: 'normal',
      category: 'People',
      question: 'How do you say no to a request without burning trust?',
      options: ['Name the constraint once and offer two real options', 'Apologise for ten minutes', 'Say yes and miss the date', 'Ignore the message'],
      answer: 0,
      explain: 'A no with a date and a choice is a plan, not a rejection.',
    },
    {
      id: 'q26',
      difficulty: 'hard',
      category: 'People',
      question: 'A client asks for one more feature two days before launch. What is the best response?',
      options: ['Ship it Tuesday, or swap it for another item and keep Friday', 'Squeeze it in and hope', 'Say it is impossible', 'Ask the AI to do it'],
      answer: 0,
      explain: 'Trade scope or date; keep the commitment honest.',
    },
    {
      id: 'q27',
      difficulty: 'normal',
      category: 'Agents',
      question: 'When should you ask an agent for a plan first?',
      options: ['When the change touches several files or is ambiguous', 'Never', 'Only for CSS', 'After merging'],
      answer: 0,
      explain: 'A plan is cheap to review before twenty edits exist.',
    },
    {
      id: 'q28',
      difficulty: 'normal',
      category: 'Agents',
      question: 'What should an AI-assisted pull request disclose?',
      options: ['What the agent wrote, what you changed, what you checked', 'Nothing', 'Only the prompt', 'The model version only'],
      answer: 0,
      explain: 'Disclosure is a map of the diff, not a confession.',
    },
    {
      id: 'q29',
      difficulty: 'hard',
      category: 'Agents',
      question: 'The agent added a dependency you did not ask for. What do you do?',
      options: ['Question it, check the license and size, and remove it if unnecessary', 'Merge it', 'Ignore it', 'Add two more'],
      answer: 0,
      explain: 'Every dependency is a supply-chain and maintenance decision.',
    },
    {
      id: 'q30',
      difficulty: 'hard',
      category: 'Agents',
      question: 'What is the safest way to let an agent run commands?',
      options: ['Give it a narrow, sandboxed scope and review the commands', 'Give it production credentials', 'Disable logging', 'Let it run as admin'],
      answer: 0,
      explain: 'Least privilege and a reviewable trail make agent actions recoverable.',
    },
    {
      id: 'q31', difficulty: 'easy', category: 'Web',
      question: 'What does HTTP 500 mean?',
      options: ['Not found', 'Server error', 'Unauthorized', 'Redirect'],
      answer: 1, explain: '5xx means the server failed while handling the request.',
    },
    {
      id: 'q32', difficulty: 'normal', category: 'Git',
      question: 'What is the difference between merge and rebase?',
      options: ['Merge keeps history and a merge commit; rebase rewrites commits onto another base', 'They are the same', 'Rebase deletes history', 'Merge only works on main'],
      answer: 0, explain: 'Rebase produces a linear history but rewrites commit ids.',
    },
    {
      id: 'q33', difficulty: 'easy', category: 'Data',
      question: 'What is a primary key?',
      options: ['A unique identifier for a row', 'A password', 'A foreign table', 'An index on every column'],
      answer: 0, explain: 'The primary key uniquely identifies each row in a table.',
    },
    {
      id: 'q34', difficulty: 'normal', category: 'Data',
      question: 'What does a transaction guarantee?',
      options: ['All statements commit together or not at all', 'Faster queries', 'Automatic backups', 'No locks'],
      answer: 0, explain: 'Atomicity means a partial failure rolls the whole transaction back.',
    },
    {
      id: 'q35', difficulty: 'normal', category: 'Web',
      question: 'Which HTTP method should be idempotent?',
      options: ['POST', 'PUT', 'PATCH always', 'None'],
      answer: 1, explain: 'PUT replaces a resource, so repeating it has the same effect.',
    },
    {
      id: 'q36', difficulty: 'hard', category: 'Systems',
      question: 'What is cache invalidation?',
      options: ['Deleting the cache server', 'Removing or refreshing stale entries when data changes', 'Compressing responses', 'Encrypting the cache'],
      answer: 1, explain: 'A cache is only useful if stale entries are removed or refreshed.',
    },
    {
      id: 'q37', difficulty: 'hard', category: 'Data',
      question: 'What makes an index selective?',
      options: ['Many duplicate values', 'Few rows share the indexed value', 'It covers every column', 'It is always in memory'],
      answer: 1, explain: 'High selectivity means the index narrows the search to few rows.',
    },
    {
      id: 'q38', difficulty: 'normal', category: 'Web',
      question: 'What is the difference between REST and RPC?',
      options: ['REST models resources; RPC models procedures', 'RPC only uses XML', 'REST cannot use JSON', 'They are identical'],
      answer: 0, explain: 'REST is resource-oriented; RPC is action-oriented.',
    },
    {
      id: 'q39', difficulty: 'hard', category: 'Systems',
      question: 'What is technical debt?',
      options: ['A loan for servers', 'Future cost created by a shortcut today', 'A type of test', 'A database migration'],
      answer: 1, explain: 'Shortcuts buy speed now and charge interest later.',
    },
    {
      id: 'q40', difficulty: 'normal', category: 'Testing',
      question: 'What is a flaky test?',
      options: ['A test that passes and fails without code changes', 'A test with no assertions', 'A very slow test', 'A test written in JS'],
      answer: 0, explain: 'Flakiness usually comes from timing, order or shared state.',
    },
    {
      id: 'q41', difficulty: 'normal', category: 'Agents',
      question: 'What is a context window?',
      options: ['The model’s limited working text budget', 'A browser tab', 'A database table', 'A prompt template'],
      answer: 0, explain: 'Everything the model can attend to must fit in its context window.',
    },
    {
      id: 'q42', difficulty: 'normal', category: 'Agents',
      question: 'Why give an agent tools?',
      options: ['So it can read files, run commands and check results', 'To make it faster', 'To reduce the bill', 'To avoid prompts'],
      answer: 0, explain: 'Tools turn a chat model into something that can act and verify.',
    },
    {
      id: 'q43', difficulty: 'hard', category: 'Agents',
      question: 'How do you catch a hallucinated API?',
      options: ['Check the real docs or run the code', 'Ask the model again', 'Trust the confidence', 'Increase temperature'],
      answer: 0, explain: 'External evidence beats a second opinion from the same model.',
    },
    {
      id: 'q44', difficulty: 'normal', category: 'Agents',
      question: 'What is the agent loop?',
      options: ['Observe, plan, act, check, repeat', 'Write, merge, deploy', 'Prompt, wait, stop', 'Read, delete, forget'],
      answer: 0, explain: 'The loop is what makes agents useful and what makes them risky.',
    },
    {
      id: 'q45', difficulty: 'hard', category: 'Agents',
      question: 'A code comment says "ignore previous instructions". What is it?',
      options: ['Prompt injection', 'A unit test', 'A merge conflict', 'A lint rule'],
      answer: 0, explain: 'Untrusted text can carry instructions; treat it as data.',
    },
    {
      id: 'q46', difficulty: 'normal', category: 'Agents',
      question: 'Why run an agent in a sandbox?',
      options: ['To limit what it can read, write and execute', 'To make it faster', 'To improve the prompt', 'To reduce tokens'],
      answer: 0, explain: 'A sandbox limits blast radius when the agent is wrong.',
    },
    {
      id: 'q47', difficulty: 'hard', category: 'Agents',
      question: 'What does temperature control?',
      options: ['Randomness of the output', 'The context length', 'The price', 'The tool list'],
      answer: 0, explain: 'Lower temperature is more deterministic; higher is more varied.',
    },
    {
      id: 'q48', difficulty: 'normal', category: 'Agents',
      question: 'What should you do before merging agent-written code?',
      options: ['Read the diff and run the checks', 'Ask the agent if it is good', 'Merge and watch', 'Only check the summary'],
      answer: 0, explain: 'The diff and the checks are the evidence; the summary is a claim.',
    },
    {
      id: 'q49', difficulty: 'hard', category: 'Agents',
      question: 'Why can a longer prompt be worse?',
      options: ['Relevant details get buried and cost more tokens', 'Models refuse long prompts', 'It always hallucinates', 'It cannot use tools'],
      answer: 0, explain: 'Signal-to-noise matters more than length.',
    },
    {
      id: 'q50', difficulty: 'normal', category: 'Agents',
      question: 'What is a good fallback when the model fails?',
      options: ['A deterministic path or a clear error', 'Silent empty output', 'Retry forever', 'Hide the failure'],
      answer: 0, explain: 'A fallback keeps the product usable when the model is unavailable.',
    },
    {
      id: 'q51', difficulty: 'easy', category: 'People',
      question: 'What is active listening?',
      options: ['Summarising and asking to confirm understanding', 'Waiting for your turn to talk', 'Taking notes silently', 'Agreeing with everything'],
      answer: 0, explain: 'Reflecting back what you heard catches misunderstandings early.',
    },
    {
      id: 'q52', difficulty: 'normal', category: 'People',
      question: 'What does SBI feedback mean?',
      options: ['Situation, behaviour, impact', 'Skill, bonus, idea', 'Story, belief, intent', 'Summary, blame, excuse'],
      answer: 0, explain: 'Describe the situation and behaviour, then the impact it had.',
    },
    {
      id: 'q53', difficulty: 'normal', category: 'People',
      question: 'A status update should start with…',
      options: ['The impact on the reader', 'The technical cause', 'The ticket number', 'The team history'],
      answer: 0, explain: 'Impact first buys attention for the cause.',
    },
    {
      id: 'q54', difficulty: 'normal', category: 'People',
      question: 'How do you de-escalate a tense review thread?',
      options: ['Move to a call, restate the goal, separate facts from tone', 'Reply faster and louder', 'Tag a manager', 'Ignore it'],
      answer: 0, explain: 'Slow the channel and re-anchor on the shared goal.',
    },
    {
      id: 'q55', difficulty: 'hard', category: 'People',
      question: 'What makes a no credible?',
      options: ['One constraint and two real options', 'A long apology', 'A maybe', 'Silence'],
      answer: 0, explain: 'A constraint plus alternatives is a plan, not a rejection.',
    },
    {
      id: 'q56', difficulty: 'normal', category: 'People',
      question: 'What makes a STAR result strong?',
      options: ['A checkable change, date or number', 'A feeling', 'A longer story', 'A team compliment'],
      answer: 0, explain: 'Evidence beats adjectives.',
    },
    {
      id: 'q57', difficulty: 'easy', category: 'People',
      question: 'What should a review comment target?',
      options: ['The code and its behaviour', 'The author’s ability', 'The deadline', 'The manager'],
      answer: 0, explain: 'Comment on the diff, not the person.',
    },
    {
      id: 'q58', difficulty: 'hard', category: 'People',
      question: 'How do you communicate an uncertain estimate?',
      options: ['Give a range and the assumptions behind it', 'Give the smallest number', 'Refuse to estimate', 'Give a date without caveats'],
      answer: 0, explain: 'A range with assumptions is honest and actionable.',
    },
    {
      id: 'q59', difficulty: 'normal', category: 'People',
      question: 'What is a blameless retro?',
      options: ['Focus on systems and changes, not individuals', 'Never discuss failures', 'Only praise', 'Skip the actions'],
      answer: 0, explain: 'People share more when the discussion is about the system.',
    },
    {
      id: 'q60', difficulty: 'hard', category: 'People',
      question: 'What makes delegation work?',
      options: ['Clear outcome, constraints, checkpoints and authority', 'Handing over and disappearing', 'Doing it yourself', 'A deadline only'],
      answer: 0, explain: 'Delegation is a contract: outcome, bounds, check-ins and decision rights.',
    },
  ],
};
