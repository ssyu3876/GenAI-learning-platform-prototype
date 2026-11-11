// Pure map/battle helpers for Agent Dungeon. No React, no database: the component owns the
// run state and calls these functions, so the map rules are testable on their own.

import type { BossDef, DungeonQuestion, MonsterDef, RoomType } from './dungeon';

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

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
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
function walk(start: [number, number], length: number, used: Set<string>, size: number): Array<[number, number]> {
  const path: Array<[number, number]> = [start];
  const seen = new Set(used).add(key(...start));
  let [x, y] = start;
  for (let i = 1; i < length; i += 1) {
    const options = neighbors(x, y, size).filter(([nx, ny]) => !seen.has(key(nx, ny)));
    if (!options.length) break;
    const [nx, ny] = options[randInt(options.length)]!;
    path.push([nx, ny]);
    seen.add(key(nx, ny));
    x = nx;
    y = ny;
  }
  return path;
}

function buildTree(): Array<[number, number]> {
  const size = 4;
  const start = corners(size)[randInt(4)]!;
  const main = walk(start, 4 + randInt(3), new Set(), size);
  if (main.length < 4) return [];
  const cells: Array<[number, number]> = [...main];
  const used = new Set(cells.map(([x, y]) => key(x, y)));

  const anchors = main.slice(1, -1);
  const branchCount = 1 + randInt(3);
  for (let i = 0; i < branchCount; i += 1) {
    if (!anchors.length) break;
    const anchor = anchors[randInt(anchors.length)]!;
    const branch = walk(anchor, 2 + randInt(2), used, size);
    for (const cell of branch.slice(1)) {
      if (used.has(key(...cell))) continue;
      cells.push(cell);
      used.add(key(...cell));
    }
    if (cells.length > 9) break;
  }
  return cells;
}

function buildMap(id: string): DungeonMap | null {
  const cells = buildTree();
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

  const spare = shuffle(leaves.filter((r) => r.id !== boss.id));
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

/** Three hand-built backups; generation always has something valid to fall back to. */
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

/** Retries the generator, then falls back to a hand-built map. */
export function generateMap(id: string): DungeonMap {
  for (let i = 0; i < 200; i += 1) {
    const map = buildMap(id);
    if (map) return map;
  }
  return templateMap(Math.abs(id.length) + randInt(TEMPLATES.length));
}

export function generateMapPool(count: number): DungeonMap[] {
  return Array.from({ length: count }, (_, i) => generateMap(`map-${i}-${randInt(10000)}`));
}

/** The hand-built map, exposed for the daily challenge where everyone should see the same layout. */
export function presetMap(): DungeonMap {
  return templateMap(0);
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
      const question = pool[randInt(pool.length)]!;
      return { question, used: new Set(used).add(question.id) };
    }
  }
  // Pool exhausted: reshuffle everything except the question just asked.
  const fresh = questions.filter((q) => !used.has(q.id));
  if (!fresh.length) {
    const question = questions[randInt(questions.length)]!;
    return { question, used: new Set([question.id]) };
  }
  const question = fresh[randInt(fresh.length)]!;
  return { question, used: new Set([question.id]) };
}

export function pickMonster(monsters: MonsterDef[], layer: number): MonsterDef {
  const pool = monsters.filter((m) => m.layers.includes(layer));
  return pool[randInt(pool.length)] ?? monsters[0]!;
}

export function bossAt(bosses: BossDef[], layer: number): BossDef {
  return bosses[Math.min(layer - 1, bosses.length - 1)]!;
}

export function monsterGold(monster: MonsterDef, difficulty: 'easy' | 'normal' | 'hard', layer: number): number {
  const base = monster.gold + (DUNGEON_CONFIG.monsterGold[difficulty] - 20);
  return Math.round(base * (1 + (layer - 1) * 0.25) * 0.7);
}
