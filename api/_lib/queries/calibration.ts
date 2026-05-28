import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { coefficients, coefficientSamples } from "../../../db/schema.js";
import {
  computeAverage,
  computeSampleValue,
  pickDominantCoefficient,
  CALIBRATION_MIN_SAMPLES,
} from "../buenas-dias/calibration.js";
import type {
  CoefficientType,
  DayType,
  Weather,
} from "../../../contracts/buenas-dias.js";

/**
 * Bir gün `GERCEKLESTI`'ye geçtiğinde çağrılır (spec §3.2).
 * `closeDay`'in son adımı olarak DB transaction'ı dışında side effect.
 *
 * Akış:
 *   1. Günün target/actual TL'sini ve bağlamını oku.
 *   2. Dominant katsayıyı seç.
 *   3. Geriye doğru sample hesapla.
 *   4. `coefficient_samples` tablosuna yaz.
 *   5. Aynı tip için uygulanmamış örnekleri çek, 3+ varsa ortalama → `lastSuggestedValue`.
 *   6. `coefficients.sample_count` güncellenir (uygulanmamış sayı).
 *
 * Hata fırlatmaz — kalibrasyon başarısız olursa close akışını bozmaz, sadece log basar.
 */
export async function recordCalibrationSample(input: {
  storeId: number;
  date: string;
  actualTotalTl: number | null;
  targetTotalTl: number | null;
  dayType: DayType;
  isSpecialDay: boolean;
  weather: Weather;
}): Promise<{
  type: CoefficientType;
  sampledValue: number;
  suggested: number | null;
  uncappliedCount: number;
} | null> {
  try {
    const db = getDb();
    const type = pickDominantCoefficient({
      dayType: input.dayType,
      isSpecialDay: input.isSpecialDay,
      weather: input.weather,
    });

    // Mevcut katsayı kaydı.
    const [coef] = await db
      .select()
      .from(coefficients)
      .where(eq(coefficients.type, type));
    if (!coef) {
      console.warn(`[calibration] coefficient '${type}' DB'de yok, atlanıyor`);
      return null;
    }

    // Geriye doğru gerçek katsayı.
    const sampledValue = computeSampleValue(
      coef.currentValue,
      input.actualTotalTl,
      input.targetTotalTl,
    );
    if (sampledValue == null) {
      // Hedef veya aktüel eksik — sample üretilemez.
      return null;
    }

    // Örnek yaz.
    await db.insert(coefficientSamples).values({
      storeId: input.storeId,
      coefficientType: type,
      date: input.date,
      sampledValue,
      appliedAt: null,
    });

    // Uygulanmamış örnekleri çek + ortalama.
    const samples = await db
      .select({ v: coefficientSamples.sampledValue })
      .from(coefficientSamples)
      .where(
        and(
          eq(coefficientSamples.coefficientType, type),
          isNull(coefficientSamples.appliedAt),
        ),
      );
    const values = samples.map((s) => s.v);
    const suggested = computeAverage(values);

    // coefficients.sample_count + lastSuggestedValue güncellenir.
    await db
      .update(coefficients)
      .set({
        sampleCount: values.length,
        lastSuggestedValue: suggested,
        updatedAt: sql`now()`,
      })
      .where(eq(coefficients.type, type));

    return {
      type,
      sampledValue,
      suggested,
      uncappliedCount: values.length,
    };
  } catch (err) {
    console.error("[calibration] sample kaydı başarısız:", err);
    return null;
  }
}

/**
 * Bekleyen kalibrasyon önerileri — `lastSuggestedValue` null değilse listeye gir.
 * Spec §3.2 §4.4: UI bunu okur ve yöneticiye "uygula / şimdilik kalsın" sorar.
 */
export async function listPendingCalibrations() {
  const db = getDb();
  const rows = await db.select().from(coefficients);
  return rows.filter(
    (r) =>
      r.lastSuggestedValue != null &&
      r.sampleCount >= CALIBRATION_MIN_SAMPLES &&
      r.lastSuggestedValue !== r.currentValue,
  );
}

/**
 * Bir öneriyi uygula — currentValue = lastSuggestedValue.
 * İlgili tüm uygulanmamış örnekler "uygulandı" olarak işaretlenir; sample_count sıfırlanır,
 * lastSuggestedValue null'a çekilir.
 */
export async function applyCalibration(type: CoefficientType) {
  const db = getDb();
  const [coef] = await db
    .select()
    .from(coefficients)
    .where(eq(coefficients.type, type));
  if (!coef || coef.lastSuggestedValue == null) return null;

  // currentValue güncelle, sample_count sıfırla.
  const [updated] = await db
    .update(coefficients)
    .set({
      currentValue: coef.lastSuggestedValue,
      sampleCount: 0,
      lastSuggestedValue: null,
      updatedAt: sql`now()`,
    })
    .where(eq(coefficients.type, type))
    .returning();

  // İlgili tüm örnekleri uygulanmış olarak işaretle (geçmiş arşivi).
  await db
    .update(coefficientSamples)
    .set({ appliedAt: sql`now()` })
    .where(
      and(
        eq(coefficientSamples.coefficientType, type),
        isNull(coefficientSamples.appliedAt),
      ),
    );

  return updated;
}

/**
 * Bir öneriyi reddet — currentValue korunur, sadece `lastSuggestedValue` null'a çekilir.
 * Sample'lar appliedAt'siz kalır; ileride yeni örnek geldiğinde tekrar değerlendirilir.
 *
 * NOT: Bu, "şimdilik kalsın" demek. Bir sonraki kapanışta yine ortalama hesaplanır;
 * eğer hâlâ farklı bir değer öneriyorsa kullanıcıya tekrar sorulur. Bu, spec §3.2'nin
 * "kullanıcı reddederse eski değer kalır" davranışıyla uyumlu.
 */
export async function rejectCalibration(type: CoefficientType) {
  const db = getDb();
  const [updated] = await db
    .update(coefficients)
    .set({ lastSuggestedValue: null, updatedAt: sql`now()` })
    .where(eq(coefficients.type, type))
    .returning();
  return updated;
}
