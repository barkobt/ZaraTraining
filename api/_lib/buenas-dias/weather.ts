/**
 * Open-Meteo entegrasyonu — anahtar gerektirmeyen hava durumu API'si.
 * Spec §7.1: Sonuç sunny/normal/bad üç kategoriye eşlenir.
 *
 * WMO weather code referansı: https://open-meteo.com/en/docs
 *   0       → Açık (clear)
 *   1-3     → Parçalı bulutlu / kapalı
 *   45-48   → Sisli
 *   51-67   → Çiseleme / yağmur
 *   71-77   → Kar
 *   80-86   → Sağanak
 *   95-99   → Fırtına
 */
import type { Weather } from "../../../contracts/buenas-dias.js";

/**
 * Şehir adından koordinatlara basit eşleme. Mağaza tek olduğu için
 * geocoding API'sine çıkmaya gerek yok; çoklu mağaza geldiğinde Open-Meteo
 * geocoding ucu eklenir.
 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "Bornova,Izmir": { lat: 38.4623, lon: 27.2169 },
  Bornova: { lat: 38.4623, lon: 27.2169 },
  Izmir: { lat: 38.4192, lon: 27.1287 },
};

const DEFAULT_COORDS = CITY_COORDS["Bornova,Izmir"];

export function mapWeatherCode(code: number): Weather {
  if (code === 0) return "sunny";
  if (code >= 51) return "bad"; // yağmur ve üstü
  return "normal"; // bulutlu, sisli, parçalı
}

export type WeatherFetchResult = {
  weather: Weather;
  weatherCode: number;
  temperatureC: number | null;
  source: "open-meteo" | "fallback";
  city: string;
};

/**
 * Verilen şehrin bugünkü hava durumunu çek. Ağ hatası/zaman aşımı durumunda
 * 'normal' fallback'ine düşer ve `source: "fallback"` döndürür — sistem çökmez,
 * UI uyarı verir.
 */
export async function fetchWeatherToday(city: string): Promise<WeatherFetchResult> {
  const coords = CITY_COORDS[city] ?? DEFAULT_COORDS;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set("current", "weather_code,temperature_2m");
  url.searchParams.set("timezone", "auto");

  try {
    // 5 saniyelik timeout — toplantı öncesi UI ekstra bekleme istemez.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const json = (await res.json()) as {
      current?: { weather_code?: number; temperature_2m?: number };
    };
    const code = json.current?.weather_code ?? 0;
    return {
      weather: mapWeatherCode(code),
      weatherCode: code,
      temperatureC: json.current?.temperature_2m ?? null,
      source: "open-meteo",
      city,
    };
  } catch (err) {
    console.warn("[buenas-dias] Open-Meteo başarısız, fallback 'normal':", err);
    return {
      weather: "normal",
      weatherCode: -1,
      temperatureC: null,
      source: "fallback",
      city,
    };
  }
}
