/**
 * Motor B — Challenge Hesabı (spec §3.3).
 *
 * "Aylık challenge'a yetişiyor muyuz, yetişmek için ne gerekiyor?"
 *
 * Spec algoritması:
 *   1) kümülatif_tl = ay başından bugüne ONAYLANMIŞ gerçekleşen TL toplamı
 *   2) kalan_tl = kademe_hedefi − kümülatif_tl
 *   3) kalan_günler = bugünden ay sonuna kadar olan günler
 *   4) ağırlıklar: haftaiçi=1.0, haftasonu=Store.weekendWeight (default 1.75)
 *   5) birim_değer = kalan_tl / toplam_ağırlık
 *   6) bugünün_gereken_tl = birim_değer × bugünün_ağırlığı
 *   7) bugünün_gereken_adet ≈ bugünün_gereken_tl / Challenge.avgBasketTl
 *   8) durum_yüzdesi = kümülatif_tl / kademe_hedefi
 *
 * Tier 1 ve Tier 2 (= Tier 1 × 1.15) AYNI fonksiyonla, ayrı tierTargetTl ile çağrılır.
 *
 * Saf TS — DB/HTTP yok. Çağıran taraf kümülatif TL'yi DB'den `GERCEKLESTI` satırlardan
 * okur ve buraya verir (kritik kural: spec §3.5).
 */
import { dayTypeFromDate } from "../../../contracts/buenas-dias.js";

export type RemainingDay = {
  date: string; // 'YYYY-MM-DD'
  isWeekend: boolean;
};

export type EngineBInput = {
  /** Hedef TL — Tier 1 veya Tier 2 değeri. Pozitif beklenir. */
  tierTargetTl: number;
  /** Ay başından bugüne kadar GERCEKLESTI satırların actual_total_tl toplamı. */
  cumulativeTl: number;
  /**
   * Kalan günler — bugün dahil, ay sonuna kadar.
   * Çağıran `computeRemainingDays` ile üretir veya kendi listesini verir.
   */
  remainingDays: RemainingDay[];
  /** Bugün ('YYYY-MM-DD'). `remainingDays` içinde bulunmalı. */
  today: string;
  /** Haftasonu ağırlığı (Store.weekendWeight, default 1.75). */
  weekendWeight: number;
  /** TL'yi adede çevirmek için (Challenge.avgBasketTl). Null/0 ise adet null döner. */
  avgBasketTl: number | null;
};

export type EngineBOutput = {
  /** Hedef - kümülatif. Negatif olabilir (hedef aşıldıysa). */
  remainingTl: number;
  /** Kalan günlerin ağırlık toplamı. 0 olabilir (kalan gün yok). */
  totalWeight: number;
  /** kalan_tl / toplam_ağırlık. Bölme tanımsızsa 0 döner. */
  unitValue: number;
  /** Bugünün ağırlığı (haftaiçi 1.0 / haftasonu = weekendWeight). */
  todayWeight: number;
  /** Bugün toplanması gereken TL. Negatif olmaz (hedef aşıldıysa 0). */
  todayRequiredTl: number;
  /** Bugün toplanması gereken adet. avgBasketTl yoksa null. */
  todayRequiredAdet: number | null;
  /** kümülatif / hedef (0–1+ aralığında). UI yüzdeye çevirir. */
  statusPct: number;
  /** Hedef tutuluyor mu — kümülatif >= hedef? */
  alreadyMet: boolean;
};

/**
 * Saf Motor B hesabı. Tek tier için tek çağrı; iki tier için iki çağrı.
 *
 * **Önemli:** `remainingDays` listesinde `today` bulunmazsa todayWeight=0 döner;
 * çağıran tarafta bu, "bugün ay dışında" olarak yorumlanır.
 */
export function calculateChallenge(input: EngineBInput): EngineBOutput {
  const {
    tierTargetTl,
    cumulativeTl,
    remainingDays,
    today,
    weekendWeight,
    avgBasketTl,
  } = input;

  const remainingTl = tierTargetTl - cumulativeTl;
  const alreadyMet = cumulativeTl >= tierTargetTl;

  // Ağırlık toplamı.
  let totalWeight = 0;
  let todayWeight = 0;
  for (const d of remainingDays) {
    const w = d.isWeekend ? weekendWeight : 1;
    totalWeight += w;
    if (d.date === today) todayWeight = w;
  }

  // Birim değer — bölme güvenli.
  let unitValue = 0;
  if (totalWeight > 0 && remainingTl > 0) {
    unitValue = remainingTl / totalWeight;
  }

  // Bugünün gereken TL'si — hedef aşıldıysa 0.
  const todayRequiredTl = unitValue * todayWeight;

  // Adet — avgBasket yoksa null. 0 da bölünmez → null.
  const todayRequiredAdet =
    avgBasketTl && avgBasketTl > 0 ? todayRequiredTl / avgBasketTl : null;

  const statusPct = tierTargetTl > 0 ? cumulativeTl / tierTargetTl : 0;

  return {
    remainingTl,
    totalWeight,
    unitValue,
    todayWeight,
    todayRequiredTl,
    todayRequiredAdet,
    statusPct,
    alreadyMet,
  };
}

/**
 * `today` ile `endDate` arasındaki tüm günleri (her ikisi dahil) listele.
 * Saf takvim aritmetiği — DST/zaman dilimi karmaşası yok çünkü hep YYYY-MM-DD ile çalışıyoruz.
 *
 * `today > endDate` ise boş dizi döner.
 */
export function computeRemainingDays(today: string, endDate: string): RemainingDay[] {
  const out: RemainingDay[] = [];

  // Tarih iki noktaya da T00:00:00 ekleyerek lokal Date oluştur — saat/dilim
  // sapması olmaz çünkü hep aynı zaman dilimi içindeyiz ve fark almıyoruz.
  let cursor = new Date(today + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (cursor.getTime() <= end.getTime()) {
    const iso = isoDate(cursor);
    out.push({
      date: iso,
      isWeekend: dayTypeFromDate(iso) === "haftasonu",
    });
    cursor = addDays(cursor, 1);
  }
  return out;
}

function isoDate(d: Date): string {
  // Lokal yıl/ay/gün — UTC değil. Spec'te tarihler hep Türkiye lokal.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// ─── Motor A ↔ Motor B karşılaştırması ──────────────────────────────────────
// Spec §3.3 sonu: bugünün Motor A toplam TL hedefi, bugünün Motor B gereken TL'si
// karşısında nerede duruyor? UI bu rozetle kullanıcıya net bir cevap verir.

export type CompareToTargetInput = {
  motorATargetTotalTl: number | null; // bugünün TASLAK/ONAYLANDI target_total_tl'si
  motorBTodayRequiredTl: number;
};

export type CompareToTargetOutput = {
  /** "tutuyor" → ✅, "acik" → ⚠️, "yok" → Motor A henüz hesaplanmadı */
  status: "tutuyor" | "acik" | "yok";
  /** Fark = motor_A − motor_B. Pozitifse Motor A çok, negatifse yetersiz. */
  diff: number | null;
};

export function compareToTarget(input: CompareToTargetInput): CompareToTargetOutput {
  if (input.motorATargetTotalTl == null) {
    return { status: "yok", diff: null };
  }
  const diff = input.motorATargetTotalTl - input.motorBTodayRequiredTl;
  return {
    status: diff >= 0 ? "tutuyor" : "acik",
    diff,
  };
}
