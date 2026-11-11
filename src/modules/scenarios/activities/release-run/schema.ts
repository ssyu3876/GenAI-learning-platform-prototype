import { z } from 'zod';

const statKey = z.enum(['budget', 'morale', 'users', 'quality']);

export const releaseRunSchema = z.object({
  intro: z.string().min(1).max(600),
  stats: z
    .array(
      z.object({
        key: statKey,
        label: z.string().min(1).max(40),
        max: z.number().int().positive(),
        danger: z.number().int(),
      }),
    )
    .length(4),
  start: z.object({
    budget: z.number(),
    morale: z.number(),
    users: z.number(),
    quality: z.number(),
  }),
  rounds: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        tagline: z.string().min(1).max(160),
        steps: z
          .array(
            z.object({
              title: z.string().min(1).max(120),
              body: z.string().min(1).max(600),
              choices: z
                .array(
                  z.object({
                    id: z.string().min(1).max(64),
                    label: z.string().min(1).max(160),
                    cost: z.string().min(1).max(60),
                    effects: z
                      .object({
                        budget: z.number().optional(),
                        morale: z.number().optional(),
                        users: z.number().optional(),
                        quality: z.number().optional(),
                      })
                      .default({}),
                    outcome: z.string().min(1).max(600),
                  }),
                )
                .min(2)
                .max(4),
            }),
          )
          .min(1)
          .max(3),
      }),
    )
    .min(1)
    .max(5),
  endings: z.object({
    clean: z.object({ title: z.string(), body: z.string(), takeaway: z.string() }),
    bruised: z.object({ title: z.string(), body: z.string(), takeaway: z.string() }),
    burned: z.object({ title: z.string(), body: z.string(), takeaway: z.string() }),
  }),
});

export type ReleaseRunConfig = z.infer<typeof releaseRunSchema>;
