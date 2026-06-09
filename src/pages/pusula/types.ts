// src/pages/pusula/types.ts
// Pusula demo tipleri — docs/pusula.zip prototipinden uyarlandı + chart/öneri/cep tipleri eklendi.
// KURAL: kişiye sert beceri RAKAMI yok. Güven SOFT (emerging/medium/high), kanıt ÖNERİDE durur.

// NOT: repo'da `erasableSyntaxOnly` açık → `enum` yasak. Aynı API'yi (Role.SalesAssistant
// değer + Role tip) koruyan const-object + union desenine çevrildi. Davranış birebir aynı.
export const Role = {
  SalesAssistant: "Satış Danışmanı",
  Cashier: "Kasa",
  Operations: "Operasyon",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MasteryLevel = {
  New: "Yeni · 0–2 ay",
  Competent: "Yetkin · 3 ay+",
  Master: "Usta · Öğretebilir",
  Coach: "Koç · Eğitimci",
} as const;
export type MasteryLevel = (typeof MasteryLevel)[keyof typeof MasteryLevel];

export const SkillStatus = {
  Theory: "Teorik",
  CanDo: "Yapabiliyor",
  NeedImprovement: "Geliştirilmeli",
  CanTeach: "Öğretebilir",
} as const;
export type SkillStatus = (typeof SkillStatus)[keyof typeof SkillStatus];

export type Trend = "up" | "down" | "neutral";

// KPI — kişinin "kanıtlanan" gücü; value NİTEL ("güçlü"/"iyi"/"gelişiyor"), sayı değil.
export interface KPI {
  label: string;
  value: string;
  trend: Trend;
  evidence?: string; // ör. "14 vardiyadan"
}

export type AsaStatus = "strong" | "developing" | "neutral";

// ASA — formdaki Ana Sorumluluk Alanı. provenBy = bunu hangi KPI "daha gerçek" kılıyor (#2).
export interface ASA {
  label: string;
  weight: number; // formdaki % ağırlık (0–100)
  status: AsaStatus;
  provenBy?: string;
}

export interface Skill {
  topic: string;
  status: SkillStatus;
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  level: MasteryLevel;
  tenure: string;
  asaMap: ASA[];
  skills: Skill[];
  kpis: KPI[];
  tendency: number[]; // 0–4 iç değer; UI'da SAYI DEĞİL, "gelişiyor/sabit" eğrisi olarak göster
  confidence: "emerging" | "medium" | "high"; // SOFT kanıt seviyesi — rakam değil
  strongPoint: string;
  growthEdge: string;
  canTeach?: string; // varsa "Öğretebilir" olduğu konu
}

// Shift pozisyonları = gerçek solver rolleri. Job-family 'Role' ile KARIŞTIRMA.
export type ZoneRole =
  | "Welcome"
  | "Kabin"
  | "Kabin Welcomer"
  | "Sprinter"
  | "Zone 2"
  | "Zone 3"
  | "Zone 4"
  | "Zone 5";

// Chart hücresi: bir rol + bir saat diliminde duran kişi(ler) (employee id).
export interface ChartCell {
  role: ZoneRole;
  hour: string; // ör. "17:00–18:00"
  persons: string[];
}
export type ChartState = ChartCell[];

export type RecKind = "strength" | "synergy" | "growth" | "teaching";

// Öneri = morph'u tetikleyen ve KİŞİYİ kredilendiren birim. Kanıt burada, kişide değil.
export interface Recommendation {
  id: string;
  kind: RecKind;
  employeeId: string;
  toRole: ZoneRole;
  hours: string; // ör. "17:00–19:00"
  thesis: string; // NİTEL gerekçe ("AI Tezi") — skor yok
  evidence: string; // kanıt öneride ("14 benzer vardiyadan")
  buddyId?: string; // gelişim/yeni-kişi için güçlü eş
}

// Akşam cebi — demonun his çekirdeği. Pencere KİLİTLİ (#4).
export interface PocketState {
  window: string; // "17:00–19:00"
  trafficPeak: number; // tepe trafik (kişi)
  convBefore: number[]; // [17, 19] — gergin (gerçek 2025 sayıları)
  convAfter: number[]; // [26, 27] — rahatlamış (TEMSİLÎ)
  note: string;
}

export interface HourPoint {
  hour: string;
  traffic: number;
  conv: number; // % (0–100)
}

// Usta Aktarımı — "Öğretebilir" anı (çıkar-sonra-onayla).
export interface TeachingCard {
  topic: string;
  masterId: string;
  method: string;
  evidence: string;
  confirmPrompt: string;
}
