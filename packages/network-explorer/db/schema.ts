import { text, pgTable, jsonb } from "drizzle-orm/pg-core";
export const keyValues = pgTable("key_values", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
