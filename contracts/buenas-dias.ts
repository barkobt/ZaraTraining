// Buenas Dias modülü için frontend/backend paylaşılan sabitler, enum'lar, tipler.
// Spec: ~/Desktop/buenas-dias-generator/buenas_dias_spec.md

// ─── Enum benzeri sabit tuple'lar ─────────────────────────────────────────────
// `as const` + `(typeof X)[number]` deseni Drizzle enum'larıyla ve Zod
// `z.enum`'larıyla aynı kaynaktan beslenmek için tercih edildi.

export const DAY_STATUS = ["TASLAK", "ONAYLANDI", "GERCEKLESTI"] as const;
export type DayStatus = (typeof DAY_STATUS)[number];

export const DAY_TYPE = ["haftaici", "haftasonu"] as const;
export type DayType = (typeof DAY_TYPE)[number];

export const WEATHER = ["sunny", "normal", "bad"] as const;
export type Weather = (typeof WEATHER)[number];

export const COEFFICIENT_TYPE = [
  "stretch",
  "weekend",
  "special_day",
  "weather_sunny",
  "weather_normal",
  "weather_bad",
] as const;
export type CoefficientType = (typeof COEFFICIENT_TYPE)[number];

export const REYON = ["kadin", "erkek", "cocuk"] as const;
export type Reyon = (typeof REYON)[number];

export const URUN_GRUBU = ["tekstil", "tempe", "parfum"] as const;
export type UrunGrubu = (typeof URUN_GRUBU)[number];

// IPOD reyon-bazlı + kasa hattı için ayrı bir küme tutar.
export const IPOD_KATEGORI = ["kadin", "erkek", "cocuk", "kasa"] as const;
export type IpodKategori = (typeof IPOD_KATEGORI)[number];

export const USER_ROLE = [
  "yonetici",
  "reyon_kadin",
  "reyon_erkek",
  "reyon_cocuk",
  "kasa",
] as const;
export type UserRole = (typeof USER_ROLE)[number];

// ─── Hedef/gerçekleşen 9 hücre yapısı ─────────────────────────────────────────
// `daily_records.target_reyon`, `ref_reyon` jsonb sütunlarında bu şekil saklanır.
// Bilinçli olarak nested obje; satır × sütun ID'leri spec'le birebir.

export type ReyonGrid = Record<Reyon, Record<UrunGrubu, number>>;
export type IpodGrid = Record<IpodKategori, number>;

// Motor A'nın bir hedef hücresi için ürettiği açıklayıcı çıktı.
// "Şeffaflık ilkesi": her sayı geriye doğru bu breakdown ile açıklanabilmeli.
export type EngineABreakdown = {
  ref: number;
  stretch: number;
  weekend: number;
  specialDay: number;
  weather: number;
  value: number;
};

// ─── Default katsayı değerleri ────────────────────────────────────────────────
// `seed-buenas-dias.ts` ve UI fallback'leri bu sabitlerden okur — tek doğruluk
// kaynağı burası. DB'deki Coefficient.default_value kolonu da bu değerleri tutar.

export const DEFAULT_COEFFICIENTS: Record<CoefficientType, number> = {
  stretch: 1.03,
  weekend: 1.3,
  special_day: 1.45,
  weather_sunny: 1.15,
  weather_normal: 1.0,
  weather_bad: 0.85,
};

// Store seviyesi default'lar (spec §2.1).
export const STORE_DEFAULTS = {
  defaultStretch: 0.03, // %3 — `Coefficient.stretch` 1.03'le aynı kavram, ham %
  weekendWeight: 1.75, // Motor B haftasonu ağırlığı
  weekendDayFactor: 1.3, // Motor A haftasonu çarpanı
  city: "Bornova,Izmir",
  // Sabit aylık hedefler — gerçek değerler kullanıcı tarafından girilir,
  // başlangıçta null/0 bırakılır; UI uyarı verir.
  compranTarget: 0,
  gapTarget: 0,
  productivityTarget: 0,
} as const;

// Kalibrasyon: kaç örnek birikince öneri tetiklensin?
export const CALIBRATION_MIN_SAMPLES = 3;

// Motor B'de challenge tier 2 = tier 1 × 1.15 (spec §3.3).
export const TIER2_MULTIPLIER = 1.15;

// ─── Yardımcı saf fonksiyonlar ────────────────────────────────────────────────
// Burada *yalnızca* veri-bağımsız, hesap motorlarından önce kullanılan ufak
// utility'ler kalır. Asıl motorlar `api/_lib/buenas-dias/engine-*.ts` altında.

/**
 * Cmt-Pazar = haftasonu, diğer günler = haftaiçi.
 * `date` parametresi `Date` objesi olabileceği gibi 'YYYY-MM-DD' string'i de olabilir.
 */
export function dayTypeFromDate(date: Date | string): DayType {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  const dow = d.getDay(); // 0 = Pazar, 6 = Cumartesi
  return dow === 0 || dow === 6 ? "haftasonu" : "haftaici";
}

/** Boş bir 9-hücre reyon grid'i (sıfırla doldurulmuş). */
export function emptyReyonGrid(): ReyonGrid {
  const grid = {} as ReyonGrid;
  for (const r of REYON) {
    grid[r] = { tekstil: 0, tempe: 0, parfum: 0 };
  }
  return grid;
}

/** Boş bir IPOD grid'i. */
export function emptyIpodGrid(): IpodGrid {
  return { kadin: 0, erkek: 0, cocuk: 0, kasa: 0 };
}

/** Bir reyon grid'inin toplam adet değeri (9 hücrenin toplamı). */
export function sumReyonGrid(grid: ReyonGrid): number {
  let total = 0;
  for (const r of REYON) {
    for (const u of URUN_GRUBU) {
      total += grid[r][u] ?? 0;
    }
  }
  return total;
}
