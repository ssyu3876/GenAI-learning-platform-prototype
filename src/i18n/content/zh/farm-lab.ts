import type { FarmCopy } from '@/modules/scenarios/content/farm-lab';
import type { FarmLevel } from '@/modules/scenarios/content/farm-engine';

// Chinese copy for Farm Lab. Keys match FARM_LAB exactly; the levels are translated in place.
const ROW: FarmLevel = {
  id: 'row',
  name: '一条直线',
  brief: '四块成熟的地排成一行。前进、收割，重复。',
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
  name: '绕田一圈',
  brief: '成熟的地在四周。把一条边写进程序，然后循环四次。',
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
  name: '收完再种',
  brief: '两行地，成熟和空地交替。收成熟的，种空的。',
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

export const FARM_LAB_ZH: FarmCopy = {
  key: 'farm-lab',
  title: '农场实验室',
  tagline: '给无人机编个程，然后看循环把活干完。',
  summary:
    '一个小型编程游戏：用指令卡片拼出程序，加一个循环，让无人机走过格子农田。三关，不用写代码。',
  meta: '3 关 · 约 8 分钟',
  minutes: 8,
  labels: {
    run: '运行程序',
    reset: '重置',
    stop: '停止',
    program: '程序',
    commands: '指令',
    empty: '从下面的指令里添加。',
    loop: '重复',
    harvest: '收割',
    plant: '播种',
    forward: '前进',
    left: '左转',
    right: '右转',
    levelLabel: '关卡',
    goal: '目标',
    steps: '步数',
    success: '无人机把活干完了。',
    tryAgain: '还差一点。改改程序，再跑一次。',
    tooMany: '步数用完了。',
    hint: '提示：把一条边写进程序，然后循环它。',
    next: '下一关',
  },
  levels: [ROW, PERIMETER, REPLANT],
};
