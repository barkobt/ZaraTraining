import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { challenges, dailyRecords } from "../../../db/schema.js";
import { TIER2_MULTIPLIER } from "../../../contracts/buenas-dias.js";

/**
 * Verilen tarihin (YYYY-MM-DD) hangi aylık challenge aralığında olduğunu bul.
 * `start_date <= date <= end_date` araması — challenge'lar takvim ayını
 * tam kapsayacak şekilde tanımlandığı için tek bir kayıt eşleşmeli.
 */
export async function getActiveChallenge(storeId: number, date: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.storeId, storeId),
        lte(challenges.startDate, date),
        gte(challenges.endDate, date),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Verilen tarih aralığında, **yalnızca GERCEKLESTI** statüsündeki günlerin
 * `actual_total_tl` toplamı. Bu, spec §3.5'in çekirdek kuralı:
 * kümülatif TL toplamı saklanmaz, her sorguda yeniden türevlenir.
 *
 * Sonuç hiçbir satır yoksa 0 döner.
 */
export async function getCumulativeTl(
  storeId: number,
  startDate: string,
  endDate: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      sum: sql<number>`COALESCE(SUM(${dailyRecords.actualTotalTl}), 0)::float`,
    })
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.storeId, storeId),
        eq(dailyRecords.status, "GERCEKLESTI"),
        gte(dailyRecords.date, startDate),
        lte(dailyRecords.date, endDate),
      ),
    );
  return row?.sum ?? 0;
}

export async function listChallenges(storeId: number) {
  const db = getDb();
  return db.select().from(challenges).where(eq(challenges.storeId, storeId));
}

/**
 * Bir challenge oluştur veya güncelle. tier2 her zaman tier1 × 1.15 ile yenilenir.
 * Çakışma anahtarı: (storeId, month) — buenas_challenges_store_month_unique.
 */
export async function upsertChallenge(input: {
  storeId: number;
  month: string;
  tier1TargetTl: number;
  startDate: string;
  endDate: string;
  avgBasketTl?: number | null;
}) {
  const db = getDb();
  const tier2 = input.tier1TargetTl * TIER2_MULTIPLIER;
  const [row] = await db
    .insert(challenges)
    .values({
      storeId: input.storeId,
      month: input.month,
      tier1TargetTl: input.tier1TargetTl,
      tier2TargetTl: tier2,
      startDate: input.startDate,
      endDate: input.endDate,
      avgBasketTl: input.avgBasketTl ?? null,
    })
    .onConflictDoUpdate({
      target: [challenges.storeId, challenges.month],
      set: {
        tier1TargetTl: input.tier1TargetTl,
        tier2TargetTl: tier2,
        startDate: input.startDate,
        endDate: input.endDate,
        avgBasketTl: input.avgBasketTl ?? null,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return row;
}
