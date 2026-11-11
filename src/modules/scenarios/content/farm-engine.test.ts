import { describe, expect, it } from 'vitest';
import { runFarm, type FarmCommand, type FarmLevel } from './farm-engine';

const ROW: FarmLevel = {
  id: 'row',
  name: 'row',
  brief: '',
  width: 5,
  height: 3,
  start: { x: 0, y: 1, dir: 1 },
  tiles: [
    { x: 1, y: 1, crop: 'ripe' },
    { x: 2, y: 1, crop: 'ripe' },
    { x: 3, y: 1, crop: 'ripe' },
  ],
  goal: 'harvest',
  target: 3,
  maxSteps: 12,
  allowed: ['forward', 'harvest', 'left'],
  suggestedLoop: 1,
};

const PLANT: FarmLevel = {
  ...ROW,
  goal: 'plant',
  target: 1,
  tiles: [{ x: 1, y: 1, crop: 'empty' }],
  allowed: ['forward', 'plant'],
};

describe('runFarm', () => {
  it('harvests a straight row and finishes', () => {
    const program: FarmCommand[] = ['forward', 'harvest', 'forward', 'harvest', 'forward', 'harvest'];
    const result = runFarm(ROW, program, 1);
    expect(result.done).toBe(true);
    expect(result.harvested).toBe(3);
    expect(result.reason).toBe('ok');
    expect(result.frames.at(-1)?.x).toBe(3);
  });

  it('repeats a program and stops at the step budget', () => {
    const result = runFarm(ROW, ['forward', 'harvest'], 10);
    expect(result.reason).toBe('steps');
    expect(result.done).toBe(false);
    expect(result.steps).toBe(ROW.maxSteps);
  });

  it('plants on empty soil and does nothing on ripe soil', () => {
    const result = runFarm(PLANT, ['forward', 'plant', 'plant'], 1);
    expect(result.planted).toBe(1);
    expect(result.done).toBe(true);
  });

  it('does not walk through a rock', () => {
    const blocked: FarmLevel = {
      ...ROW,
      tiles: [{ x: 1, y: 1, crop: 'rock' }],
      target: 0,
      goal: 'harvest',
    };
    const result = runFarm(blocked, ['forward', 'harvest'], 1);
    expect(result.frames[0]?.x).toBe(0);
    expect(result.frames[0]?.note).toBe('blocked');
  });
});
