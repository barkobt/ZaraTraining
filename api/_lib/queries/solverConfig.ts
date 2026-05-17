import { eq } from "drizzle-orm";
import { getDb } from "./connection.js";
import { solverConfig, forbiddenRolePairs } from "../../../db/schema.js";

export async function getSolverConfig(storeId: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(solverConfig)
    .where(eq(solverConfig.storeId, storeId));
  return row ?? null;
}

export async function upsertSolverConfig(
  storeId: number,
  patch: Partial<{
    competencyWeight: number;
    fairnessWeight: number;
    managerMorningPenalty: number;
    managerNormalPenalty: number;
    dualPenalty: number;
    sprinterDualPenalty: number;
    buddyViolationPenalty: number;
    maxConsecutiveHours: number;
  }>,
) {
  const db = getDb();
  const [row] = await db
    .insert(solverConfig)
    .values({ storeId, ...patch })
    .onConflictDoUpdate({
      target: solverConfig.storeId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function listForbiddenPairs(storeId: number) {
  const db = getDb();
  return db
    .select()
    .from(forbiddenRolePairs)
    .where(eq(forbiddenRolePairs.storeId, storeId));
}
