export const STAR_LEVELS = [
  { value: 0, label: "—", name: "Yok" },
  { value: 1, label: "★", name: "Kriz" },
  { value: 2, label: "★★", name: "Destek" },
  { value: 3, label: "★★★", name: "Ana" },
  { value: 4, label: "★★★+", name: "Tercih+" },
] as const;

export const TENURE_LEVELS = [
  { id: "NEW_0_1", label: "0–1 ay", color: "#ef4444" },
  { id: "NEW_1_3", label: "1–3 ay", color: "#f59e0b" },
  { id: "NEW_3_6", label: "3–6 ay", color: "#eab308" },
  { id: "NEW_6_PLUS", label: "6+ ay", color: "#10b981" },
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

export type StaffRow = {
  id: number;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  note: string | null;
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
