import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const shortLinks = pgTable('short_links', {
  slug: text('slug').primaryKey(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ShortLink = typeof shortLinks.$inferSelect;
export type NewShortLink = typeof shortLinks.$inferInsert;
