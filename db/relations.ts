import { relations } from "drizzle-orm";
import {
  stores,
  staff,
  competencies,
  solverConfig,
  forbiddenRolePairs,
  charts,
  buenasStoreSettings,
  challenges,
  dailyRecords,
  specialDays,
  buenasUsers,
  coefficientSamples,
} from "./schema.js";

export const storesRelations = relations(stores, ({ many, one }) => ({
  staff: many(staff),
  forbiddenPairs: many(forbiddenRolePairs),
  charts: many(charts),
  config: one(solverConfig, {
    fields: [stores.id],
    references: [solverConfig.storeId],
  }),
  // Buenas Dias modülü — aynı store'a bağlı çoklu/tekli kayıtlar.
  buenasSettings: one(buenasStoreSettings, {
    fields: [stores.id],
    references: [buenasStoreSettings.storeId],
  }),
  challenges: many(challenges),
  dailyRecords: many(dailyRecords),
  specialDays: many(specialDays),
  buenasUsers: many(buenasUsers),
  coefficientSamples: many(coefficientSamples),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  store: one(stores, {
    fields: [staff.storeId],
    references: [stores.id],
  }),
  competencies: many(competencies),
}));

export const competenciesRelations = relations(competencies, ({ one }) => ({
  staff: one(staff, {
    fields: [competencies.staffId],
    references: [staff.id],
  }),
}));

export const solverConfigRelations = relations(solverConfig, ({ one }) => ({
  store: one(stores, {
    fields: [solverConfig.storeId],
    references: [stores.id],
  }),
}));

export const forbiddenRolePairsRelations = relations(forbiddenRolePairs, ({ one }) => ({
  store: one(stores, {
    fields: [forbiddenRolePairs.storeId],
    references: [stores.id],
  }),
}));

export const chartsRelations = relations(charts, ({ one }) => ({
  store: one(stores, {
    fields: [charts.storeId],
    references: [stores.id],
  }),
}));

// ── Buenas Dias ilişkileri ──────────────────────────────────────────────────

export const buenasStoreSettingsRelations = relations(buenasStoreSettings, ({ one }) => ({
  store: one(stores, {
    fields: [buenasStoreSettings.storeId],
    references: [stores.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  store: one(stores, {
    fields: [challenges.storeId],
    references: [stores.id],
  }),
}));

export const dailyRecordsRelations = relations(dailyRecords, ({ one }) => ({
  store: one(stores, {
    fields: [dailyRecords.storeId],
    references: [stores.id],
  }),
}));

export const specialDaysRelations = relations(specialDays, ({ one }) => ({
  store: one(stores, {
    fields: [specialDays.storeId],
    references: [stores.id],
  }),
}));

export const buenasUsersRelations = relations(buenasUsers, ({ one }) => ({
  store: one(stores, {
    fields: [buenasUsers.storeId],
    references: [stores.id],
  }),
}));

export const coefficientSamplesRelations = relations(coefficientSamples, ({ one }) => ({
  store: one(stores, {
    fields: [coefficientSamples.storeId],
    references: [stores.id],
  }),
}));
