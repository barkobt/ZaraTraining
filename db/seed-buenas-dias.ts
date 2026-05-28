/**
 * Buenas Dias modülü seed scripti.
 *
 * Faz 0 çıktısı: store ayarları + 6 katsayı + örnek bir Türkiye özel gün takvimi.
 * Mevcut `seed.ts`'e dokunmaz; idempotent (onConflictDoUpdate / onConflictDoNothing).
 *
 * Çalıştırmak için:
 *   DATABASE_URL=... npx tsx db/seed-buenas-dias.ts
 *   veya
 *   npm run db:seed:buenas-dias
 */
import { getDb } from "../api/_lib/queries/connection.js";
import { buenasStoreSettings, coefficients, specialDays } from "./schema.js";
import {
  COEFFICIENT_TYPE,
  DEFAULT_COEFFICIENTS,
  STORE_DEFAULTS,
} from "../contracts/buenas-dias.js";
import { sql, eq, and } from "drizzle-orm";

// Tek mağaza modeli — mevcut Shift Organizer seed'i ile aynı varsayım.
const STORE_ID = 1;

// 2026 için temel TR özel günleri. Kullanıcı setup ekranından ekleyip
// çıkarabilir; burası sadece "başlangıçta boş kalmasın" amaçlı.
// Tarihler YYYY-MM-DD; spec §2.5'e göre tek gün için startDate=endDate.
const SPECIAL_DAYS_2026 = [
  { name: "Yılbaşı", startDate: "2026-01-01", endDate: "2026-01-01", coefficient: 1.45 },
  {
    name: "Ramazan Bayramı Arefesi",
    startDate: "2026-03-19",
    endDate: "2026-03-19",
    coefficient: 1.6,
  },
  {
    name: "Ramazan Bayramı",
    startDate: "2026-03-20",
    endDate: "2026-03-22",
    coefficient: 0.7, // bayram boyunca trafik düşer — kalibrasyon değişecek
  },
  {
    name: "23 Nisan",
    startDate: "2026-04-23",
    endDate: "2026-04-23",
    coefficient: 1.15,
  },
  { name: "1 Mayıs", startDate: "2026-05-01", endDate: "2026-05-01", coefficient: 1.1 },
  {
    name: "Kurban Bayramı Arefesi",
    startDate: "2026-05-26",
    endDate: "2026-05-26",
    coefficient: 1.6,
  },
  {
    name: "Kurban Bayramı",
    startDate: "2026-05-27",
    endDate: "2026-05-30",
    coefficient: 0.7,
  },
  {
    name: "30 Ağustos",
    startDate: "2026-08-30",
    endDate: "2026-08-30",
    coefficient: 1.15,
  },
  {
    name: "Cumhuriyet Bayramı",
    startDate: "2026-10-29",
    endDate: "2026-10-29",
    coefficient: 1.2,
  },
  { name: "Black Friday", startDate: "2026-11-27", endDate: "2026-11-27", coefficient: 1.8 },
  {
    name: "Yılbaşı Arefesi",
    startDate: "2026-12-31",
    endDate: "2026-12-31",
    coefficient: 1.5,
  },
];

async function seed() {
  const db = getDb();
  console.log("Seeding Buenas Dias module…");

  // 1) Store ayarları — tek satır, storeId=1.
  // Mevcut compran/gap/productivity 0'dan farklıysa override etme:
  // operasyonel hedefler kullanıcı tarafından girilir, seed yalnızca
  // boş/0 durumunda spec default'larıyla başlatır.
  await db
    .insert(buenasStoreSettings)
    .values({
      storeId: STORE_ID,
      compranTarget: STORE_DEFAULTS.compranTarget,
      gapTarget: STORE_DEFAULTS.gapTarget,
      productivityTarget: STORE_DEFAULTS.productivityTarget,
      defaultStretch: STORE_DEFAULTS.defaultStretch,
      weekendWeight: STORE_DEFAULTS.weekendWeight,
      weekendDayFactor: STORE_DEFAULTS.weekendDayFactor,
      city: STORE_DEFAULTS.city,
    })
    .onConflictDoUpdate({
      target: buenasStoreSettings.storeId,
      // Sadece "yapılandırma" alanlarını override et; operasyonel hedefler
      // (compran/gap/productivity) kullanıcı tarafından girildiyse korunsun.
      set: {
        defaultStretch: STORE_DEFAULTS.defaultStretch,
        weekendWeight: STORE_DEFAULTS.weekendWeight,
        weekendDayFactor: STORE_DEFAULTS.weekendDayFactor,
        city: STORE_DEFAULTS.city,
        updatedAt: sql`now()`,
      },
    });
  console.log(`  buenas_store_settings: storeId=${STORE_ID} ✓`);

  // 2) Katsayılar — 6 satır. Eğer kullanıcı kalibre ettiyse currentValue korunur;
  // yeniden seed çalıştırılırsa sadece defaultValue güncellenir.
  for (const type of COEFFICIENT_TYPE) {
    const defaultValue = DEFAULT_COEFFICIENTS[type];
    await db
      .insert(coefficients)
      .values({
        type,
        currentValue: defaultValue,
        defaultValue,
        sampleCount: 0,
        lastSuggestedValue: null,
      })
      .onConflictDoUpdate({
        target: coefficients.type,
        // currentValue'ya dokunma — kullanıcı kalibre etmiş olabilir.
        set: { defaultValue, updatedAt: sql`now()` },
      });
  }
  console.log(`  coefficients: ${COEFFICIENT_TYPE.length} satır ✓`);

  // 3) Özel günler — idempotent ekle (aynı isim+storeId varsa atla).
  // Bu, kullanıcının elle değiştirdiği özel gün katsayılarının ezilmemesi için.
  let added = 0;
  let skipped = 0;
  for (const sd of SPECIAL_DAYS_2026) {
    const existing = await db
      .select({ id: specialDays.id })
      .from(specialDays)
      .where(and(eq(specialDays.storeId, STORE_ID), eq(specialDays.name, sd.name)))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(specialDays).values({
      storeId: STORE_ID,
      name: sd.name,
      startDate: sd.startDate,
      endDate: sd.endDate,
      coefficient: sd.coefficient,
    });
    added++;
  }
  console.log(`  special_days: ${added} eklendi, ${skipped} atlandı ✓`);

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
