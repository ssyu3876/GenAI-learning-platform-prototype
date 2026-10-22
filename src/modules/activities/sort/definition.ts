import { Shuffle } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
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
  mock: ({ topic }) => ({
    instructions: `Sort these statements about ${topic}.`,
    buckets: ['Fact', 'Myth'],
    items: [
      { text: 'Practice with feedback beats re-reading', bucket: 'Fact' },
      { text: 'You must be "a natural" to learn this', bucket: 'Myth' },
      { text: 'Small daily sessions add up', bucket: 'Fact' },
      { text: 'Mistakes mean you should give up', bucket: 'Myth' },
    ],
  }),
  grade: gradeSort,
  Player: SortPlayer,
});
