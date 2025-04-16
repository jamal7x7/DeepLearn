import { pgTable, varchar, boolean } from 'drizzle-orm/pg-core';

export const featureFlags = pgTable('feature_flags', {
  key: varchar('key', { length: 64 }).primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
});
