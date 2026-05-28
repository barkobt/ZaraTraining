/**
 * Türev metrikler — Compran, Productivity, Gap (spec §3.4).
 *
 * Saf fonksiyonlar; aktüel veriden hesaplanır, hedefi `Store` ayarlarından gelir.
 * Bölme güvenli: payda 0/null ise null döner — UI "—" gösterir.
 *
 * Gap özel durum: sistem hesaplamaz, kullanıcı elle girer. Yardımcı seçenek
 * (`calculateGapFromChanges`) "visit% / satış%" girdisinden türetir.
 */

/**
 * Compran (CR) = fiş / visit.
 * Spec §3.4. "İçeri girenin satışa dönüşmesi", yüzde olarak gösterilir.
 *
 * @returns 0-1 arası oran; payda 0/null ise null.
 */
export function calculateCompran(actualFis: number | null, actualVisit: number | null): number | null {
  if (actualFis == null || actualVisit == null) return null;
  if (actualVisit <= 0) return null;
  return actualFis / actualVisit;
}

/**
 * Productivity = satılan adet / çalışılan saat.
 * Spec §3.4. "Saat başına verim".
 *
 * @returns Adet/saat; payda 0/null veya adet null ise null.
 */
export function calculateProductivity(
  actualTotalAdet: number | null,
  actualSint: number | null,
): number | null {
  if (actualTotalAdet == null || actualSint == null) return null;
  if (actualSint <= 0) return null;
  return actualTotalAdet / actualSint;
}

/**
 * Gap yardımcısı — kullanıcı Zara uygulamasından "visit değişim %" ve
 * "satış değişim %" değerlerini ayrı ayrı girerse sistem hesaplar:
 *
 *     Gap = satış% − visit%
 *
 * Spec §3.4: "Sistem hesaplamaz, kullanıcı elle girer" — ama bu yardımcı
 * varsa kullanıcı tek tek girmek yerine iki sayıdan bir tane üretebilir.
 *
 * Girdiler yüzde formatında bekleniyor (örn. 10 = %10). Çıkış da yüzde.
 * Negatif olabilir (satış visit'in altında kaldıysa).
 */
export function calculateGapFromChanges(
  visitChangePct: number | null,
  satisChangePct: number | null,
): number | null {
  if (visitChangePct == null || satisChangePct == null) return null;
  return satisChangePct - visitChangePct;
}

// ─── Hedef karşılaştırma ─────────────────────────────────────────────────────
// UI rozeti için: aktüel metrik hedefe göre nerede?

export type MetricStatus = "tutuyor" | "altinda" | "yok";

export type MetricCompare = {
  /** Aktüel değer (oran/sayı). Null = hesaplanamadı. */
  actual: number | null;
  /** Sabit hedef (`Store.compranTarget` vb.). 0 = hedef girilmedi. */
  target: number;
  /** Aktüel >= hedef → tutuyor; < → altında; aktüel null → yok. */
  status: MetricStatus;
  /** Aktüel − hedef. Null = yok. */
  diff: number | null;
};

/**
 * Genel hedef karşılaştırma — Compran/Productivity için aynı yapı.
 * Gap için ayrı (Gap negatif olabildiği için "tutuyor" tanımı farklı:
 * Gap >= hedef → tutuyor; hedef genellikle 0 veya pozitif bir eşik).
 */
export function compareMetric(actual: number | null, target: number): MetricCompare {
  if (actual == null) return { actual: null, target, status: "yok", diff: null };
  if (target <= 0) {
    // Hedef girilmediyse karşılaştırma anlamsız — UI uyarı verir.
    return { actual, target, status: "yok", diff: null };
  }
  const diff = actual - target;
  return { actual, target, status: diff >= 0 ? "tutuyor" : "altinda", diff };
}

/**
 * Gap için özel karşılaştırma — hedef negatif veya 0 olabilir, sıfır kontrolü yok.
 * "Tutuyor" = aktüel Gap >= hedef Gap (yani trafik artışı satışa daha iyi yansıyor).
 */
export function compareGap(actualGap: number | null, targetGap: number): MetricCompare {
  if (actualGap == null) return { actual: null, target: targetGap, status: "yok", diff: null };
  const diff = actualGap - targetGap;
  return { actual: actualGap, target: targetGap, status: diff >= 0 ? "tutuyor" : "altinda", diff };
}
