import { eq } from "drizzle-orm";
import { getDb } from "./connection.js";
import { coefficients } from "../../../db/schema.js";
import {
  COEFFICIENT_TYPE,
  DEFAULT_COEFFICIENTS,
  type CoefficientType,
} from "../../../contracts/buenas-dias.js";
import type { EngineCoefficients } from "../buenas-dias/engine-a.js";

export async function listCoefficients() {
  const db = getDb();
  return db.select().from(coefficients);
}

export async function getCoefficient(type: CoefficientType) {
  const db = getDb();
  const [row] = await db.select().from(coefficients).where(eq(coefficients.type, type));
  return row ?? null;
}

/**
 * DB'deki 6 katsayı satırını Motor A'nın beklediği tek nesneye dönüştürür.
 * Eksik bir satır varsa (örn. seed çalıştırılmadıysa) `DEFAULT_COEFFICIENTS`'ten
 * fallback değer kullanır — motor hata vermez, log'lanır.
 */
export async function getEngineCoefficients(): Promise<EngineCoefficients> {
  const rows = await listCoefficients();
  const byType = new Map(rows.map((r) => [r.type, r.currentValue]));

  function pick(type: CoefficientType): number {
    const v = byType.get(type);
    if (v == null) {
      console.warn(`[buenas-dias] coefficient '${type}' DB'de yok, default kullanılıyor`);
      return DEFAULT_COEFFICIENTS[type];
    }
    return v;
  }

  return {
    stretch: pick("stretch"),
    weekend: pick("weekend"),
    specialDay: pick("special_day"),
    weatherSunny: pick("weather_sunny"),
    weatherNormal: pick("weather_normal"),
    weatherBad: pick("weather_bad"),
  };
}

// `COEFFICIENT_TYPE` import'u — re-export et ki bağlı modüller tek yerden okusun.
export { COEFFICIENT_TYPE };
