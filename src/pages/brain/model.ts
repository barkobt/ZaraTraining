/**
 * ZARA Brain — model katmanı (deterministik, açıklanabilir, test edilebilir).
 *
 * Demo veriyle çalışır AMA sayılar UYDURULMAZ — hepsi buradaki fonksiyonlardan
 * hesaplanır. Gerçek veri (tRPC/solver çıktısı, geçmiş Buenas Dias skorları)
 * ileride `data.ts` yerine bu fonksiyonlara beslenebilir; arayüz değişmez.
 *
 * Zincir:
 *   geçmiş günler ─predictLoad→ saatlik yük + zirve
 *                 ─loadByBlock→ blok yoğunluğu
 *   plan (kim·blok·zone) ─liftFor→ tahmini BD-puan katkısı ─Σ→ net puan
 *   geçmiş sonuçlar ─updateWeights→ öğrenilen hedef ağırlıkları (kapalı döngü)
 *   ağırlıklar + memnuniyet ─predictAttainment→ tahmini BD tutturma
 */

export type Zone = "KABIN" | "SALON" | "KASA" | "DEPO" | "GIRIS";
export type Tenure = "Lead" | "Senior" | "Mid" | "New";
export type BlockId = "m" | "a" | "e" | "c";
export type Objective = "kabinPeak" | "competency" | "chemistry" | "fairness" | "entranceTill";

export const ZONES: Zone[] = ["KABIN", "SALON", "KASA", "DEPO", "GIRIS"];
export const OBJECTIVES: Objective[] = ["kabinPeak", "competency", "chemistry", "fairness", "entranceTill"];

export interface Person {
  id: number;
  name: string;
  short: string;
  tenure: Tenure;
  manager: boolean;
  comp: Record<Zone, number>; // 1..3 yetkinlik
}

export interface BlockDef {
  id: BlockId;
  label: string; // "19–22"
  en: string; // "Kapanış"
  hours: number[]; // bu bloğun saatleri (0..11 indeks → 10:00..21:00)
}

export interface HistoricalDay {
  date: string;
  weekday: number; // 0=Pzt … 4=Cuma
  payweek: boolean; // ay sonu maaş haftası mı
  weather: "açık" | "yağmur" | "kapalı";
  hourlyKabinLoad: number[]; // 12 değer, 0..100 (10:00 → 21:00)
  bdActual: number | null; // gerçekleşen BD hedef-tutturma %
  satisfaction: Record<Objective, number>; // o gün her hedefin sağlanma düzeyi 0..1
}

export interface ChemistryLink {
  a: string; // short
  b: string;
  v: number; // 0..1 ölçülen sinerji
  note: string;
}

/** Zonların temel KPI değeri (kabin = en kritik: per-ticket + deneyim). */
export const ZONE_VALUE: Record<Zone, number> = {
  KABIN: 1.0,
  KASA: 0.8,
  SALON: 0.7,
  GIRIS: 0.6,
  DEPO: 0.45,
};

export const ZONE_LABEL: Record<Zone, { tr: string; en: string }> = {
  KABIN: { tr: "Kabin", en: "Fitting Room" },
  SALON: { tr: "Salon", en: "Floor" },
  KASA: { tr: "Kasa", en: "Cashier" },
  DEPO: { tr: "Depo", en: "Stockroom" },
  GIRIS: { tr: "Giriş", en: "Entrance" },
};

const ATT_BASE = 70; // taban BD tutturma
const ATT_SCALE = 30; // ağırlıklı memnuniyet 0..1 → +0..30 puan
const LIFT_SCALE = 2.3; // tek atamanın maksimum ~+3.4 puan katkısı

// ── 1) Yük tahmini ────────────────────────────────────────
export interface LoadPrediction {
  hourly: number[]; // 12 değer, 0..100
  peakIndex: number;
  peakLabel: string; // "19:00"
  support: number; // kaç benzer gün
  confidence: number; // 0..1
}

const HOUR_LABEL = (i: number) => `${10 + i}:00`;

/**
 * Geçmiş "benzer" günlerin (aynı haftagünü + maaş-haftası) saatlik kabin yükünü
 * ortalar → tahmini eğri + zirve saati. Benzer gün yoksa tüm geçmişe düşer.
 */
export function predictLoad(
  history: HistoricalDay[],
  ctx: { weekday: number; payweek: boolean },
): LoadPrediction {
  let similar = history.filter((d) => d.weekday === ctx.weekday && d.payweek === ctx.payweek);
  if (similar.length === 0) similar = history.filter((d) => d.weekday === ctx.weekday);
  if (similar.length === 0) similar = history;

  const n = Math.max(1, similar[0]?.hourlyKabinLoad.length ?? 12);
  const hourly = Array.from({ length: n }, (_, h) =>
    Math.round(similar.reduce((s, d) => s + (d.hourlyKabinLoad[h] ?? 0), 0) / similar.length),
  );
  let peakIndex = 0;
  for (let i = 1; i < hourly.length; i++) if (hourly[i] > hourly[peakIndex]) peakIndex = i;
  return {
    hourly,
    peakIndex,
    peakLabel: HOUR_LABEL(peakIndex),
    support: similar.length,
    confidence: confidence(similar.length),
  };
}

/** Blok yoğunluğu (0..1) — bloğun saatlerindeki ortalama yük / 100. */
export function loadByBlock(load: LoadPrediction, blocks: BlockDef[]): Record<BlockId, number> {
  const out = {} as Record<BlockId, number>;
  for (const b of blocks) {
    const vals = b.hours.map((h) => load.hourly[h] ?? 0);
    out[b.id] = vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length / 100 : 0;
  }
  return out;
}

// ── 2) Güven ──────────────────────────────────────────────
/** Kanıt sayısından monoton güven: 1 - e^(-n/k). n arttıkça artar, n=11≈0.84. */
export function confidence(support: number, k = 6): number {
  return +(1 - Math.exp(-support / k)).toFixed(3);
}

// ── 3) Plan skoru (atama → tahmini BD-puan katkısı) ───────
/**
 * Bir kişinin bir blokta bir zone'a atanmasının tahmini BD-puan katkısı.
 * = LIFT_SCALE · zoneDeğeri · (yetkinlik/3) · (0.5 + blokYükü)
 * Yüksek yüklü blokta, kritik zone'da, yetkin kişi → yüksek katkı.
 */
export function liftFor(person: Person, zone: Zone, blockLoad: number): number {
  const compFactor = (person.comp[zone] ?? 1) / 3;
  const lift = LIFT_SCALE * ZONE_VALUE[zone] * compFactor * (0.5 + blockLoad);
  return Math.round(lift * 10) / 10;
}

export type Plan = Record<number, Partial<Record<BlockId, Zone>>>; // personId → blok → zone

export interface PlanCell {
  zone: Zone;
  lift: number;
}
export interface PlanRow {
  person: Person;
  cells: Partial<Record<BlockId, PlanCell>>;
  total: number;
}

/** Planı lift'lerle doldurur; her hücre + satır toplamı + net toplam hesaplanır. */
export function scorePlan(
  staff: Person[],
  plan: Plan,
  blocks: BlockDef[],
  blockLoad: Record<BlockId, number>,
): { rows: PlanRow[]; net: number } {
  const rows: PlanRow[] = [];
  let net = 0;
  for (const person of staff) {
    const cells: Partial<Record<BlockId, PlanCell>> = {};
    let total = 0;
    for (const b of blocks) {
      const zone = plan[person.id]?.[b.id];
      if (!zone) continue;
      const lift = liftFor(person, zone, blockLoad[b.id] ?? 0);
      cells[b.id] = { zone, lift };
      total += lift;
    }
    total = Math.round(total * 10) / 10;
    net += total;
    rows.push({ person, cells, total });
  }
  return { rows, net: Math.round(net * 10) / 10 };
}

// ── 4) Tutturma tahmini + kapalı-döngü öğrenme ────────────
/** Lineer model: BD tutturma = TABAN + ÖLÇEK · Σ ağırlık·memnuniyet. */
export function predictAttainment(
  weights: Record<Objective, number>,
  satisfaction: Record<Objective, number>,
): number {
  let s = 0;
  for (const o of OBJECTIVES) s += (weights[o] ?? 0) * (satisfaction[o] ?? 0);
  return ATT_BASE + ATT_SCALE * s;
}

/** Ağırlıkları sum=1'e normalize eder (negatifleri kırpar). */
export function normalizeWeights(w: Record<Objective, number>): Record<Objective, number> {
  const clipped = OBJECTIVES.map((o) => Math.max(0, w[o] ?? 0));
  const sum = clipped.reduce((a, c) => a + c, 0) || 1;
  const out = {} as Record<Objective, number>;
  OBJECTIVES.forEach((o, i) => (out[o] = +(clipped[i] / sum).toFixed(4)));
  return out;
}

/**
 * KAPALI DÖNGÜ: tek günün (memnuniyet, gerçek BD) sonucundan ağırlıkları
 * güncelle — MSE üzerinde basit gradyan adımı + simpleks projeksiyonu.
 * Tahmin gerçeğin altındaysa, o gün YÜKSEK sağlanan hedeflerin ağırlığı artar
 * (işe yarayan strateji öğrenilir). Tahmin hatasını ispatlanabilir biçimde azaltır.
 */
export function updateWeights(
  weights: Record<Objective, number>,
  day: { satisfaction: Record<Objective, number>; bdActual: number },
  lr = 0.08,
): Record<Objective, number> {
  const pred = predictAttainment(weights, day.satisfaction);
  const err = (day.bdActual - pred) / ATT_SCALE; // normalize
  const next = {} as Record<Objective, number>;
  for (const o of OBJECTIVES) {
    next[o] = (weights[o] ?? 0) + lr * err * (day.satisfaction[o] ?? 0);
  }
  return normalizeWeights(next);
}

/** Geçmişi sırayla işleyerek öğrenilen ağırlıklar + başlangıca göre yön. */
export function learnWeights(
  initial: Record<Objective, number>,
  history: HistoricalDay[],
): { weights: Record<Objective, number>; delta: Record<Objective, number> } {
  let w = normalizeWeights(initial);
  for (const d of history) {
    if (d.bdActual == null) continue;
    w = updateWeights(w, { satisfaction: d.satisfaction, bdActual: d.bdActual });
  }
  const delta = {} as Record<Objective, number>;
  for (const o of OBJECTIVES) delta[o] = +((w[o] ?? 0) - (initial[o] ?? 0)).toFixed(4);
  return { weights: w, delta };
}

/** Ortalama mutlak hata — öğrenilen ağırlıkların geçmişteki tahmin isabeti. */
export function meanAbsError(
  weights: Record<Objective, number>,
  history: HistoricalDay[],
): number {
  const withActual = history.filter((d) => d.bdActual != null);
  if (!withActual.length) return 0;
  const sum = withActual.reduce(
    (s, d) => s + Math.abs((d.bdActual as number) - predictAttainment(weights, d.satisfaction)),
    0,
  );
  return Math.round((sum / withActual.length) * 10) / 10;
}

// ── 5) Mentor eşleşmesi (Usta Yolu) ───────────────────────
export interface MentorPairing {
  zone: Zone;
  learner: Person;
  mentor: Person;
  block: BlockDef; // SAKİN blok (düşük yük) — peak'te asla
  chemistry: number; // 0..1
  shiftsToNext: number; // bir sonraki seviyeye tahmini vardiya sayısı
}

/**
 * Yetkinlik açığı olan kişiyi (zone'da ≤1) aynı zone'da usta biriyle (≥3)
 * eşleştirir; en yüksek sinerjili mentoru seçer; eşleşmeyi SAKİN bloğa koyar
 * (yük en düşük, peak değil). Sabit "Mert→Deniz" yerine kuraldan üretilir.
 */
export function mentorMatch(
  staff: Person[],
  blocks: BlockDef[],
  blockLoad: Record<BlockId, number>,
  chemistry: ChemistryLink[],
): MentorPairing[] {
  const calmBlock = [...blocks].sort((a, b) => (blockLoad[a.id] ?? 0) - (blockLoad[b.id] ?? 0))[0];
  const chem = (a: string, b: string) =>
    chemistry.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))?.v ?? 0;

  const pairings: MentorPairing[] = [];
  const usedMentors = new Set<number>();
  for (const zone of ZONES) {
    const learners = staff
      .filter((p) => (p.comp[zone] ?? 0) <= 1)
      .sort((a, b) => (a.comp[zone] ?? 0) - (b.comp[zone] ?? 0));
    const mentors = staff.filter((p) => (p.comp[zone] ?? 0) >= 3);
    for (const learner of learners) {
      const best = mentors
        .filter((m) => m.id !== learner.id && !usedMentors.has(m.id))
        .sort(
          (m1, m2) =>
            chem(learner.short, m2.short) - chem(learner.short, m1.short) ||
            (m2.comp[zone] ?? 0) - (m1.comp[zone] ?? 0),
        )[0];
      if (!best) continue;
      usedMentors.add(best.id);
      const gap = Math.max(1, 2 - (learner.comp[zone] ?? 0)); // 1→ +1, 0→ +2
      pairings.push({
        zone,
        learner,
        mentor: best,
        block: calmBlock,
        chemistry: chem(learner.short, best.short),
        shiftsToNext: 3 * gap,
      });
      break; // zone başına bir eşleşme (en kritik öğrenci)
    }
  }
  return pairings;
}

// ── 6) Zone için kişi sıralama (Beyne Sor) ────────────────
export interface RankedPerson {
  person: Person;
  score: number; // 0..1
  bestPartner?: { short: string; v: number };
}

const TENURE_W: Record<Tenure, number> = { Lead: 1, Senior: 0.8, Mid: 0.6, New: 0.35 };

/**
 * Bir zone'da "kim en iyi" — yetkinlik (0.55) + en iyi sinerji (0.25) +
 * kıdem (0.20). Ask ekranındaki sıralama buradan; sabit skor yok.
 */
export function rankForZone(staff: Person[], zone: Zone, chemistry: ChemistryLink[]): RankedPerson[] {
  return staff
    .map((person) => {
      const comp = (person.comp[zone] ?? 0) / 3;
      const links = chemistry
        .filter((c) => c.a === person.short || c.b === person.short)
        .map((c) => ({ short: c.a === person.short ? c.b : c.a, v: c.v }))
        .sort((a, b) => b.v - a.v);
      const bestPartner = links[0];
      const chem = bestPartner?.v ?? 0;
      const score = 0.55 * comp + 0.25 * chem + 0.2 * TENURE_W[person.tenure];
      return { person, score: Math.round(score * 100) / 100, bestPartner };
    })
    .sort((a, b) => b.score - a.score);
}
