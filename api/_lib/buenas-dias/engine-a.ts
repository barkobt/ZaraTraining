/**
 * Motor A — Günlük Hedef Hesabı (spec §3.1).
 *
 * "Bugün gerçekçi olarak ne yapılır?" sorusunu cevaplar. Geçen haftanın aynı
 * gününü baz alır; üstüne katsayıları çarpar:
 *
 *     hedef = ref × stretch × dayType × specialDay × weather
 *
 * - **Adet/TL için ayrı ayrı çalışır:** Aynı formül, sadece referans değer farklı.
 * - **9 reyon hücresi için ayrı ayrı çalışır:** Her hücrenin geçen hafta değeri
 *   baz alınarak aynı katsayılar uygulanır. `target_total_adet` 9 hücrenin
 *   TOPLAMI olarak türetilir — bu kasıtlı, tutarlılık için.
 * - **Productivity adet hattına bağlı:** `target_total_adet / planned_sint`.
 *   `planned_sint` yoksa null döner.
 * - **Şeffaflık ilkesi:** Her hücre çıktısı `EngineABreakdown` ile gelir —
 *   katsayı zinciri geriye doğru okunabilir.
 *
 * Bu dosyada YALNIZCA saf fonksiyonlar var; DB/HTTP/zaman bilgisi dışarıda kalır.
 * Engine'i çağıran kod (router, scripts) katsayıları DB'den okuyup buraya
 * `EngineCoefficients` olarak verir.
 */
import {
  REYON,
  URUN_GRUBU,
  sumReyonGrid,
  type EngineABreakdown,
  type IpodGrid,
  type ReyonGrid,
  type Weather,
  type DayType,
} from "../../../contracts/buenas-dias.js";

/**
 * Bir günün hesap bağlamı — Motor A'nın `dayType × specialDay × weather`
 * çarpanlarını belirleyen tüm girdiler tek tipte.
 */
export type DayContext = {
  dayType: DayType;
  isSpecialDay: boolean;
  /** Özel günse o günün kendi katsayısı (`special_days.coefficient`). 0 veya negatif olmaz. */
  specialDayCoefficient?: number;
  weather: Weather;
};

/**
 * Motor A'nın kullandığı tüm katsayılar — DB'deki `coefficients` tablosundan
 * okunup tek bir nesneye sığdırılmış hali. Engine bu nesneyi atomik olarak
 * tüketir; tek bir alan eksikse hesap yapılmaz.
 */
export type EngineCoefficients = {
  stretch: number; // ör. 1.03
  weekend: number; // haftasonu çarpanı, ör. 1.30
  weatherSunny: number; // ör. 1.15
  weatherNormal: number; // ör. 1.00
  weatherBad: number; // ör. 0.85
  /** Özel gün katsayısı — yalnızca özel günün kendi `coefficient` alanı yoksa fallback olarak kullanılır. */
  specialDay: number; // ör. 1.45
};

// ─── Yardımcı: bağlamdan ve katsayılardan çarpanları çıkar ──────────────────

function dayTypeMultiplier(ctx: DayContext, coefs: EngineCoefficients): number {
  return ctx.dayType === "haftasonu" ? coefs.weekend : 1;
}

function specialDayMultiplier(ctx: DayContext, coefs: EngineCoefficients): number {
  if (!ctx.isSpecialDay) return 1;
  // Özel günün kendi katsayısı varsa onu kullan; yoksa global `special_day` katsayısı.
  return ctx.specialDayCoefficient ?? coefs.specialDay;
}

function weatherMultiplier(ctx: DayContext, coefs: EngineCoefficients): number {
  switch (ctx.weather) {
    case "sunny":
      return coefs.weatherSunny;
    case "normal":
      return coefs.weatherNormal;
    case "bad":
      return coefs.weatherBad;
  }
}

// ─── Tek hücre hesabı (Adet veya TL — fark etmez, sadece ref farklı) ────────

/**
 * Tek bir hücre için Motor A çıktısı. Saf fonksiyon — yan etki yok.
 *
 * Hata vermeyen, sayısal-güvenli bir hesap: negatif ref geçilirse `value=0`
 * dönmek yerine olduğu gibi geçer (çağıran tarafın doğrulaması bekleniyor).
 * `ref=null` durumunu burada modellemiyoruz — çağıran 0 ya da null'ı kendi yorumlar.
 */
export function calculateCell(ref: number, ctx: DayContext, coefs: EngineCoefficients): EngineABreakdown {
  const stretch = coefs.stretch;
  const weekend = dayTypeMultiplier(ctx, coefs);
  const specialDay = specialDayMultiplier(ctx, coefs);
  const weather = weatherMultiplier(ctx, coefs);
  const value = ref * stretch * weekend * specialDay * weather;
  return { ref, stretch, weekend, specialDay, weather, value };
}

// ─── 9 reyon hücresi (3 reyon × 3 ürün grubu) ───────────────────────────────

/**
 * Reyon grid'inin (geçen hafta) 9 hücresinin her birine `calculateCell` uygula.
 * Çıktı: aynı şekilli grid + her hücrenin breakdown'u.
 */
export function calculateReyonGrid(
  refReyon: ReyonGrid,
  ctx: DayContext,
  coefs: EngineCoefficients,
): { targets: ReyonGrid; breakdowns: Record<string, EngineABreakdown> } {
  const targets = {} as ReyonGrid;
  const breakdowns: Record<string, EngineABreakdown> = {};

  for (const reyon of REYON) {
    targets[reyon] = { tekstil: 0, tempe: 0, parfum: 0 };
    for (const urunGrubu of URUN_GRUBU) {
      const ref = refReyon[reyon]?.[urunGrubu] ?? 0;
      const bd = calculateCell(ref, ctx, coefs);
      targets[reyon][urunGrubu] = bd.value;
      // Düz bir key — UI/tooltip için kolay erişim.
      breakdowns[`${reyon}.${urunGrubu}`] = bd;
    }
  }
  return { targets, breakdowns };
}

// ─── Tüm gün ────────────────────────────────────────────────────────────────

export type CalculateDayInput = {
  ref: {
    /** Geçen haftanın aynı gününün gerçekleşen toplam adedi. */
    totalAdet: number;
    /** Geçen haftanın aynı gününün gerçekleşen toplam TL'si. */
    totalTl: number;
    /** Geçen haftanın aynı gününün 9 reyon hücresi (reyon sorumluları elle girer). */
    reyon: ReyonGrid;
    /** IPOD referansı — opsiyonel; girilmediyse target_ipod hesaplanmaz. */
    ipod?: IpodGrid;
  };
  ctx: DayContext;
  coefs: EngineCoefficients;
  /** Saat cinsinden planlanan personel saat toplamı. Yoksa productivity null döner. */
  plannedSint?: number | null;
};

export type CalculateDayOutput = {
  targetTotalAdet: number;
  targetTotalTl: number;
  targetReyon: ReyonGrid;
  targetIpod: IpodGrid | null;
  /**
   * `target_total_adet / planned_sint`. plannedSint yoksa null.
   * Spec §3.1: "Productivity, adet hattına bağlıdır."
   */
  productivityBeklenen: number | null;
  /**
   * Şeffaflık katmanı: her hedef hücresinin nasıl üretildiği.
   * Anahtarlar:
   *   - "total.adet", "total.tl"
   *   - "reyon.kadin.tekstil", "reyon.kadin.tempe", ... (9 tane)
   *   - "ipod.kadin", ... (4 tane, eğer ipod referansı geldiyse)
   */
  breakdowns: Record<string, EngineABreakdown>;
};

/**
 * Bir günün tüm hedeflerini üretir. Spec §3.1'in tam karşılığı.
 *
 * Önemli: `targetTotalAdet`, 9 reyon hücresinin toplamı olarak türetilir
 * (`ref.totalAdet × katsayılar` ile DEĞİL). Sebep: reyon hücreleri ile toplam
 * adet arasında tutarlılık zorunlu — kullanıcı bir reyon hücresini elle
 * değiştirdiğinde toplam adet otomatik güncellenir.
 *
 * `targetTotalTl` ise `ref.totalTl × katsayılar` ile bağımsız hesaplanır,
 * çünkü TL hattının reyon bazlı kırılımı yok (mevcut formda da öyle).
 */
export function calculateDay(input: CalculateDayInput): CalculateDayOutput {
  const { ref, ctx, coefs, plannedSint } = input;
  const breakdowns: Record<string, EngineABreakdown> = {};

  // 9 hücre.
  const { targets: targetReyon, breakdowns: reyonBreakdowns } = calculateReyonGrid(
    ref.reyon,
    ctx,
    coefs,
  );
  for (const [k, v] of Object.entries(reyonBreakdowns)) {
    breakdowns[`reyon.${k}`] = v;
  }

  // Toplam adet = 9 hücrenin toplamı (kasıtlı; tutarlılık için).
  const targetTotalAdet = sumReyonGrid(targetReyon);
  // Yine de "total.adet" breakdown'u için: ref.totalAdet × aynı katsayılar.
  // Bu, kullanıcıya "ref toplam ile katsayı çarpımı bu kadardı, ama 9 hücrenin
  // toplamı şu çıktı" karşılaştırması imkanı verir. UI tutarsızlık varsa rapor eder.
  breakdowns["total.adet"] = calculateCell(ref.totalAdet, ctx, coefs);

  // Toplam TL — bağımsız ref ile.
  const totalTlBd = calculateCell(ref.totalTl, ctx, coefs);
  const targetTotalTl = totalTlBd.value;
  breakdowns["total.tl"] = totalTlBd;

  // IPOD — opsiyonel. Var olan kategoriler için aynı katsayılar.
  let targetIpod: IpodGrid | null = null;
  if (ref.ipod) {
    targetIpod = { kadin: 0, erkek: 0, cocuk: 0, kasa: 0 };
    for (const kategori of ["kadin", "erkek", "cocuk", "kasa"] as const) {
      const bd = calculateCell(ref.ipod[kategori] ?? 0, ctx, coefs);
      targetIpod[kategori] = bd.value;
      breakdowns[`ipod.${kategori}`] = bd;
    }
  }

  // Productivity — adet hattına bağlı, planned_sint yoksa hesaplanmaz.
  const productivityBeklenen =
    plannedSint != null && plannedSint > 0 ? targetTotalAdet / plannedSint : null;

  return {
    targetTotalAdet,
    targetTotalTl,
    targetReyon,
    targetIpod,
    productivityBeklenen,
    breakdowns,
  };
}
