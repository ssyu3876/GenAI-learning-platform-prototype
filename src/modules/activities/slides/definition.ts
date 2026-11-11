import { Presentation } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { SlidesPlayer } from './player';
import { slidesConfigSchema, type SlidesConfig } from './schema';

export const slidesActivity = defineActivity<SlidesConfig>({
  type: 'slides',
  label: 'Narrated slides',
  description: 'A short slide deck that Pip reads aloud, with captions.',
  icon: Presentation,
  schema: slidesConfigSchema,
  promptGuide:
    '{ "slides": [ { "heading": string, "bullets": string[] (2-4, short), "narration": string (2-4 spoken sentences, conversational, as if explaining to a friend), "visual"?: one of "impact-first" | "three-moves" | "trade-off" | "tone-meter" | "star-stack" (optional diagram) } ] } with 3-5 slides.',
  defaultConfig: {
    slides: [
      { heading: 'What is a sprint?', bullets: ['A short, fixed time box', 'Usually 1-2 weeks'], narration: 'A sprint is a short, fixed period where a team commits to finishing a small set of work.' },
      { heading: 'Why short?', bullets: ['Fast feedback', 'Less risk'], narration: 'Keeping it short means you find out quickly if you are building the wrong thing.' },
    ],
  },
  mock: ({ topic, lessonTitle, locale }) => {
    if (locale === 'zh') {
      return {
        slides: [
          {
            heading: lessonTitle,
            bullets: [`属于：${topic}`, '三分钟，三个要点'],
            narration: `你好，我是 Pip。我们一起来看看${lessonTitle}，我会讲得简短一些。`,
          },
          {
            heading: '核心概念',
            bullets: ['它是什么', '为什么重要'],
            narration: '先用一句话说清核心概念，再讲讲它在真实项目里为什么重要。',
          },
          {
            heading: '动手试试',
            bullets: ['做做下面的活动', '卡住了就来问我'],
            narration: '最好的学习方式就是动手试试。去做下一个活动吧，有问题随时问我。',
          },
        ],
      };
    }
    return {
      slides: [
        { heading: lessonTitle, bullets: [`Part of: ${topic}`, 'Three minutes, three ideas'], narration: `Hi, it is Pip. Let us look at ${lessonTitle} together. I will keep it short.` },
        { heading: 'The core idea', bullets: ['What it is', 'Why it matters'], narration: 'First, the core idea in one sentence, and why people care about it in real projects.' },
        { heading: 'Try it yourself', bullets: ['Do the activity below', 'Ask me if you get stuck'], narration: 'Now the best way to learn is to try. Have a go at the next activity and ask me anything.' },
      ],
    };
  },
  Player: SlidesPlayer,
});
