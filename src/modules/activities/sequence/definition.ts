import { ArrowUpDown } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { byLocale } from '@/i18n/ai';
import { gradeSequence } from '../grading';
import { SequencePlayer } from './player';
import { sequenceConfigSchema, type SequenceConfig } from './schema';

export const sequenceActivity = defineActivity<SequenceConfig>({
  type: 'sequence',
  label: 'Put in order',
  description: 'Learners reorder shuffled steps (e.g. the phases of a sprint).',
  icon: ArrowUpDown,
  schema: sequenceConfigSchema,
  promptGuide:
    '{ "instructions": string, "steps": string[] (4-6 short steps listed in the CORRECT order; the app shuffles them) }. Use a process where order clearly matters.',
  defaultConfig: {
    instructions: 'Order the steps of fixing a bug properly.',
    steps: ['Reproduce the bug', 'Write a failing test', 'Fix the code', 'Run all tests', 'Open a pull request'],
  },
  mock: ({ topic, locale }) => ({
    instructions: byLocale(locale, `Order these steps for learning ${topic}.`, `把学习${topic}的步骤排好序。`),
    steps: byLocale(
      locale,
      ['Get the big picture', 'Learn one key idea', 'Try a small example', 'Check your understanding', 'Teach it to someone'],
      ['先看全局', '学一个关键概念', '做一个小例子', '检查自己是否理解', '讲给别人听'],
    ),
  }),
  grade: gradeSequence,
  Player: SequencePlayer,
});
