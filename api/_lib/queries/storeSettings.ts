import { eq, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { buenasStoreSettings } from "../../../db/schema.js";
import { STORE_DEFAULTS } from "../../../contracts/buenas-dias.js";

/**
 * Tek satır — `buenas_store_settings.storeId = stores.id`.
 * Seed çalıştırıldıysa mevcut; yoksa `STORE_DEFAULTS` ile fallback.
 *
 * Bu pattern (fallback) Motor B'nin ve UI'ın asla "null settings" görmemesi için;
 * setup ekranı eksik kalsa bile sistem çalışır, sadece operasyonel hedefler 0 olur.
 */
export async function getStoreSettings(storeId: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(buenasStoreSettings)
    .where(eq(buenasStoreSettings.storeId, storeId));

  if (row) return row;

  // Fallback — UI uyarı verebilir ama sistem çökmez.
  return {
    storeId,
    compranTarget: STORE_DEFAULTS.compranTarget,
    gapTarget: STORE_DEFAULTS.gapTarget,
    productivityTarget: STORE_DEFAULTS.productivityTarget,
    defaultStretch: STORE_DEFAULTS.defaultStretch,
    weekendWeight: STORE_DEFAULTS.weekendWeight,
    weekendDayFactor: STORE_DEFAULTS.weekendDayFactor,
    city: STORE_DEFAULTS.city,
    updatedAt: new Date(),
  };
}

export async function updateStoreSettings(
  storeId: number,
  patch: Partial<{
    compranTarget: number;
    gapTarget: number;
    productivityTarget: number;
    defaultStretch: number;
    weekendWeight: number;
    weekendDayFactor: number;
    city: string;
  }>,
) {
  const db = getDb();
  // Upsert — satır yoksa yarat.
  const [row] = await db
    .insert(buenasStoreSettings)
    .values({
      storeId,
      compranTarget: patch.compranTarget ?? STORE_DEFAULTS.compranTarget,
      gapTarget: patch.gapTarget ?? STORE_DEFAULTS.gapTarget,
      productivityTarget: patch.productivityTarget ?? STORE_DEFAULTS.productivityTarget,
      defaultStretch: patch.defaultStretch ?? STORE_DEFAULTS.defaultStretch,
      weekendWeight: patch.weekendWeight ?? STORE_DEFAULTS.weekendWeight,
      weekendDayFactor: patch.weekendDayFactor ?? STORE_DEFAULTS.weekendDayFactor,
      city: patch.city ?? STORE_DEFAULTS.city,
    })
    .onConflictDoUpdate({
      target: buenasStoreSettings.storeId,
      set: { ...patch, updatedAt: sql`now()` },
    })
    .returning();
  return row;
}
