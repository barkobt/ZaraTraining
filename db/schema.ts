import {
  mysqlTable,
  serial,
  varchar,
  json,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

export const participants = mysqlTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  answers: json("answers").notNull(),
  totalScore: int("total_score").notNull(),
  cabin: varchar("cabin", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});