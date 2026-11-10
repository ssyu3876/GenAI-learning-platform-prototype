import { MessagesSquare } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { RoleplayPlayer } from './player';
import { roleplayConfigSchema, type RoleplayConfig } from './schema';

export const roleplayActivity = defineActivity<RoleplayConfig>({
  type: 'roleplay',
  label: 'AI role-play',
  description: 'Chat with an AI character (client, interviewer, teammate) and get scored on a rubric.',
  icon: MessagesSquare,
  schema: roleplayConfigSchema,
  promptGuide:
    '{ "scenario": string (2 sentences), "persona": string (a name), "personaRole": string, "personaBrief": string (hidden: personality + 2-3 facts the learner should uncover by asking), "learnerRole": string, "goals": string[] (2-3), "opening": string (the persona\'s first line), "rubric": [ { "criterion": string, "description": string } ] (2-3), "maxTurns": number (4-8), "mockReplies": string[] (4-6 plausible persona replies) }. Use it to let learners APPLY the lesson in a realistic conversation.',
  defaultConfig: {
    scenario: 'A small café owner wants "an app". You have 10 minutes to find out what they actually need.',
    persona: 'Mrs. Lau',
    personaRole: 'Owner of a busy café, your first client',
    personaBrief: 'Impatient but kind. Real problem: the lunch queue is too long and regulars leave. Budget is small. Does not care about technology.',
    learnerRole: 'Junior developer',
    goals: ['Find the real problem behind "an app"', 'Ask about budget and deadline'],
    opening: 'So, I need an app. Everyone has an app. How fast can you build it?',
    rubric: [
      { criterion: 'Asks open questions', description: 'Uses what/why/how questions to explore' },
      { criterion: 'Finds the real need', description: 'Uncovers the underlying problem' },
    ],
    maxTurns: 6,
    mockReplies: [
      'Well, at lunch the queue goes out the door and people give up and leave.',
      'Budget? Not much. Maybe a few thousand dollars. I am not a big chain.',
      'Most of my lunch customers are office workers from the building next door.',
      'I want it before the summer, when it gets really busy.',
      'Honestly I do not care how it works, I just want shorter queues.',
    ],
  },
  mock: ({ topic, locale }) => {
    if (locale === 'zh') {
      return {
        scenario: `一位朋友请你解释${topic}，好判断值不值得学。`,
        persona: 'Alex',
        personaRole: '一个对这方面完全不了解、充满好奇的朋友',
        personaBrief: '友好、爱怀疑，经常追问“那又怎样”。',
        learnerRole: '你',
        goals: ['把主要概念讲简单', '举一个真实的例子'],
        opening: `那${topic}到底是怎么回事？我该在意吗？`,
        rubric: [
          { criterion: '讲得清楚', description: '用大白话，不堆术语' },
          { criterion: '有例子', description: '让概念变得具体' },
        ],
        maxTurns: 5,
        mockReplies: ['好吧……但这对我有什么用？', '能举个真实的例子吗？', '哦，这样一说就清楚多了。', '那入门难不难？'],
      };
    }
    return {
      scenario: `A friend asks you to explain ${topic} so they can decide if it is worth learning.`,
      persona: 'Alex',
      personaRole: 'A curious friend with no background in the topic',
      personaBrief: 'Friendly, sceptical, asks "so what?" a lot.',
      learnerRole: 'You',
      goals: ['Explain the main idea simply', 'Give one real example'],
      opening: `So what is ${topic} actually about? Should I care?`,
      rubric: [
        { criterion: 'Clear explanation', description: 'Plain words, no jargon dumps' },
        { criterion: 'Uses an example', description: 'Makes it concrete' },
      ],
      maxTurns: 5,
      mockReplies: ['Okay... but why would that matter to me?', 'Can you give me a real example?', 'Huh, that makes more sense now.', 'And is it hard to get started?'],
    };
  },
  Player: RoleplayPlayer,
});
