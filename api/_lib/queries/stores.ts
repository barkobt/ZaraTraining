import { eq, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { stores, staff, competencies, charts } from "../../../db/schema.js";

export async function getStore(id: number) {
  const db = getDb();
  const [row] = await db.select().from(stores).where(eq(stores.id, id));
  return row ?? null;
}

export async function updateStore(
  id: number,
  patch: Partial<{ code: string; name: string; section: string }>,
) {
  const db = getDb();
  const [row] = await db
    .update(stores)
    .set(patch)
    .where(eq(stores.id, id))
    .returning();
  return row ?? null;
}

export async function getSystemInfo(storeId: number) {
  const db = getDb();
  const [staffCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(staff)
    .where(eq(staff.storeId, storeId));
  const [competencyCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(competencies);
  const [chartCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(charts)
    .where(eq(charts.storeId, storeId));
  return {
    staff: staffCount?.c ?? 0,
    competencies: competencyCount?.c ?? 0,
    charts: chartCount?.c ?? 0,
  };
}
