import { eq, and } from "drizzle-orm";
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

export async function addForbiddenPair(storeId: number, roleA: string, roleB: string) {
  const db = getDb();
  await db
    .insert(forbiddenRolePairs)
    .values({ storeId, roleA, roleB })
    .onConflictDoNothing();
}

export async function removeForbiddenPair(storeId: number, roleA: string, roleB: string) {
  const db = getDb();
  await db
    .delete(forbiddenRolePairs)
    .where(
      and(
        eq(forbiddenRolePairs.storeId, storeId),
        eq(forbiddenRolePairs.roleA, roleA),
        eq(forbiddenRolePairs.roleB, roleB),
      ),
    );
}
