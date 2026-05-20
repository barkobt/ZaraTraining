import { relations } from "drizzle-orm";
import {
  stores,
  staff,
  competencies,
  solverConfig,
  forbiddenRolePairs,
  charts,
} from "./schema.js";

export const storesRelations = relations(stores, ({ many, one }) => ({
  staff: many(staff),
  forbiddenPairs: many(forbiddenRolePairs),
  charts: many(charts),
  config: one(solverConfig, {
    fields: [stores.id],
    references: [solverConfig.storeId],
  }),
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
