import type { FarmLevel } from './farm-engine';

// Standalone scenario: program a drone to run a small farm. The mechanics are inspired by
// The Farmer Was Replaced (write a loop, press run, watch it work); the content and code are ours.
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
    level: string;
    goal: string;
    steps: string;
    success: string;
    tryAgain: string;
    tooMany: string;
    hint: string;
    next: string;
  };
  levels: FarmLevel[];
}

const ROW: FarmLevel = {
  id: 'row',
  name: 'One straight row',
  brief: 'Four ripe plots in a line. Move, harvest, repeat.',
  width: 5,
  height: 5,
  start: { x: 0, y: 1, dir: 1 },
  tiles: [
    { x: 1, y: 1, crop: 'ripe' },
    { x: 2, y: 1, crop: 'ripe' },
    { x: 3, y: 1, crop: 'ripe' },
    { x: 4, y: 1, crop: 'ripe' },
  ],
  goal: 'harvest',
  target: 4,
  maxSteps: 16,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const PERIMETER: FarmLevel = {
  id: 'perimeter',
  name: 'Around the field',
  brief: 'Ripe plots around the edge. Put one side in the program, then loop it four times.',
  width: 4,
  height: 4,
  start: { x: 0, y: 0, dir: 1 },
  tiles: [
    { x: 1, y: 0, crop: 'ripe' },
    { x: 2, y: 0, crop: 'ripe' },
    { x: 3, y: 0, crop: 'ripe' },
    { x: 3, y: 1, crop: 'ripe' },
    { x: 3, y: 2, crop: 'ripe' },
    { x: 3, y: 3, crop: 'ripe' },
    { x: 2, y: 3, crop: 'ripe' },
    { x: 1, y: 3, crop: 'ripe' },
    { x: 0, y: 3, crop: 'ripe' },
    { x: 0, y: 2, crop: 'ripe' },
    { x: 0, y: 1, crop: 'ripe' },
  ],
  goal: 'harvest',
  target: 11,
  maxSteps: 48,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 4,
};

const REPLANT: FarmLevel = {
  id: 'replant',
  name: 'Harvest and replant',
  brief: 'Two rows, alternating ripe and empty. Harvest the ripe ones, plant the empty ones.',
  width: 5,
  height: 3,
  start: { x: 0, y: 1, dir: 1 },
  tiles: [
    { x: 1, y: 1, crop: 'ripe' },
    { x: 2, y: 1, crop: 'empty' },
    { x: 3, y: 1, crop: 'ripe' },
    { x: 4, y: 1, crop: 'empty' },
  ],
  goal: 'plant',
  target: 2,
  maxSteps: 16,
  allowed: ['forward', 'harvest', 'plant', 'left'],
  suggestedLoop: 1,
};

export const FARM_LAB: FarmCopy = {
  key: 'farm-lab',
  title: 'Farm Lab',
  tagline: 'Program a drone, then watch the loop do the work.',
  summary:
    'A small programming game: build a program from command cards, add a loop, and run the drone across a grid of crops. Three levels, no code required.',
  meta: '3 levels · about 8 minutes',
  minutes: 8,
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
    level: 'Level',
    goal: 'Goal',
    steps: 'Steps',
    success: 'The drone finished the job.',
    tryAgain: 'Not quite. Change the program and run it again.',
    tooMany: 'The drone ran out of steps.',
    hint: 'Hint: put one side in the program, then repeat it.',
    next: 'Next level',
  },
  levels: [ROW, PERIMETER, REPLANT],
};
