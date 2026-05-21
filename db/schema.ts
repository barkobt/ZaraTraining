import {
  pgTable,
  serial,
  varchar,
  jsonb,
  integer,
  timestamp,
  boolean,
  text,
  date,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  answers: jsonb("answers").notNull(),
  totalScore: integer("total_score").notNull(),
  cabin: varchar("cabin", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  section: varchar("section", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staff = pgTable(
  "staff",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    shortName: varchar("short_name", { length: 30 }).notNull(),
    tenureLevel: varchar("tenure_level", { length: 20 }).notNull(),
    isManager: boolean("is_manager").notNull().default(false),
    isBlacklisted: boolean("is_blacklisted").notNull().default(false),
    note: text("note"),
    hireDate: date("hire_date"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeIdx: index("idx_staff_store").on(t.storeId),
    storeShortUnique: uniqueIndex("staff_store_short_name_unique").on(t.storeId, t.shortName),
  }),
);

export const competencies = pgTable(
  "competencies",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    level: integer("level").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.staffId, t.role] }),
    staffIdx: index("idx_competencies_staff").on(t.staffId),
  }),
);

export const solverConfig = pgTable("solver_config", {
  storeId: integer("store_id")
    .primaryKey()
    .references(() => stores.id),
  competencyWeight: real("competency_weight").notNull().default(2.0),
  fairnessWeight: real("fairness_weight").notNull().default(0.3),
  managerMorningPenalty: integer("manager_morning_penalty").notNull().default(50),
  managerNormalPenalty: integer("manager_normal_penalty").notNull().default(500),
  dualPenalty: integer("dual_penalty").notNull().default(100),
  sprinterDualPenalty: integer("sprinter_dual_penalty").notNull().default(300),
  buddyViolationPenalty: integer("buddy_violation_penalty").notNull().default(200),
  maxConsecutiveHours: integer("max_consecutive_hours").notNull().default(4),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forbiddenRolePairs = pgTable(
  "forbidden_role_pairs",
  {
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    roleA: varchar("role_a", { length: 20 }).notNull(),
    roleB: varchar("role_b", { length: 20 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storeId, t.roleA, t.roleB] }),
  }),
);

export const charts = pgTable(
  "charts",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").references(() => stores.id),
    shiftDate: date("shift_date").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id"),
    shiftData: jsonb("shift_data").notNull(),
    chartData: jsonb("chart_data").notNull(),
    qualityScore: real("quality_score"),
    configSnapshot: jsonb("config_snapshot"),
    responsibilities: jsonb("responsibilities"),
    status: varchar("status", { length: 20 }).notNull().default("generated"),
  },
  (t) => ({
    storeDateIdx: index("idx_charts_store_date").on(t.storeId, t.shiftDate),
  }),
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 20 }),
  entityId: integer("entity_id"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
