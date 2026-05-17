import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./connection.js";
import { charts } from "../../../db/schema.js";

export async function insertChart(data: {
  storeId: number;
  shiftDate: string;
  userId?: string | null;
  shiftData: unknown;
  chartData: unknown;
  qualityScore?: number | null;
  configSnapshot?: unknown;
  status?: string;
}) {
  const db = getDb();
  const [row] = await db
    .insert(charts)
    .values({
      storeId: data.storeId,
      shiftDate: data.shiftDate,
      userId: data.userId ?? null,
      shiftData: data.shiftData,
      chartData: data.chartData,
      qualityScore: data.qualityScore ?? null,
      configSnapshot: data.configSnapshot ?? null,
      status: data.status ?? "generated",
    })
    .returning();
  return row;
}

export async function getChartById(id: number) {
  const db = getDb();
  const [row] = await db.select().from(charts).where(eq(charts.id, id));
  return row ?? null;
}

export async function listChartsForStore(storeId: number, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(charts)
    .where(eq(charts.storeId, storeId))
    .orderBy(desc(charts.shiftDate), desc(charts.generatedAt))
    .limit(limit);
}

export async function findChartByDate(storeId: number, shiftDate: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(charts)
    .where(and(eq(charts.storeId, storeId), eq(charts.shiftDate, shiftDate)))
    .orderBy(desc(charts.generatedAt))
    .limit(1);
  return row ?? null;
}
