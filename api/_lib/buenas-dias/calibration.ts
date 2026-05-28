/**
 * Kalibrasyon motoru (spec §3.2).
 *
 * Bir gün GERCEKLESTI'ye geçtiğinde:
 *   1. Günün dominant katsayısı belirlenir (özel gün > hava > haftasonu > stretch).
 *   2. Geriye doğru "gerçekte hangi katsayı tutardı?" hesaplanır:
 *        sampled_value = current_value × (actual_total_tl / target_total_tl)
 *   3. Bu değer `coefficient_samples` tablosuna yazılır.
 *   4. Aynı tip için **3+ uygulanmamış örnek** birikince ortalama → `lastSuggestedValue`.
 *   5. Kullanıcıya öneri bildirimi gösterilir (UI tarafı).
 *   6. Kullanıcı onaylarsa `currentValue` güncellenir, örnekler "uygulandı" işaretlenir.
 *
 * Bu dosyada YALNIZCA saf hesap fonksiyonları var; DB/HTTP yok.
 */
import type {
  CoefficientType,
  DayType,
  Weather,
} from "../../../contracts/buenas-dias.js";

/**
 * Bir günün hangi katsayısı kalibre edilmeli? Birden fazla katsayı uygulanmış
 * olabilir; en "ayırt edici" olanı seçeriz (hedeflerin sapmasını en çok
 * açıklayan). Öncelik sırası:
 *   1. Özel gün varsa → `special_day`
 *   2. Hava normal değilse → `weather_sunny` veya `weather_bad`
 *   3. Haftasonu ise → `weekend`
 *   4. Aksi halde → `stretch` (her zaman uygulanan)
 *
 * Sebep: birden çok katsayı varsa hangisi kalibre edilirse o etkili olur.
 * Spec §3.2 örneği özel gün senaryosu — bizim öncelik tablomuz spec'in
 * niyetine uygun.
 */
export function pickDominantCoefficient(ctx: {
  dayType: DayType;
  isSpecialDay: boolean;
  weather: Weather;
}): CoefficientType {
  if (ctx.isSpecialDay) return "special_day";
  if (ctx.weather === "sunny") return "weather_sunny";
  if (ctx.weather === "bad") return "weather_bad";
  if (ctx.dayType === "haftasonu") return "weekend";
  // weather_normal her zaman 1.00 olduğu için kalibrasyonu anlamsız; bu durumda
  // stretch'i kalibre ederiz — her gün uygulanan tek katsayıdır.
  return "stretch";
}

/**
 * Geriye doğru "gerçek katsayı" hesabı.
 *
 *   sampled_value = current_value × (actual_total_tl / target_total_tl)
 *
 * Spec §3.2 örneği:
 *   - özel gün katsayısı 1.45 ile hedef 5000 üretildi
 *   - gerçek 5900 çıktı
 *   - sampled = 1.45 × (5900 / 5000) = 1.711
 *
 * Sıfır/null guard: target_total_tl <= 0 veya actual_total_tl null → null döner
 * (örnek üretilemez).
 */
export function computeSampleValue(
  currentValue: number,
  actualTotalTl: number | null,
  targetTotalTl: number | null,
): number | null {
  if (actualTotalTl == null || targetTotalTl == null) return null;
  if (targetTotalTl <= 0) return null;
  if (currentValue <= 0) return null;
  return currentValue * (actualTotalTl / targetTotalTl);
}

/**
 * Verilen örneklerin (uygulanmamış olanların) ortalaması.
 * 3+ örnek yoksa null döner — öneri tetiklenmez.
 */
export const CALIBRATION_MIN_SAMPLES = 3;

export function computeAverage(samples: number[]): number | null {
  if (samples.length < CALIBRATION_MIN_SAMPLES) return null;
  const sum = samples.reduce((a, b) => a + b, 0);
  return sum / samples.length;
}
