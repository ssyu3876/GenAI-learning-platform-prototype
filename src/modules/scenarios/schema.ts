// Relative imports: drizzle-kit loads schema files outside Next.js (no "@/" alias).
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from '../../core/db/schema';

export type RunStatus = 'active' | 'finished';

/**
 * One row per learner per scenario variant. `state` is the whole run (steps taken, stats,
 * history) so a scenario can be resumed on any device; `bestScore` survives a replay.
 * Interview variants use keys like `interview:behavioral`.
 */
export const scenarioRuns = pgTable(
  'scenario_runs',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** ship-it | sprint-zero | interview:<typeId> */
    scenarioKey: text().notNull(),
    status: text().$type<RunStatus>().notNull().default('active'),
    /** RunState from engine.ts. Validated with zod on write. */
    state: jsonb().$type<unknown>().notNull(),
    /** 0-100, best across replays */
    bestScore: integer().notNull().default(0),
    /** How many times this scenario has been finished */
    completions: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('scenario_runs_user_key_idx').on(t.userId, t.scenarioKey),
    index('scenario_runs_user_idx').on(t.userId),
  ],
);
