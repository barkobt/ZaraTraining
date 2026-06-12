export const STAR_LEVELS = [
  { value: 0, label: "—", name: "Yok" },
  { value: 1, label: "★", name: "Kriz" },
  { value: 2, label: "★★", name: "Destek" },
  { value: 3, label: "★★★", name: "Ana" },
  { value: 4, label: "★★★+", name: "Tercih+" },
] as const;

// Renkler EDİTORYAL MÜREKKEP ailesi: doygun ekran renkleri yerine desature
// tonlar — monokrom kabukla kavga etmez, veri kimliği yine ayırt edilir.
export const TENURE_LEVELS = [
  { id: "NEW_0_1", label: "0–1 ay", color: "#9c5050" },
  { id: "NEW_1_3", label: "1–3 ay", color: "#9c7a4a" },
  { id: "NEW_3_6", label: "3–6 ay", color: "#7d7448" },
  { id: "NEW_6_PLUS", label: "6+ ay", color: "#56755e" },
  { id: "EXPERT", label: "Yetkin", color: "#000000" },
] as const;

export const ROLES = [
  "Welcome",
  "Kabin",
  "Kabin Welcomer",
  "Sprinter",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
] as const;
export type Role = (typeof ROLES)[number];

/**
 * ALAN-BAZLI (area-based) v2 sistemi — kişinin sabit çalışma alanı.
 *
 * v1 (yetkinlik-bazlı, ROLES) ile ÇAKIŞMAZ: v1 solver alanı yok sayar, kişiyi
 * saatlik rol rotasyonuyla atar. v2 ise kişiyi `id` alanına sabitler. Aynı
 * personel listesi, iki ayrı mantık, mod seçimiyle ayrılır.
 *
 * Sıra kullanıcı isteğiyle: Woman → Basic → TRF → Fitting Room → Sprinter → 360.
 * `id` DB'de staff.home_area olarak saklanır (varchar 20, nullable).
 */
export const AREAS = [
  { id: "WOMAN", label: "Woman", sub: "Welcome · Zone 1-2", color: "#8a4a5e" },
  { id: "BASIC", label: "Basic", sub: "Zone 3-4", color: "#46586e" },
  { id: "TRF", label: "TRF", sub: "Zone 5", color: "#8a6a46" },
  { id: "FITTING_ROOM", label: "Fitting Room", sub: "Kabin", color: "#5e5072" },
  { id: "SPRINTER", label: "Sprinter", sub: "Joker", color: "#4e6b56" },
  { id: "RUNNER_360", label: "Runner 360", sub: "", color: "#48707c" },
] as const;
export type AreaId = (typeof AREAS)[number]["id"];

export const AREA_BY_ID: Record<string, (typeof AREAS)[number]> = Object.fromEntries(
  AREAS.map((a) => [a.id, a]),
);

/** Görev etiketi (duty) — COM/CX/Coach. staff.duty olarak saklanır. */
export const DUTIES = [
  { id: "COM", label: "COM", color: "#5a4a78" },
  { id: "CX", label: "CX", color: "#48707c" },
  { id: "COACH", label: "Coach", color: "#8a6a3a" },
] as const;
export type DutyId = (typeof DUTIES)[number]["id"];
export const DUTY_BY_ID: Record<string, (typeof DUTIES)[number]> = Object.fromEntries(
  DUTIES.map((d) => [d.id, d]),
);

/** Çalışma tipi (employment) — Full/Part time. staff.employment olarak saklanır. */
export const EMPLOYMENTS = [
  { id: "FT", label: "Full Time" },
  { id: "PT", label: "Part Time" },
] as const;
export type EmploymentId = (typeof EMPLOYMENTS)[number]["id"];

/**
 * Alan-İÇİ sıralama rütbesi (kullanıcı isteği): COM en üstte → sonra FT → sonra
 * PT → en sonda etiketsizler. Aynı tier içinde alfabetik (çağıran taraf uygular).
 * COM görevi, FT/PT'den BAĞIMSIZ olarak en üste çıkar (lider ekip vurgusu).
 */
export function withinAreaRank(s: { duty: string | null; employment: string | null }): number {
  if (s.duty === "COM") return 0;
  if (s.employment === "FT") return 1;
  if (s.employment === "PT") return 2;
  return 3;
}

export type StaffRow = {
  id: number;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  note: string | null;
  homeArea: string | null;
  duty: string | null;
  employment: string | null;
  competencies: Record<string, number>;
};

/**
 * Manuel atanan günlük sorumluluklar — solver'dan bağımsız.
 * Kullanıcı chart üretildikten sonra her birine bir kişi atar.
 */
export const RESPONSIBILITY_ROLES = [
  "Runner Lider",
  "Aksiyon Sorumlusu",
  "iPod Sorumlusu",
  "CX Sorumlusu",
  "Liderlik",
] as const;
export type ResponsibilityRole = (typeof RESPONSIBILITY_ROLES)[number];

/**
 * UI'da gösterilen "konuşma ismi". Önce fullName'in ilk parçası (gerçek ad)
 * kullanılır — "KaanG" gibi takma kısaltmalardan kaçınılır. Çakışma varsa
 * "İsim S." (soyad baş harfi) formatına düşülür.
 *
 * Neden: shortName tarihsel olarak çakışma çözümleyici (KaanG, AhmetK) gibi
 * kötü değerler içeriyor. Gerçek ilk-isim hep daha temiz.
 */
export function staffLabel(s: StaffRow, all: StaffRow[]): string {
  const parts = s.fullName.trim().split(/\s+/);
  const firstFromFull = parts[0] ?? "";
  // 2026-05-23: User kuralı — eğer shortName custom (fullName'in ilk
  // kelimesinden FARKLI) ise mutlaka onu kullan. Kullanıcı CompetencyTab'da
  // shortName'i özel olarak değiştirdi (örn "Ahmet Baran Bozkurt" → "Baran")
  // — bu tercihe saygı duy, fullName-first ile override etme.
  if (s.shortName && s.shortName.trim() !== "" && s.shortName !== firstFromFull) {
    return s.shortName;
  }
  // shortName ya boş ya da fullName ilk kelimesiyle aynı → çakışma kontrolü
  const first = firstFromFull || s.shortName;
  const dup = all.some(
    (o) => o.id !== s.id && o.fullName.trim().split(/\s+/)[0] === first,
  );
  if (!dup) return first;
  // Çakışma: ilk soyadın baş harfi eklenir
  const last = parts[parts.length - 1];
  if (last && last !== first) return `${first} ${last[0]}.`;
  return s.shortName;
}
