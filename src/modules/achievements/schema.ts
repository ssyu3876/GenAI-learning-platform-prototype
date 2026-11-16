// Badge predicates are computed from progress, so this table only records the first time a
// badge became known to the learner. It gives the mail notification a stable "new badge"
// boundary without changing the badge catalogue itself.
import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../core/db/schema';

export const badgeAwards = pgTable(
  'badge_awards',
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text().notNull(),
    awardedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);
