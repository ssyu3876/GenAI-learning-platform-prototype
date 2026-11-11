import { z } from 'zod';

export const slidesConfigSchema = z.object({
  slides: z
    .array(
      z.object({
        heading: z.string().min(1).max(120),
        bullets: z.array(z.string().min(1)).max(6).default([]),
        // What Pip says out loud on this slide (Web Speech API). Also shown as captions.
        narration: z.string().min(1).max(900),
        // Optional diagram drawn by the player. Unknown names are ignored, so old decks and
        // AI-generated decks keep working.
        visual: z.string().min(1).max(48).optional(),
        // Optional one-question check on the slide. It gives instant feedback and never
        // blocks moving on, so a deck stays usable without it.
        check: z
          .object({
            question: z.string().min(1).max(200),
            options: z.array(z.string().min(1).max(160)).min(2).max(4),
            answerIndex: z.number().int().min(0).max(3),
            explanation: z.string().min(1).max(300),
          })
          .optional(),
      }),
    )
    .min(2)
    .max(10),
});

export type SlidesConfig = z.infer<typeof slidesConfigSchema>;
