// src/db/schema.ts
import { pgTable, text, varchar, integer, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const links = pgTable('links', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalUrl: text('original_url').notNull(),
  shortCode: varchar('short_code', { length: 20 }).notNull().unique(),
  accessCount: integer('access_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Índice para acelerar listagens e consultas pelo short code.
    shortCodeIdx: index('short_code_idx').on(table.shortCode),
  };
});