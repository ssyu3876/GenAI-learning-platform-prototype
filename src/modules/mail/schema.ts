// Internal mail between signed-in users.
// One row is one message. Replies point at a thread root; recipient-side flags (archive,
// delete) live in mail_user_state so each mailbox can change independently.
import { index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../core/db/schema';

export type MailCopyType = 'to' | 'cc' | 'bcc';

export const mailMessages = pgTable(
  'mail_messages',
  {
    id: text().primaryKey(),
    senderId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subject: text().notNull(),
    body: text().notNull(),
    /** Root message id. Null on legacy rows, treated as this message's own id. */
    threadId: text(),
    /** The message this one replies to. */
    parentId: text(),
    /** Envelope: all Cc/Bcc users, repeated on each recipient's copy. */
    ccIds: jsonb().$type<string[]>().notNull().default([]),
    bccIds: jsonb().$type<string[]>().notNull().default([]),
    /** How this particular copy reached its recipient. */
    copyType: text().$type<MailCopyType>().notNull().default('to'),
    /** Null while the recipient has not opened the message. */
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.recipientId, t.createdAt),
    index().on(t.senderId, t.createdAt),
    index().on(t.threadId, t.createdAt),
  ],
);

/** Per-user mailbox flags. A message can be archived/deleted by one side only. */
export const mailUserState = pgTable(
  'mail_user_state',
  {
    messageId: text()
      .notNull()
      .references(() => mailMessages.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    archivedAt: timestamp({ withTimezone: true }),
    deletedAt: timestamp({ withTimezone: true }),
    purgedAt: timestamp({ withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })],
);

/** Inbox notification switches live in the core schema so other modules can honour them. */

/** Small attachments, stored as base64 text in the local/prototype database. */
export const mailAttachments = pgTable(
  'mail_attachments',
  {
    id: text().primaryKey(),
    messageId: text()
      .notNull()
      .references(() => mailMessages.id, { onDelete: 'cascade' }),
    filename: text().notNull(),
    mimeType: text().notNull().default('application/octet-stream'),
    size: integer().notNull(),
    data: text().notNull(),
  },
  (t) => [index().on(t.messageId)],
);

/** Unsent composer state, including multiple recipients and an optional class audience. */
export const mailDrafts = pgTable('mail_drafts', {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipientIds: jsonb().$type<string[]>().notNull().default([]),
  ccIds: jsonb().$type<string[]>().notNull().default([]),
  bccIds: jsonb().$type<string[]>().notNull().default([]),
  classId: text(),
  subject: text().notNull().default(''),
  body: text().notNull().default(''),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type MailMessage = typeof mailMessages.$inferSelect;
export type MailDraft = typeof mailDrafts.$inferSelect;
