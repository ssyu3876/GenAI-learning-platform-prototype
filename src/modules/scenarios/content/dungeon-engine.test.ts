import { describe, expect, it } from 'vitest';
import {
  bfsDistance,
  drawQuestion,
  generateMap,
  generateMapPool,
  generateSeededMaps,
  itemCap,
  monsterGold,
  pickMonster,
  DUNGEON_CONFIG,
} from './dungeon-engine';
import { DUNGEON } from './dungeon';

function layoutOf(map: ReturnType<typeof generateMap>) {
  return map.rooms
    .map((room) => `${room.pos.join(',')}:${room.type}`)
    .sort()
    .join(' ');
}

function checkMap(map: ReturnType<typeof generateMap>) {
  const degrees = map.rooms.map((r) => r.connections.length);
  const start = map.rooms.find((r) => r.id === map.startRoomId)!;
  const boss = map.rooms.find((r) => r.id === map.bossRoomId)!;
  const farthest = Math.max(...map.rooms.map((r) => bfsDistance(map, map.startRoomId, r.id)));
  expect(map.rooms.length).toBeGreaterThanOrEqual(7);
  expect(map.rooms.length).toBeLessThanOrEqual(9);
  expect(new Set(map.rooms.map((r) => r.pos.join(','))).size).toBe(map.rooms.length);
  expect(degrees.every((d) => d >= 1 && d <= 3)).toBe(true);
  expect(degrees.includes(3)).toBe(true);
  expect(start.connections.length).toBe(1);
  expect(boss.connections.length).toBe(1);
  expect(bfsDistance(map, map.startRoomId, map.bossRoomId)).toBe(farthest);
  expect(map.rooms.filter((r) => r.type === 'battle').length).toBeGreaterThanOrEqual(3);
  expect(map.rooms.filter((r) => r.type === 'battle').length).toBeLessThanOrEqual(5);
}

describe('dungeon map generator', () => {
  it('always produces a valid map', () => {
    for (let i = 0; i < 40; i += 1) checkMap(generateMap(`map-${i}`));
  });

  it('builds a pool of the requested size', () => {
    expect(generateMapPool(15)).toHaveLength(15);
  });
});

describe('questions and monsters', () => {
  it('prefers the current difficulty and avoids repeats', () => {
    const used = new Set<string>();
    const first = drawQuestion(DUNGEON.questions, 'hard', used)!;
    expect(first.question.difficulty).toBe('hard');
    expect(first.used.has(first.question.id)).toBe(true);
    const second = drawQuestion(DUNGEON.questions, 'hard', first.used)!;
    expect(second.question.id).not.toBe(first.question.id);
  });

  it('falls back to another difficulty when one pool is exhausted', () => {
    const used = new Set(DUNGEON.questions.filter((q) => q.difficulty === 'hard').map((q) => q.id));
    const draw = drawQuestion(DUNGEON.questions, 'hard', used)!;
    expect(draw.question.difficulty).not.toBe('hard');
  });

  it('picks a monster that appears on the layer', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(pickMonster(DUNGEON.monsters, 3).layers).toContain(3);
    }
  });

  it('scales monster gold with difficulty and layer', () => {
    const monster = DUNGEON.monsters[0]!;
    expect(monsterGold(monster, 'hard', 1)).toBeGreaterThan(monsterGold(monster, 'easy', 1));
    expect(monsterGold(monster, 'normal', 2)).toBeGreaterThan(monsterGold(monster, 'normal', 1));
    expect(DUNGEON_CONFIG.hp.hard).toBe(80);
  });
});

describe('daily and weekly maps', () => {
  it('is the same three layouts for everyone on a given seed', () => {
    const today = generateSeededMaps(20261112, 3);
    const again = generateSeededMaps(20261112, 3);
    expect(today.map(layoutOf)).toEqual(again.map(layoutOf));
  });

  it('gives each layer its own map instead of repeating the hand-built one', () => {
    const maps = generateSeededMaps(20261112, 3);
    expect(maps).toHaveLength(3);
    expect(new Set(maps.map(layoutOf)).size).toBe(3);
  });

  it('changes the maps from one day to the next', () => {
    expect(layoutOf(generateSeededMaps(20261112, 1)[0]!)).not.toBe(
      layoutOf(generateSeededMaps(20261113, 1)[0]!),
    );
  });

  it('still produces valid maps', () => {
    for (const seed of [1, 20261112, 202545]) {
      for (const map of generateSeededMaps(seed, 3)) checkMap(map);
    }
  });
});

describe('item cap', () => {
  it('is the normal backpack size without a modifier', () => {
    expect(itemCap(undefined)).toBe(DUNGEON_CONFIG.maxItems);
    expect(itemCap('heavy')).toBe(DUNGEON_CONFIG.maxItems);
  });

  it('drops to two slots with the thin modifier', () => {
    expect(itemCap('thin')).toBe(2);
  });
});
