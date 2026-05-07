import {
  pgTable,
  serial,
  varchar,
  jsonb,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  answers: jsonb("answers").notNull(),
  totalScore: integer("total_score").notNull(),
  cabin: varchar("cabin", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
