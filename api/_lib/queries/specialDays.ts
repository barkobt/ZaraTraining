import { and, eq, lte, gte } from "drizzle-orm";
import { getDb } from "./connection.js";
import { specialDays } from "../../../db/schema.js";

/**
 * Verilen tarih, hangi özel günün (varsa) aralığına düşüyor?
 * 'YYYY-MM-DD' formatında tarih. `start_date <= date <= end_date` araması.
 * Birden fazla özel gün aynı tarihe denk gelirse: ilki döner (öncelik için
 * gelecekte `priority` sütunu eklenebilir). Şu an mağazaya tek özel gün
 * kuralı uygulanır (spec §3.1'deki çarpan).
 */
export async function findSpecialDay(storeId: number, date: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(specialDays)
    .where(
      and(
        eq(specialDays.storeId, storeId),
        lte(specialDays.startDate, date),
        gte(specialDays.endDate, date),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listSpecialDays(storeId: number) {
  const db = getDb();
  return db.select().from(specialDays).where(eq(specialDays.storeId, storeId));
}

export async function upsertSpecialDay(input: {
  id?: number;
  storeId: number;
  name: string;
  startDate: string;
  endDate: string;
  coefficient: number;
}) {
  const db = getDb();
  if (input.id) {
    const [row] = await db
      .update(specialDays)
      .set({
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        coefficient: input.coefficient,
      })
      .where(eq(specialDays.id, input.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(specialDays)
    .values({
      storeId: input.storeId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      coefficient: input.coefficient,
    })
    .returning();
  return row;
}

export async function deleteSpecialDay(id: number) {
  const db = getDb();
  await db.delete(specialDays).where(eq(specialDays.id, id));
  return { ok: true };
}
