import { z } from 'zod';

export const roleplayConfigSchema = z.object({
  scenario: z.string().min(1),
  /** Character name, e.g. "Mrs. Lau" */
  persona: z.string().min(1).max(60),
  /** Who they are, e.g. "Owner of a bubble-tea shop, your client" */
  personaRole: z.string().min(1).max(120),
  /** Hidden instructions for the AI: personality, needs the learner should uncover */
  personaBrief: z.string().default(''),
  /** Who the learner plays */
  learnerRole: z.string().default('You'),
  goals: z.array(z.string().min(1)).min(1).max(5),
  /** First line the character says */
  opening: z.string().min(1),
  rubric: z
    .array(z.object({ criterion: z.string().min(1), description: z.string().default('') }))
    .min(1)
    .max(5),
  maxTurns: z.number().int().min(2).max(12).default(6),
  /** Canned replies used when no AI key is configured (offline demo) */
  mockReplies: z.array(z.string()).default([]),
  /**
   * Offline replies matched to what the learner asked: the first rule whose keywords appear in
   * the learner's message answers it (see mock-reply.ts). Keywords are matched as written and
   * may mix English and Chinese; they are never translated.
   */
  mockRules: z
    .array(z.object({ keywords: z.array(z.string().min(1)).min(1).max(40), reply: z.string().min(1) }))
    .max(12)
    .default([]),
});

export type RoleplayConfig = z.infer<typeof roleplayConfigSchema>;

export const roleplayMessageSchema = z.object({
  role: z.enum(['persona', 'learner']),
  content: z.string().min(1).max(1500),
});
export type RoleplayMessage = z.infer<typeof roleplayMessageSchema>;

export const roleplayFeedbackSchema = z.object({
  overall: z.number().min(0).max(100),
  criteria: z
    .array(z.object({ criterion: z.string(), score: z.number().min(0).max(100), comment: z.string() }))
    .min(1),
  strengths: z.array(z.string()).max(4),
  improve: z.array(z.string()).max(4),
  tip: z.string(),
});
export type RoleplayFeedback = z.infer<typeof roleplayFeedbackSchema>;
