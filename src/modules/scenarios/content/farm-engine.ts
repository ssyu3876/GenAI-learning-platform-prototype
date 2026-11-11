// Farm Lab: a tiny programmable-drone game. The engine is pure so the rules can be tested
// without React, and the player only animates the frames it returns.

export type FarmDir = 0 | 1 | 2 | 3; // up, right, down, left
export type FarmCommand = 'forward' | 'left' | 'right' | 'harvest' | 'plant';
export type Crop = 'ripe' | 'empty' | 'rock';

export interface FarmTile {
  x: number;
  y: number;
  crop: Crop;
}

export interface FarmLevel {
  id: string;
  name: string;
  brief: string;
  width: number;
  height: number;
  start: { x: number; y: number; dir: FarmDir };
  tiles: FarmTile[];
  goal: 'harvest' | 'plant';
  target: number;
  maxSteps: number;
  allowed: FarmCommand[];
  /** A loop count that solves the level, used for the hint. */
  suggestedLoop: number;
}

export interface FarmFrame {
  x: number;
  y: number;
  dir: FarmDir;
  harvested: number;
  planted: number;
  note: string;
}

export interface FarmResult {
  frames: FarmFrame[];
  done: boolean;
  harvested: number;
  planted: number;
  steps: number;
  reason: 'ok' | 'steps' | 'incomplete';
}

const DELTA: Array<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export function tileAt(level: FarmLevel, x: number, y: number): FarmTile | undefined {
  return level.tiles.find((t) => t.x === x && t.y === y);
}

export function runFarm(level: FarmLevel, program: FarmCommand[], loop: number): FarmResult {
  const tiles = level.tiles.map((t) => ({ ...t }));
  const localAt = (x: number, y: number) => tiles.find((t) => t.x === x && t.y === y);
  let x = level.start.x;
  let y = level.start.y;
  let dir = level.start.dir;
  let harvested = 0;
  let planted = 0;
  const frames: FarmFrame[] = [];

  const snapshot = (note: string) => {
    frames.push({ x, y, dir, harvested, planted, note });
  };

  const rounds = Math.max(1, Math.min(20, loop));
  for (let round = 0; round < rounds; round += 1) {
    for (const command of program) {
      if (command === 'left') {
        dir = ((dir + 3) % 4) as FarmDir;
        snapshot('turn');
        continue;
      }
      if (command === 'right') {
        dir = ((dir + 1) % 4) as FarmDir;
        snapshot('turn');
        continue;
      }
      if (command === 'forward') {
        const nextX = x + DELTA[dir]!.dx;
        const nextY = y + DELTA[dir]!.dy;
        const blocked =
          nextX < 0 ||
          nextY < 0 ||
          nextX >= level.width ||
          nextY >= level.height ||
          localAt(nextX, nextY)?.crop === 'rock';
        if (!blocked) {
          x = nextX;
          y = nextY;
          snapshot('move');
        } else {
          snapshot('blocked');
        }
        continue;
      }
      const tile = localAt(x, y);
      if (command === 'harvest' && tile?.crop === 'ripe') {
        tile.crop = 'empty';
        harvested += 1;
        snapshot('harvest');
      } else if (command === 'plant' && tile?.crop === 'empty') {
        tile.crop = 'ripe';
        planted += 1;
        snapshot('plant');
      } else {
        snapshot('nothing');
      }
      if (frames.length >= level.maxSteps) {
        return {
          frames,
          done: false,
          harvested,
          planted,
          steps: frames.length,
          reason: 'steps',
        };
      }
    }
  }

  const count = level.goal === 'harvest' ? harvested : planted;
  const done = count >= level.target;
  return {
    frames,
    done,
    harvested,
    planted,
    steps: frames.length,
    reason: done ? 'ok' : 'incomplete',
  };
}
