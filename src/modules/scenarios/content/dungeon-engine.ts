// Pure map/battle helpers for Agent Dungeon. No React, no database: the component owns the
// run state and calls these functions, so the map rules are testable on their own.

import type { BossDef, DungeonQuestion, MonsterDef, RoomType } from './dungeon';
import { seededRandom } from './dungeon-meta';

/** Any 0..1 generator. `Math.random` for a fresh run, a seeded one for the daily challenge. */
export type Rng = () => number;

export const DUNGEON_CONFIG = {
  hp: { easy: 120, normal: 100, hard: 80 } as const,
  gold: { easy: 40, normal: 30, hard: 20 } as const,
  monsterDamage: { easy: 10, normal: 15, hard: 20 } as const,
  eliteDamage: { easy: 12, normal: 17, hard: 22 } as const,
  bossDamage: { easy: 15, normal: 20, hard: 25 } as const,
  monsterGold: { easy: 20, normal: 30, hard: 40 } as const,
  bossGold: { easy: 45, normal: 65, hard: 95 } as const,
  eliteChance: [0.2, 0.35, 0.5] as const,
  rerollCost: 20,
  buffPrice: { easy: 60, normal: 75, hard: 90 } as const,
  maxItems: 8,
} as const;

export interface Room {
  id: string;
  pos: [number, number];
  type: RoomType;
  connections: string[];
}

export interface DungeonMap {
  id: string;
  gridSize: 4;
  rooms: Room[];
  startRoomId: string;
  bossRoomId: string;
}

const DIRS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function randInt(n: number, rng: Rng): number {
  return Math.floor(rng() * n);
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1, rng);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function key(x: number, y: number) {
  return `${x},${y}`;
}

function neighbors(x: number, y: number, size: number): Array<[number, number]> {
  return DIRS.map(([dx, dy]) => [x + dx, y + dy] as [number, number]).filter(
    ([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size,
  );
}

function corners(size: number): Array<[number, number]> {
  return [
    [0, 0],
    [size - 1, 0],
    [0, size - 1],
    [size - 1, size - 1],
  ];
}

/** A random self-avoiding walk that stays on the grid. */
function walk(
  start: [number, number],
  length: number,
  used: Set<string>,
  size: number,
  rng: Rng,
): Array<[number, number]> {
  const path: Array<[number, number]> = [start];
  const seen = new Set(used).add(key(...start));
  let [x, y] = start;
  for (let i = 1; i < length; i += 1) {
    const options = neighbors(x, y, size).filter(([nx, ny]) => !seen.has(key(nx, ny)));
    if (!options.length) break;
    const [nx, ny] = options[randInt(options.length, rng)]!;
    path.push([nx, ny]);
    seen.add(key(nx, ny));
    x = nx;
    y = ny;
  }
  return path;
}

function buildTree(rng: Rng): Array<[number, number]> {
  const size = 4;
  const start = corners(size)[randInt(4, rng)]!;
  const main = walk(start, 4 + randInt(3, rng), new Set(), size, rng);
  if (main.length < 4) return [];
  const cells: Array<[number, number]> = [...main];
  const used = new Set(cells.map(([x, y]) => key(x, y)));

  const anchors = main.slice(1, -1);
  const branchCount = 1 + randInt(3, rng);
  for (let i = 0; i < branchCount; i += 1) {
    if (!anchors.length) break;
    const anchor = anchors[randInt(anchors.length, rng)]!;
    const branch = walk(anchor, 2 + randInt(2, rng), used, size, rng);
    for (const cell of branch.slice(1)) {
      if (used.has(key(...cell))) continue;
      cells.push(cell);
      used.add(key(...cell));
    }
    if (cells.length > 9) break;
  }
  return cells;
}

function buildMap(id: string, rng: Rng): DungeonMap | null {
  const cells = buildTree(rng);
  if (cells.length < 7 || cells.length > 9) return null;
  const byKey = new Map(cells.map(([x, y]) => [key(x, y), { x, y }]));
  const rooms: Room[] = cells.map(([x, y], i) => ({
    id: `R${i}`,
    pos: [x, y],
    type: 'battle',
    connections: [],
  }));

  // Connect only orthogonally adjacent selected cells. A tree input keeps this acyclic.
  for (const room of rooms) {
    for (const [dx, dy] of DIRS) {
      const other = byKey.get(key(room.pos[0] + dx, room.pos[1] + dy));
      if (!other) continue;
      const target = rooms.find((r) => r.pos[0] === other.x && r.pos[1] === other.y);
      if (!target || target.id === room.id) continue;
      if (!room.connections.includes(target.id)) room.connections.push(target.id);
      if (!target.connections.includes(room.id)) target.connections.push(room.id);
    }
  }

  const startRoom = rooms[0]!;
  startRoom.type = 'start';

  // BFS from start: distances and the farthest leaf for the boss.
  const dist = new Map<string, number>([[startRoom.id, 0]]);
  const queue = [startRoom.id];
  while (queue.length) {
    const current = queue.shift()!;
    const room = rooms.find((r) => r.id === current)!;
    for (const next of room.connections) {
      if (!dist.has(next)) {
        dist.set(next, (dist.get(current) ?? 0) + 1);
        queue.push(next);
      }
    }
  }
  if (dist.size !== rooms.length) return null;

  const leaves = rooms.filter((r) => r.connections.length === 1 && r.id !== startRoom.id);
  if (leaves.length < 3) return null;
  const boss =
    [...leaves].sort((a, b) => (dist.get(b.id) ?? 0) - (dist.get(a.id) ?? 0))[0] ?? leaves[0]!;
  boss.type = 'boss';

  const spare = shuffle(leaves.filter((r) => r.id !== boss.id), rng);
  if (!spare[0] || !spare[1]) return null;
  spare[0].type = 'chest';
  spare[1].type = 'shop';

  // Anything left is a battle room; 3-5 of them is the target shape.
  const battles = rooms.filter((r) => r.type === 'battle');
  if (battles.length < 3 || battles.length > 5) return null;

  // Hard constraints from the spec.
  if (startRoom.connections.length !== 1 || boss.connections.length !== 1) return null;
  if (rooms.some((r) => r.connections.length > 3 || r.connections.length === 0)) return null;
  if (!rooms.some((r) => r.connections.length === 3)) return null;

  return {
    id,
    gridSize: 4,
    rooms,
    startRoomId: startRoom.id,
    bossRoomId: boss.id,
  };
}

/** Hand-built backups; generation always has something valid to fall back to. */
const TEMPLATES: Array<Array<[number, number, RoomType]>> = [
  [
    [0, 3, 'start'],
    [1, 3, 'battle'],
    [2, 3, 'battle'],
    [2, 2, 'battle'],
    [2, 1, 'battle'],
    [2, 0, 'boss'],
    [1, 2, 'chest'],
    [1, 1, 'shop'],
  ],
  [
    [3, 3, 'start'],
    [2, 3, 'battle'],
    [2, 2, 'battle'],
    [1, 2, 'chest'],
    [1, 1, 'shop'],
    [2, 1, 'battle'],
    [2, 0, 'boss'],
  ],
  [
    [0, 0, 'start'],
    [1, 0, 'battle'],
    [2, 0, 'battle'],
    [2, 1, 'battle'],
    [1, 1, 'shop'],
    [3, 1, 'chest'],
    [3, 2, 'boss'],
  ],
];

function templateMap(index: number): DungeonMap {
  const spec = TEMPLATES[index % TEMPLATES.length]!;
  const rooms: Room[] = spec.map(([x, y, type], i) => ({
    id: `T${i}`,
    pos: [x, y],
    type,
    connections: [],
  }));
  for (const room of rooms) {
    for (const [dx, dy] of DIRS) {
      const target = rooms.find((r) => r.pos[0] === room.pos[0] + dx && r.pos[1] === room.pos[1] + dy);
      if (!target) continue;
      if (!room.connections.includes(target.id)) room.connections.push(target.id);
      if (!target.connections.includes(room.id)) target.connections.push(room.id);
    }
  }
  const start = rooms.find((r) => r.type === 'start')!;
  const boss = rooms.find((r) => r.type === 'boss')!;
  return { id: `template-${index}`, gridSize: 4, rooms, startRoomId: start.id, bossRoomId: boss.id };
}

/**
 * The room graph has narrow constraints (7–9 rooms, 3–5 battles, exactly one degree-3 room,
 * both ends degree 1), so a single random tree passes only about once in 500 tries. With a
 * few hundred attempts the fallback template showed up in roughly a quarter of all maps,
 * which is why every layer of a daily run used to look the same.
 */
const MAX_ATTEMPTS = 1500;

/** Room positions and types only: two maps with the same fingerprint play the same. */
function fingerprint(map: DungeonMap): string {
  return map.rooms
    .map((room) => `${room.pos.join(',')}:${room.type}`)
    .sort()
    .join(' ');
}

/** Retries the generator, then falls back to a hand-built map. */
export function generateMap(id: string, rng: Rng = Math.random): DungeonMap {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const map = buildMap(id, rng);
    if (map) return map;
  }
  return templateMap(randInt(TEMPLATES.length, rng));
}

export function generateMapPool(count: number): DungeonMap[] {
  const maps: DungeonMap[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    let map = generateMap(`map-${i}-${randInt(10000, Math.random)}`);
    // Layers should not repeat a layout, even when the generator falls back to a template.
    for (let attempt = 0; attempt < 6 && seen.has(fingerprint(map)); attempt += 1) {
      map = generateMap(`map-${i}-${randInt(10000, Math.random)}-${attempt}`);
    }
    seen.add(fingerprint(map));
    maps.push(map);
  }
  return maps;
}

/**
 * The daily and weekly challenge: everyone gets the same three layouts for a given seed,
 * and each layer is a different map. Free runs keep using `generateMap`, which is random.
 */
export function generateSeededMaps(seed: number, count: number): DungeonMap[] {
  const maps: DungeonMap[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    const base = seed + i * 7919;
    let map = generateMap(`seeded-${seed}-${i}`, seededRandom(base));
    // A rejected layout has to stay deterministic, so the retry walks the seed forward.
    for (let attempt = 1; attempt <= 8 && seen.has(fingerprint(map)); attempt += 1) {
      map = generateMap(`seeded-${seed}-${i}-${attempt}`, seededRandom(base + attempt * 104729));
    }
    seen.add(fingerprint(map));
    maps.push(map);
  }
  return maps;
}

/**
 * How many items the backpack holds. The `thin` modifier cuts it to two; everything that
 * adds an item has to go through this instead of `DUNGEON_CONFIG.maxItems`.
 */
export function itemCap(modifierId: string | null | undefined): number {
  return modifierId === 'thin' ? 2 : DUNGEON_CONFIG.maxItems;
}

export function roomAt(map: DungeonMap, x: number, y: number): Room | undefined {
  return map.rooms.find((r) => r.pos[0] === x && r.pos[1] === y);
}

export function canMove(map: DungeonMap, fromId: string, toId: string): boolean {
  const from = map.rooms.find((r) => r.id === fromId);
  return Boolean(from?.connections.includes(toId));
}

export function bfsDistance(map: DungeonMap, fromId: string, toId: string): number {
  const dist = new Map<string, number>([[fromId, 0]]);
  const queue = [fromId];
  while (queue.length) {
    const current = queue.shift()!;
    if (current === toId) return dist.get(current) ?? 0;
    const room = map.rooms.find((r) => r.id === current);
    for (const next of room?.connections ?? []) {
      if (!dist.has(next)) {
        dist.set(next, (dist.get(current) ?? 0) + 1);
        queue.push(next);
      }
    }
  }
  return Infinity;
}

/** Picks a question, preferring the current difficulty and avoiding repeats. */
export function drawQuestion(
  questions: DungeonQuestion[],
  difficulty: 'easy' | 'normal' | 'hard',
  used: Set<string>,
): { question: DungeonQuestion; used: Set<string> } | null {
  const order = [difficulty, ...(['easy', 'normal', 'hard'] as const).filter((d) => d !== difficulty)];
  for (const level of order) {
    const pool = questions.filter((q) => q.difficulty === level && !used.has(q.id));
    if (pool.length) {
      const question = pool[randInt(pool.length, Math.random)]!;
      return { question, used: new Set(used).add(question.id) };
    }
  }
  // Pool exhausted: reshuffle everything except the question just asked.
  const fresh = questions.filter((q) => !used.has(q.id));
  if (!fresh.length) {
    const question = questions[randInt(questions.length, Math.random)]!;
    return { question, used: new Set([question.id]) };
  }
  const question = fresh[randInt(fresh.length, Math.random)]!;
  return { question, used: new Set([question.id]) };
}

export function pickMonster(monsters: MonsterDef[], layer: number): MonsterDef {
  const pool = monsters.filter((m) => m.layers.includes(layer));
  return pool[randInt(pool.length, Math.random)] ?? monsters[0]!;
}

export function bossAt(bosses: BossDef[], layer: number): BossDef {
  return bosses[Math.min(layer - 1, bosses.length - 1)]!;
}

export function monsterGold(monster: MonsterDef, difficulty: 'easy' | 'normal' | 'hard', layer: number): number {
  const base = monster.gold + (DUNGEON_CONFIG.monsterGold[difficulty] - 20);
  return Math.round(base * (1 + (layer - 1) * 0.25) * 0.7);
}
