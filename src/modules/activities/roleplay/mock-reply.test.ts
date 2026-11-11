import { describe, expect, it } from 'vitest';
import { mentions, pickMockReply } from './mock-reply';
import type { RoleplayMessage } from './schema';

const config = {
  mockRules: [
    { keywords: ['api', 'database', '数据库'], reply: 'Plain words, please.' },
    { keywords: ['budget', 'cost', '预算'], reply: 'About thirty thousand.' },
    { keywords: ['why', '为什么'], reply: 'The lunch queue is too long.' },
  ],
  mockReplies: ['Hmm, what do you mean?', 'Ask me about my café.'],
};

const opening: RoleplayMessage = { role: 'persona', content: 'I need an app.' };
const learner = (content: string): RoleplayMessage => ({ role: 'learner', content });
const persona = (content: string): RoleplayMessage => ({ role: 'persona', content });

describe('mentions', () => {
  it('matches Latin keywords at the start of a word', () => {
    expect(mentions('What would it cost?', 'cost')).toBe(true);
    expect(mentions('Any costs I should know?', 'cost')).toBe(true);
    expect(mentions('We need it rapidly', 'api')).toBe(false);
    expect(mentions('HOW MUCH is it', 'how much')).toBe(true);
  });

  it('matches Chinese keywords anywhere', () => {
    expect(mentions('你们的预算大概是多少？', '预算')).toBe(true);
    expect(mentions('你好', '预算')).toBe(false);
  });
});

describe('pickMockReply', () => {
  it('answers the topic the learner raised', () => {
    expect(pickMockReply(config, [opening, learner('What is your budget?')], [])).toBe('About thirty thousand.');
    expect(pickMockReply(config, [opening, learner('为什么想要一个应用？')], [])).toBe('The lunch queue is too long.');
  });

  it('gives the first matching rule priority, so jargon gets a confused reply', () => {
    expect(pickMockReply(config, [opening, learner('Why not use an API and a database?')], [])).toBe(
      'Plain words, please.',
    );
  });

  it('stays vague when nothing matches, and does not repeat itself', () => {
    const first = [opening, learner('Nice to meet you.')];
    expect(pickMockReply(config, first, [])).toBe('Hmm, what do you mean?');
    const second = [...first, persona('Hmm, what do you mean?'), learner('Okay.')];
    expect(pickMockReply(config, second, [])).toBe('Ask me about my café.');
  });

  it('skips a rule whose reply was already given', () => {
    const messages = [
      opening,
      learner('What is the budget?'),
      persona('About thirty thousand.'),
      learner('And the budget for design?'),
    ];
    expect(pickMockReply(config, messages, [])).toBe('Hmm, what do you mean?');
  });

  it('cycles through the canned replies once everything has been said', () => {
    const plain = { mockRules: [], mockReplies: ['A', 'B'] };
    const messages = [opening, learner('1'), persona('A'), learner('2'), persona('B'), learner('3')];
    expect(pickMockReply(plain, messages, [])).toBe('A');
  });

  it('uses the fallback when the activity has no canned replies', () => {
    expect(pickMockReply({ mockRules: [], mockReplies: [] }, [opening, learner('Hi')], ['Generic'])).toBe('Generic');
  });
});
