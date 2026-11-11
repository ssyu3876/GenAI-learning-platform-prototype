import { ListChecks } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { gradeQuiz } from '../grading';
import { QuizPlayer } from './player';
import { quizConfigSchema, type QuizConfig } from './schema';

export const quizActivity = defineActivity<QuizConfig>({
  type: 'quiz',
  label: 'Quiz',
  description: 'Multiple-choice questions with an explanation after each answer.',
  icon: ListChecks,
  schema: quizConfigSchema,
  promptGuide:
    '{ "questions": [ { "prompt": string, "options": string[] (3-4), "answerIndex": number (0-based), "explanation": string (why the answer is right, 1-2 sentences) } ] } with 3-5 questions that test understanding, not memorised wording.',
  defaultConfig: {
    questions: [
      {
        prompt: 'Which of these is a user story?',
        options: [
          'As a student, I want to reset my password so that I can log in again.',
          'The database uses PostgreSQL 16.',
          'Fix the bug on line 42.',
        ],
        answerIndex: 0,
        explanation: 'A user story names who wants something, what they want, and why.',
      },
    ],
  },
  mock: ({ topic, lessonTitle, locale }) => {
    if (locale === 'zh') {
      return {
        questions: [
          {
            prompt: `怎样才算真正理解了“${lessonTitle}”？`,
            options: ['用自己的话结合例子讲出来', '把标题再读一遍', '直接跳到下一课'],
            answerIndex: 0,
            explanation: '能简单地讲清楚并举出一个例子，就说明你真的懂了。',
          },
          {
            prompt: `学习${topic}时，哪种习惯最有帮助？`,
            options: ['短而规律的练习', '前一天晚上突击一次', '只看视频'],
            answerIndex: 0,
            explanation: '间隔练习、主动回想，才更有利于长期记忆。',
          },
        ],
      };
    }
    return {
      questions: [
        {
          prompt: `What is the best way to check you really understood "${lessonTitle}"?`,
          options: ['Explain it in your own words with an example', 'Re-read the title', 'Skip to the next lesson'],
          answerIndex: 0,
          explanation: 'If you can explain it simply and give an example, you understand it.',
        },
        {
          prompt: `Which habit helps most when learning ${topic}?`,
          options: ['Short, regular practice', 'One long session the night before', 'Only watching videos'],
          answerIndex: 0,
          explanation: 'Spaced, active practice beats cramming for long-term memory.',
        },
      ],
    };
  },
  grade: gradeQuiz,
  Player: QuizPlayer,
});
