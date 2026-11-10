import { Code } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { byLocale } from '@/i18n/ai';
import { CodingPlayer } from './player';
import { codingConfigSchema, type CodingConfig } from './schema';

export const codingActivity = defineActivity<CodingConfig>({
  type: 'coding',
  label: 'Coding exercise',
  description: 'Write or fix a small JavaScript function; tests run in the browser.',
  icon: Code,
  schema: codingConfigSchema,
  promptGuide:
    '{ "instructions": markdown string, "starterCode": string (JavaScript, defines the function, may contain a bug to fix), "functionName": string, "tests": [ { "args": any[], "expected": any (JSON value), "label": string } ] (3-6 tests incl. edge cases), "hintContext": string } . Only plain JavaScript, no imports. Use only for technical/CS audiences.',
  defaultConfig: {
    instructions: 'Write `isEven(n)` that returns `true` when `n` is even.',
    starterCode: 'function isEven(n) {\n  // your code here\n}\n',
    functionName: 'isEven',
    tests: [
      { args: [2], expected: true },
      { args: [7], expected: false },
      { args: [0], expected: true },
    ],
  },
  mock: ({ locale }) => ({
    instructions: byLocale(locale, 'Write `double(n)` that returns `n` times two.', '写一个 `double(n)`，返回 `n` 的两倍。'),
    starterCode: 'function double(n) {\n  return n;\n}\n',
    functionName: 'double',
    tests: [
      { args: [2], expected: 4 },
      { args: [0], expected: 0 },
      { args: [-3], expected: -6 },
    ],
  }),
  Player: CodingPlayer,
});
