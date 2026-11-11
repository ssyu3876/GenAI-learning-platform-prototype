import { Shuffle } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { byLocale } from '@/i18n/ai';
import { gradeSort } from '../grading';
import { SortPlayer } from './player';
import { sortConfigSchema, type SortConfig } from './schema';

export const sortActivity = defineActivity<SortConfig>({
  type: 'sort',
  label: 'Sorting game',
  description: 'Learners drop cards into the right group (e.g. "give to AI" vs "do it yourself").',
  icon: Shuffle,
  schema: sortConfigSchema,
  promptGuide:
    '{ "instructions": string, "buckets": string[] (2-3 short group names), "items": [ { "text": string (a concrete example, max 12 words), "bucket": string (must equal one of buckets) } ] } with 6-8 items, balanced across buckets, some of them slightly tricky.',
  defaultConfig: {
    instructions: 'Is it a functional or a non-functional requirement?',
    buckets: ['Functional', 'Non-functional'],
    items: [
      { text: 'Students can reset their password', bucket: 'Functional' },
      { text: 'Pages load in under 2 seconds', bucket: 'Non-functional' },
      { text: 'Teachers can export grades to CSV', bucket: 'Functional' },
      { text: 'Works with a screen reader', bucket: 'Non-functional' },
    ],
  },
  mock: ({ topic, locale }) => {
    const buckets = byLocale(locale, ['Fact', 'Myth'], ['事实', '误区']);
    return {
      instructions: byLocale(locale, `Sort these statements about ${topic}.`, `给这些关于${topic}的说法分类。`),
      buckets,
      items: byLocale(
        locale,
        [
          { text: 'Practice with feedback beats re-reading', bucket: buckets[0]! },
          { text: 'You must be "a natural" to learn this', bucket: buckets[1]! },
          { text: 'Small daily sessions add up', bucket: buckets[0]! },
          { text: 'Mistakes mean you should give up', bucket: buckets[1]! },
        ],
        [
          { text: '带着反馈练习，比反复阅读更有效', bucket: buckets[0]! },
          { text: '必须“有天赋”才学得会', bucket: buckets[1]! },
          { text: '每天学一点点，会积少成多', bucket: buckets[0]! },
          { text: '犯了错就说明该放弃', bucket: buckets[1]! },
        ],
      ),
    };
  },
  grade: gradeSort,
  Player: SortPlayer,
});
