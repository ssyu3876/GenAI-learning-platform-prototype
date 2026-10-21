// Relative imports: drizzle-kit loads schema files outside Next.js (no "@/" alias).
import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { classes } from '../../core/db/schema';
import type { MisconceptionSummary } from './insights';

/** Latest AI summary of common misconceptions per class. Regenerated on request. */
export const classInsightSummaries = pgTable('class_insight_summaries', {
  classId: text()
    .primaryKey()
    .references(() => classes.id, { onDelete: 'cascade' }),
  content: jsonb().$type<MisconceptionSummary>().notNull(),
  // true when the offline fallback wrote it (no AI key, limit reached or provider error)
  mocked: boolean().notNull().default(false),
  // Total quiz answers the summary was based on, to show when it is out of date
  answerCount: integer().notNull().default(0),
  generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
