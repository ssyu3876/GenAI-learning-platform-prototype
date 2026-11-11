// Local meta progression for Agent Dungeon. There is no account-level table for game
// progress yet, so this lives in localStorage: study points, unlocked characters and
// talents, best tier and achievements. It is deliberately small and versioned.

export interface CharacterDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  hp: number;
  gold: number;
  items: number;
  /** Extra damage on broken bosses. */
  power: number;
}

export interface TalentDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'rookie', name: 'Rookie', icon: '🧑‍💻', description: 'No bonus. Learn the dungeon first.', cost: 0, hp: 0, gold: 0, items: 0, power: 0 },
  { id: 'tank', name: 'Tank', icon: '🛡️', description: 'Max HP +30.', cost: 3, hp: 30, gold: 0, items: 0, power: 0 },
  { id: 'merchant', name: 'Merchant', icon: '💰', description: 'Start with +40 gold.', cost: 3, hp: 0, gold: 40, items: 0, power: 0 },
  { id: 'scholar', name: 'Scholar', icon: '🎓', description: 'Start with an extra item.', cost: 4, hp: 0, gold: 0, items: 1, power: 0 },
  { id: 'duelist', name: 'Duelist', icon: '⚔️', description: 'Broken bosses take +1 damage.', cost: 5, hp: 0, gold: 0, items: 0, power: 1 },
];

export const TALENTS: TalentDef[] = [
  { id: 'hp20', name: 'Bigger Heart', icon: '❤️', description: 'Max HP +20.', cost: 2 },
  { id: 'gold25', name: 'Pocket Money', icon: '🪙', description: 'Start with +25 gold.', cost: 2 },
  { id: 'heal', name: 'First Aid', icon: '🩹', description: 'Start with a Heal Card.', cost: 2 },
  { id: 'scan', name: 'Scanner', icon: '🔍', description: 'Start with a Scan Card.', cost: 2 },
  { id: 'time10', name: 'Extra Minute', icon: '⏱️', description: 'Boss timers +10 seconds.', cost: 3 },
  { id: 'discount', name: 'Haggler', icon: '🏷️', description: 'Shop prices -20%.', cost: 3 },
  { id: 'revive', name: 'One More Try', icon: '🕯️', description: 'Survive one fatal hit with 20 HP.', cost: 4 },
  { id: 'power', name: 'Sharp Edge', icon: '🗡️', description: 'Broken bosses take +1 damage.', cost: 3 },
  { id: 'gold50', name: 'Treasure Sense', icon: '💎', description: 'Gold rewards +50%.', cost: 4 },
  { id: 'items2', name: 'Prepared', icon: '🎒', description: 'Start with 2 random items.', cost: 4 },
];

export interface DungeonMeta {
  points: number;
  unlockedChars: string[];
  unlockedTalents: string[];
  character: string;
  talents: string[];
  bestTier: number;
  achievements: string[];
  runs: number;
}

const KEY = 'sprout.agent-dungeon.meta.v1';

export const ACHIEVEMENTS = [
  { id: 'flawless', name: 'Untouchable', description: 'Clear a layer without taking damage.' },
  { id: 'streak10', name: 'On Fire', description: 'Answer 10 questions correctly in a row.' },
  { id: 'minimalist', name: 'Light Packer', description: 'Win holding at most one item.' },
];

export function defaultMeta(): DungeonMeta {
  return {
    points: 0,
    unlockedChars: ['rookie'],
    unlockedTalents: [],
    character: 'rookie',
    talents: [],
    bestTier: 1,
    achievements: [],
    runs: 0,
  };
}

export function loadMeta(): DungeonMeta {
  if (typeof window === 'undefined') return defaultMeta();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as Partial<DungeonMeta>;
    const base = defaultMeta();
    return {
      ...base,
      ...parsed,
      unlockedChars: Array.from(new Set([...(parsed.unlockedChars ?? []), 'rookie'])),
      unlockedTalents: parsed.unlockedTalents ?? [],
      talents: (parsed.talents ?? []).filter((id) => (parsed.unlockedTalents ?? []).includes(id)),
      achievements: parsed.achievements ?? [],
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: DungeonMeta) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Private mode or quota: progress simply does not persist.
  }
}

/** Deterministic 0..1 generator for the daily/weekly challenge. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeed(date = new Date()) {
  return Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
}

export function weeklySeed(date = new Date()) {
  const first = new Date(date.getFullYear(), 0, 1);
  const week = Math.floor((date.getTime() - first.getTime()) / (7 * 86400000));
  return date.getFullYear() * 100 + week;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export interface RunScoreInput {
  layers: number;
  correct: number;
  wrong: number;
  gold: number;
  tier: number;
  victory: boolean;
  flawlessLayers: number;
}

/** Score rewards accuracy and depth, not just farming gold. */
export function runScore(input: RunScoreInput): number {
  const base =
    input.layers * 120 +
    input.correct * 12 -
    input.wrong * 8 +
    Math.round(input.gold / 2) +
    (input.victory ? 200 : 0) +
    input.flawlessLayers * 40;
  const multiplier = 1 + (input.tier - 1) * 0.15;
  return Math.max(0, Math.round(base * multiplier));
}

/** Study points are deliberately slow: one good run should buy a talent. */
export function studyPoints(score: number, victory: boolean, tier: number): number {
  return Math.max(1, Math.floor(score / 140) + (victory ? 1 : 0) + Math.floor((tier - 1) / 2));
}

/** One modifier per layer; the tier adds another layer of pressure. */
export const MODIFIERS = [
  { id: 'tight', name: 'Tight Clock', icon: '⏱️', description: 'Boss timer -5 seconds.' },
  { id: 'heavy', name: 'Heavy Blow', icon: '💥', description: 'Wrong answers deal double damage.' },
  { id: 'thin', name: 'Thin Pack', icon: '🎒', description: 'You can hold at most 2 items.' },
  { id: 'pricey', name: 'Pricey', icon: '💰', description: 'Shop prices +30%.' },
];

export const TIER_PRESSURE = [
  'No extra pressure.',
  'Max HP -10, boss timer -2s.',
  'Max HP -20, boss timer -4s.',
  'Max HP -30, boss timer -6s, wrong hits +3.',
  'Max HP -40, boss timer -8s, wrong hits +5.',
];
