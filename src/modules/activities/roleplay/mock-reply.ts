// Offline replies for role-play characters, used when there is no AI key, the daily limit is
// reached or the provider fails. A canned list read in order ignores what the learner said:
// the character could reveal the budget in answer to "nice to meet you". Rules let the
// character answer the topic the learner actually raised, and stay vague otherwise, which is
// how the persona brief asks the character to behave.
import type { RoleplayConfig, RoleplayMessage } from './schema';

const LATIN = /^[\x20-\x7e]+$/;

/**
 * True when `keyword` appears in `text`. A Latin keyword must start a word, so "cost" matches
 * "costs" but "api" does not match "rapid". Chinese keywords match anywhere.
 */
export function mentions(text: string, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return false;
  const t = text.toLowerCase();
  if (!LATIN.test(k)) return t.includes(k);
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}`).test(t);
}

/**
 * Picks the character's next offline reply:
 * 1. the first rule whose keywords appear in the learner's latest message, skipping replies
 *    the character has already given;
 * 2. otherwise the next unused canned reply (`mockReplies`, or `fallback` when there are none);
 * 3. once everything has been said, the canned replies again in turn.
 */
export function pickMockReply(
  config: Pick<RoleplayConfig, 'mockRules' | 'mockReplies'>,
  messages: RoleplayMessage[],
  fallback: readonly string[],
): string {
  const said = new Set(messages.filter((m) => m.role === 'persona').map((m) => m.content.trim()));
  const learner = messages.filter((m) => m.role === 'learner');
  const latest = learner[learner.length - 1]?.content ?? '';

  for (const rule of config.mockRules) {
    if (said.has(rule.reply.trim())) continue;
    if (rule.keywords.some((keyword) => mentions(latest, keyword))) return rule.reply;
  }

  const replies = config.mockReplies.length ? config.mockReplies : fallback;
  const fresh = replies.find((reply) => !said.has(reply.trim()));
  if (fresh) return fresh;
  return replies[(Math.max(1, learner.length) - 1) % Math.max(1, replies.length)] ?? fallback[0] ?? '';
}
