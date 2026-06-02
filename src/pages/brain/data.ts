/**
 * ZARA Brain — demo veri kaynağı (TEK YER / single seam).
 *
 * Buradaki her şey `model.ts`'in girdisidir. Gerçek sistemde:
 *   ROSTER      → tRPC staff.list
 *   HISTORY     → geçmiş chart + Buenas Dias skorları (DB)
 *   CHEMISTRY   → ölçülen eş-performans (decision_log)
 * Şimdilik makul seed; arayüz aynı kalır, sadece bu dosya gerçek veriyle dolar.
 *
 * ÖNEMLİ: BD skorları (bdActual) elle yazılmadı — latent TRUE_WEIGHTS üzerinden
 * predictAttainment ile üretildi + küçük gözlem gürültüsü. Böylece "Twin" bu
 * gizli ağırlıkları geçmişten ÖĞRENİP geri keşfeder (kapalı döngü ispatı).
 */
import {
  predictAttainment,
  type BlockDef,
  type ChemistryLink,
  type HistoricalDay,
  type Objective,
  type Person,
  type Plan,
  type Zone,
} from "./model";

export const ROSTER: Person[] = [
  { id: 1, name: "Selin Yıldız", short: "Selin", tenure: "Lead", manager: true, comp: { KASA: 3, KABIN: 3, SALON: 3, DEPO: 2, GIRIS: 3 } },
  { id: 2, name: "Mert Demir", short: "Mert", tenure: "Senior", manager: false, comp: { KASA: 3, KABIN: 2, SALON: 3, DEPO: 3, GIRIS: 2 } },
  { id: 3, name: "Ayşe Kaya", short: "Ayşe", tenure: "Senior", manager: false, comp: { KASA: 2, KABIN: 3, SALON: 2, DEPO: 1, GIRIS: 3 } },
  { id: 5, name: "Ece Şahin", short: "Ece", tenure: "Mid", manager: false, comp: { KASA: 1, KABIN: 3, SALON: 2, DEPO: 2, GIRIS: 2 } },
  { id: 10, name: "Berfin Eren", short: "Berfin", tenure: "Mid", manager: false, comp: { KASA: 2, KABIN: 3, SALON: 1, DEPO: 2, GIRIS: 2 } },
  { id: 9, name: "Onur Yılmaz", short: "Onur", tenure: "Senior", manager: false, comp: { KASA: 2, KABIN: 2, SALON: 3, DEPO: 3, GIRIS: 3 } },
  { id: 7, name: "Deniz Arslan", short: "Deniz", tenure: "New", manager: false, comp: { KASA: 1, KABIN: 1, SALON: 2, DEPO: 1, GIRIS: 2 } },
];

export const BLOCKS: BlockDef[] = [
  { id: "m", label: "10–13", en: "Sabah", hours: [0, 1, 2] },
  { id: "a", label: "13–16", en: "Öğle", hours: [3, 4, 5] },
  { id: "e", label: "16–19", en: "Akşam", hours: [6, 7, 8] },
  { id: "c", label: "19–22", en: "Kapanış", hours: [9, 10, 11] },
];

export const CHEMISTRY: ChemistryLink[] = [
  { a: "Selin", b: "Ayşe", v: 0.91, note: "yoğun trafikte birlikte parlar" },
  { a: "Mert", b: "Onur", v: 0.74, note: "salon akışını hızlı toparlar" },
  { a: "Ece", b: "Berfin", v: 0.68, note: "kabin backlog'unu eritir" },
  { a: "Selin", b: "Deniz", v: 0.41, note: "mentorluk — ramp hızlanır" },
];

/** Başlangıç ağırlıkları — hiçbir hedefe önyargısız (uniform). */
export const INITIAL_WEIGHTS: Record<Objective, number> = {
  kabinPeak: 0.2,
  competency: 0.2,
  chemistry: 0.2,
  fairness: 0.2,
  entranceTill: 0.2,
};

/**
 * Latent "gerçek" ağırlıklar — bu mağazanın sonuçlarını ÜRETEN gizli yapı
 * (demo). Twin bunu görmez; geçmişten öğrenmeye çalışır. Gerçek hayatta bu
 * yoktur — actual KPI doğrudan gözlemlenir.
 */
const TRUE_WEIGHTS: Record<Objective, number> = {
  kabinPeak: 0.34,
  competency: 0.24,
  chemistry: 0.18,
  fairness: 0.14,
  entranceTill: 0.1,
};

/** Tipik Cuma kabin yük eğrisi (10:00→21:00), 19:00'da zirve. */
const FRIDAY_CURVE = [22, 30, 41, 38, 44, 52, 61, 73, 86, 97, 84, 58];
const scaleCurve = (curve: number[], k: number) => curve.map((v) => Math.min(100, Math.round(v * k)));

/** Memnuniyet vektörü + o günden üretilmiş gerçek BD (latent ağırlık + gürültü). */
function day(
  date: string,
  payweek: boolean,
  weather: HistoricalDay["weather"],
  curveK: number,
  sat: Record<Objective, number>,
  noise: number,
): HistoricalDay {
  const bdActual = Math.round(predictAttainment(TRUE_WEIGHTS, sat) + noise);
  return {
    date,
    weekday: 4, // Cuma
    payweek,
    weather,
    hourlyKabinLoad: scaleCurve(FRIDAY_CURVE, curveK),
    satisfaction: sat,
    bdActual,
  };
}

/**
 * Son 6 Cuma. Zamanla kabin-peak kapsama + takım kimyası yükseliyor (mağaza
 * öğrendikçe) → bdActual yükseliyor. Twin bu örüntüyü ağırlıklara çevirir.
 */
export const HISTORY: HistoricalDay[] = [
  day("02 May", true, "açık", 0.92, { kabinPeak: 0.45, competency: 0.7, chemistry: 0.4, fairness: 0.8, entranceTill: 0.7 }, +1),
  day("09 May", false, "yağmur", 0.86, { kabinPeak: 0.55, competency: 0.72, chemistry: 0.5, fairness: 0.75, entranceTill: 0.65 }, -1),
  day("16 May", false, "açık", 0.95, { kabinPeak: 0.7, competency: 0.74, chemistry: 0.78, fairness: 0.7, entranceTill: 0.6 }, +2),
  day("23 May", true, "açık", 1.0, { kabinPeak: 0.82, competency: 0.76, chemistry: 0.74, fairness: 0.68, entranceTill: 0.62 }, -1),
  day("30 May", true, "açık", 0.98, { kabinPeak: 0.9, competency: 0.78, chemistry: 0.85, fairness: 0.66, entranceTill: 0.58 }, +1),
];

/** Bugün (tahmin edilecek) — Cuma, maaş haftası, açık. */
export const TODAY = {
  date: "06 Haz",
  weekdayLabel: "CUMA",
  full: "CUMA · 6 HAZİRAN 2026 · ZARA BORNOVA 3643 · HAVA AÇIK",
  weekday: 4,
  payweek: true,
  weather: "açık" as const,
};

/**
 * Bugünün önerilen planı (kim · blok · zone). Lift'ler model.scorePlan ile
 * HESAPLANIR; buradaki yalnızca atama kararı. Yetkin kişiler kapanış (c) ve
 * akşam (e) bloklarında Kabin'e yoğunlaştırılır — 19:00 zirvesi için.
 */
export const PLAN: Plan = {
  1: { m: "SALON", a: "GIRIS", e: "KABIN", c: "KABIN" }, // Selin
  3: { m: "GIRIS", a: "KABIN", e: "KABIN", c: "KABIN" }, // Ayşe
  5: { m: "KABIN", a: "SALON", e: "KABIN", c: "KABIN" }, // Ece
  10: { m: "KASA", a: "KABIN", e: "SALON", c: "KABIN" }, // Berfin
  2: { m: "SALON", a: "SALON", e: "KASA", c: "KASA" }, // Mert
  9: { m: "DEPO", a: "SALON", e: "SALON", c: "GIRIS" }, // Onur
  7: { m: "GIRIS", a: "DEPO", e: "GIRIS", c: "SALON" }, // Deniz (new)
};

/** Bugünün önerilen planının hedef-memnuniyeti — Twin'in tahmin için kullandığı. */
export const TODAY_SATISFACTION: Record<Objective, number> = {
  kabinPeak: 0.92,
  competency: 0.8,
  chemistry: 0.86,
  fairness: 0.64,
  entranceTill: 0.6,
};

export const OBJECTIVE_LABEL: Record<Objective, { tr: string; en: string }> = {
  kabinPeak: { tr: "Kabin kapsama · peak", en: "Fitting-room peak coverage" },
  competency: { tr: "Yetkinlik eşleşmesi", en: "Competency match" },
  chemistry: { tr: "Takım kimyası", en: "Team chemistry" },
  fairness: { tr: "Adalet · vardiya dengesi", en: "Fairness / rotation" },
  entranceTill: { tr: "Giriş & kasa kapsama", en: "Entrance & till coverage" },
};

/**
 * Mağaza krokisi sinyali — alan başına anlık tahmini trafik (0–100) + satış
 * endeksi (0–100). Kabin yükü predictLoad zirvesiyle tutarlı (97). Gerçekte
 * sensör/POS verisinden gelir; tavsiyeler model.rankForZone'dan türetilir.
 */
export const ZONE_SIGNAL: Record<Zone, { load: number; sales: number }> = {
  KABIN: { load: 97, sales: 88 },
  KASA: { load: 64, sales: 95 },
  SALON: { load: 72, sales: 70 },
  GIRIS: { load: 58, sales: 38 },
  DEPO: { load: 28, sales: 18 },
};

export const personByShort = (short: string): Person | undefined =>
  ROSTER.find((p) => p.short === short);

export type { Zone };
