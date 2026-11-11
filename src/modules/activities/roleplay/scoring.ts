// Offline heuristic feedback, used when no AI key is configured. Rewards asking open
// questions, engaging over several turns and giving substantive answers.
import type { Locale } from '@/i18n/config';
import type { RoleplayConfig, RoleplayFeedback, RoleplayMessage } from './schema';

const OPEN_STARTERS = /^(what|how|why|who|when|where|could you|can you|tell me|walk me)/i;
const OPEN_STARTERS_ZH = /^(什么|怎么|如何|为什么|谁|什么时候|哪里|能不能|可以|请|说说)/;

export function mockFeedback(c: RoleplayConfig, messages: RoleplayMessage[], locale: Locale = 'en'): RoleplayFeedback {
  const learner = messages.filter((m) => m.role === 'learner');
  const questions = learner.filter((m) => m.content.includes('?') || m.content.includes('？')).length;
  const open = learner.filter((m) =>
    locale === 'zh' ? OPEN_STARTERS_ZH.test(m.content.trim()) : OPEN_STARTERS.test(m.content.trim()),
  ).length;
  const lengthOf = (text: string) => (locale === 'zh' ? text.replace(/\s+/g, '').length : text.split(/\s+/).length);
  const avgLen = learner.reduce((n, m) => n + lengthOf(m.content), 0) / Math.max(1, learner.length);

  const engagement = Math.min(100, (learner.length / c.maxTurns) * 100);
  const curiosity = Math.min(100, questions * 22 + open * 12);
  const depth = Math.min(100, avgLen * (locale === 'zh' ? 1.5 : 6));
  const overall = Math.round(engagement * 0.35 + curiosity * 0.4 + depth * 0.25);

  return {
    overall,
    criteria: c.rubric.map((r, i) => ({
      criterion: r.criterion,
      score: Math.max(20, Math.min(100, Math.round([curiosity, depth, engagement][i % 3]!))),
      comment:
        locale === 'zh'
          ? i % 3 === 0
            ? `你提出了 ${questions} 个问题${open ? `，其中 ${open} 个是开放式问题` : ''}。`
            : i % 3 === 1
              ? `你的每条消息平均 ${Math.round(avgLen)} 个字。${avgLen < 30 ? '可以再多补充一点细节。' : '细节程度不错。'}`
              : `你在 ${c.maxTurns} 轮里保持了 ${learner.length} 轮对话。`
          : i % 3 === 0
            ? `You asked ${questions} question${questions === 1 ? '' : 's'}${open ? `, ${open} of them open-ended` : ''}.`
            : i % 3 === 1
              ? `Your messages averaged ${Math.round(avgLen)} words. ${avgLen < 8 ? 'Try adding a bit more detail.' : 'Good level of detail.'}`
              : `You kept the conversation going for ${learner.length} of ${c.maxTurns} turns.`,
    })),
    strengths:
      locale === 'zh'
        ? questions > 0
          ? ['你会先提问，而不是想当然。']
          : ['你保持了礼貌，也没有跑题。']
        : questions > 0
          ? ['You asked questions instead of assuming.']
          : ['You stayed polite and on topic.'],
    improve:
      locale === 'zh'
        ? open < 2
          ? ['多用“什么”“怎么”“为什么”开头的开放式问题。']
          : ['在进入下一步之前，先总结一下你听到的内容。']
        : open < 2
          ? ['Use more open questions that start with "what", "how" or "why".']
          : ['Summarise what you heard before moving on.'],
    tip:
      locale === 'zh'
        ? '可以这样说：“我确认一下：你们需要在 Y 之前完成 X，因为 Z。我理解得对吗？”'
        : 'Try: "Just to check I understood: you need X by Y because Z. Is that right?"',
  };
}
