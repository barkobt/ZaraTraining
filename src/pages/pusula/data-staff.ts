// src/pages/pusula/data-staff.ts
// GERÇEK ROSTER — ShiftOrganizer seed'inden (db/seed.ts) birebir: 30 personel +
// gerçek yetkinlik matrisi (Welcome·Kabin·Kabin Welcomer·Sprinter·Zone 2-5, 0–4).
// Her kişinin Pusula profili (mastery/güçlü/gelişen/ASA/beceri/KPI/eğilim) bu
// yetkinlik + tenure'dan NİTEL olarak TÜRETİLİR — sert skor ekrana basılmaz.

import {
  MasteryLevel,
  Role,
  SkillStatus,
  type ASA,
  type AsaStatus,
  type Employee,
  type KPI,
  type ZoneRole,
  type Skill,
} from "./types";

export const STAFF_ROLES: ZoneRole[] = [
  "Welcome",
  "Kabin",
  "Kabin Welcomer",
  "Sprinter",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
];

type Row = {
  id: string;
  name: string;
  tenure: "NEW_0_1" | "NEW_1_3" | "NEW_3_6" | "NEW_6_PLUS" | "EXPERT";
  mgr: boolean;
  note: string;
  /** [Welcome, Kabin, Kabin Welcomer, Sprinter, Zone 2, Zone 3, Zone 4, Zone 5] */
  c: [number, number, number, number, number, number, number, number];
};

// Kaynak: db/seed.ts STAFF (2026-05-18 yetkinlik tablosu).
const ROWS: Row[] = [
  { id: "Ada", name: "Ada Özaşçı", tenure: "NEW_3_6", mgr: false, note: "", c: [2, 2, 3, 1, 2, 2, 2, 2] },
  { id: "Baran", name: "Baran Bozkurt", tenure: "EXPERT", mgr: true, note: "Saha yöneticisi", c: [1, 1, 2, 2, 1, 3, 3, 2] },
  { id: "Asya", name: "Asya Güner", tenure: "NEW_0_1", mgr: false, note: "Çok yeni — tek bırakma", c: [0, 2, 2, 1, 0, 0, 0, 0] },
  { id: "Aysu", name: "Aysu Öztürk", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 2, 1, 3, 3, 3, 1] },
  { id: "Begüm", name: "Begüm Akar", tenure: "EXPERT", mgr: false, note: "", c: [3, 3, 2, 1, 3, 3, 3, 2] },
  { id: "Ceren", name: "Ceren Bölük", tenure: "NEW_3_6", mgr: false, note: "", c: [0, 2, 2, 1, 0, 3, 3, 2] },
  { id: "Ecem", name: "Ecem Urcan", tenure: "EXPERT", mgr: false, note: "", c: [1, 3, 3, 1, 1, 3, 3, 2] },
  { id: "Emirhan", name: "Emirhan Yeşilçiçek", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 2, 1, 3, 2, 2, 1] },
  { id: "Emrah", name: "Emrah Buzlu", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 1, 2, 1, 3, 2, 2, 1] },
  { id: "Eylül", name: "Eylül Özbek", tenure: "EXPERT", mgr: false, note: "", c: [2, 3, 3, 1, 2, 3, 3, 2] },
  { id: "Fadime", name: "Fadime Kıvrak", tenure: "NEW_1_3", mgr: false, note: "", c: [0, 1, 2, 1, 0, 2, 2, 1] },
  { id: "Fatma", name: "Fatma Yavuz", tenure: "EXPERT", mgr: false, note: "", c: [2, 4, 3, 1, 2, 2, 2, 2] },
  { id: "Gamze", name: "Gamze Kafadar", tenure: "NEW_0_1", mgr: false, note: "Çok yeni — tek bırakma", c: [0, 0, 0, 1, 0, 1, 1, 1] },
  { id: "Güney", name: "Güney Kanıcıoğlu", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 2, 1, 3, 2, 2, 1] },
  { id: "Kaan", name: "Kaan Gündüz", tenure: "NEW_3_6", mgr: false, note: "", c: [1, 3, 2, 1, 1, 2, 2, 2] },
  { id: "Kayra", name: "Kayra Uzun", tenure: "NEW_3_6", mgr: false, note: "", c: [2, 3, 2, 1, 2, 2, 2, 2] },
  { id: "Kıymet", name: "Kıymet Bakır", tenure: "EXPERT", mgr: false, note: "", c: [1, 4, 3, 1, 1, 2, 2, 2] },
  { id: "Meral", name: "Meral Çolak", tenure: "NEW_1_3", mgr: false, note: "", c: [2, 4, 2, 1, 2, 2, 2, 1] },
  { id: "Merih", name: "Merih Baltacı", tenure: "NEW_3_6", mgr: false, note: "", c: [1, 2, 2, 1, 1, 2, 2, 2] },
  { id: "Emir", name: "Emir Güneş", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 1, 1, 3, 2, 2, 1] },
  { id: "Nehir", name: "Nehir Budak", tenure: "EXPERT", mgr: false, note: "", c: [2, 3, 4, 1, 2, 2, 2, 2] },
  { id: "Nimet", name: "Nimet Bozkurt", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 3, 1, 1, 3, 2, 2, 1] },
  { id: "Pelin", name: "Pelin Aydın", tenure: "EXPERT", mgr: false, note: "", c: [1, 3, 3, 1, 1, 3, 3, 2] },
  { id: "Ramazan", name: "Ramazan Hordun", tenure: "EXPERT", mgr: false, note: "", c: [1, 3, 3, 1, 1, 3, 3, 3] },
  { id: "Saliha", name: "Saliha Kılıç", tenure: "NEW_1_3", mgr: false, note: "", c: [1, 1, 1, 1, 1, 2, 2, 3] },
  { id: "Selin", name: "Selin Varlıoğlu", tenure: "NEW_3_6", mgr: false, note: "Güvenli yeni", c: [2, 2, 4, 1, 2, 2, 2, 1] },
  { id: "Sevilay", name: "Sevilay Çelik", tenure: "NEW_3_6", mgr: false, note: "", c: [1, 2, 4, 1, 1, 2, 2, 1] },
  { id: "Sevim", name: "Sevim Yalçın", tenure: "EXPERT", mgr: false, note: "", c: [2, 4, 3, 1, 2, 2, 2, 3] },
  { id: "Şeyma", name: "Şeyma Şemşit", tenure: "EXPERT", mgr: false, note: "", c: [3, 4, 4, 1, 3, 2, 2, 2] },
  { id: "Sude", name: "Sude Yeni", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 4, 2, 1, 3, 2, 2, 1] },
];

const TENURE_LABEL: Record<Row["tenure"], string> = {
  NEW_0_1: "0–1 ay",
  NEW_1_3: "1–3 ay",
  NEW_3_6: "3–6 ay",
  NEW_6_PLUS: "6+ ay",
  EXPERT: "Yetkin",
};

/** id → yetkinlik haritası (chart yerleşimi yetkinliğe göre yapılır). */
export const STAFF_COMP: Record<string, Record<ZoneRole, number>> = {};

function compMap(row: Row): Record<ZoneRole, number> {
  const m = {} as Record<ZoneRole, number>;
  STAFF_ROLES.forEach((r, i) => (m[r] = row.c[i]));
  return m;
}

function levelOf(row: Row): MasteryLevel {
  if (row.mgr) return MasteryLevel.Coach;
  if (row.tenure === "EXPERT") return MasteryLevel.Master;
  if (row.tenure === "NEW_3_6" || row.tenure === "NEW_6_PLUS") return MasteryLevel.Competent;
  return MasteryLevel.New;
}

function confidenceOf(row: Row): Employee["confidence"] {
  if (row.mgr || row.tenure === "EXPERT") return "high";
  if (row.tenure === "NEW_3_6") return "medium";
  return "emerging";
}

function statusFrom(v: number): AsaStatus {
  return v >= 3 ? "strong" : v === 2 ? "developing" : "neutral";
}

function asaOf(c: Record<ZoneRole, number>, row: Row): ASA[] {
  const servis = Math.max(c["Welcome"], c["Kabin Welcomer"]);
  const satis = Math.max(c["Kabin"], c["Welcome"]);
  const ops = Math.round((c["Zone 2"] + c["Zone 3"] + c["Zone 4"] + c["Zone 5"]) / 4);
  const gelisim: AsaStatus = row.mgr || row.tenure === "EXPERT" ? "strong" : "developing";
  return [
    { label: "Müşteri Servisi", weight: 25, status: statusFrom(servis), ...(servis >= 3 ? { provenBy: "karşılama akışı · tepe-saatte korunmuş conversion" } : {}) },
    { label: "Satış", weight: 25, status: statusFrom(satis), ...(satis >= 3 ? { provenBy: "kabin kapatma · conversion lift" } : {}) },
    { label: "Mağaza İçi Operasyonu", weight: 25, status: statusFrom(ops), ...(ops >= 3 ? { provenBy: "zone kapsama · reyon düzeni" } : {}) },
    { label: "Kendini Geliştirme", weight: 10, status: gelisim },
  ];
}

const STATUS_BY_COMP = (v: number): SkillStatus =>
  v >= 4 ? SkillStatus.CanTeach : v === 3 ? SkillStatus.CanDo : v === 2 ? SkillStatus.NeedImprovement : SkillStatus.Theory;

function skillsOf(c: Record<ZoneRole, number>): Skill[] {
  // En güçlü 2 + gelişime açık 2 rol — gerçek yetkinlikten
  const sorted = [...STAFF_ROLES].filter((r) => r !== "Sprinter").sort((a, b) => c[b] - c[a]);
  const pick = [...sorted.slice(0, 2), ...sorted.slice(-2)];
  const seen = new Set<string>();
  return pick
    .filter((r) => (seen.has(r) ? false : (seen.add(r), true)))
    .map((r) => ({ topic: r, status: STATUS_BY_COMP(c[r]) }));
}

function kpisOf(c: Record<ZoneRole, number>): KPI[] {
  const out: KPI[] = [];
  if (c["Kabin"] >= 3) out.push({ label: "Yoğunlukta kapatma", value: "güçlü", trend: "up", evidence: "tepe-saat gözlemlerinden" });
  if (c["Welcome"] >= 3) out.push({ label: "Sıcak karşılama", value: "güçlü", trend: "up" });
  if (out.length === 0) {
    const best = [...STAFF_ROLES].sort((a, b) => c[b] - c[a])[0];
    out.push({ label: `${best} akışı`, value: c[best] >= 2 ? "gelişiyor" : "yeni", trend: "up" });
  }
  return out.slice(0, 2);
}

function tendencyOf(level: MasteryLevel): number[] {
  switch (level) {
    case MasteryLevel.New: return [0, 1, 1, 2];
    case MasteryLevel.Competent: return [1, 2, 2, 3];
    case MasteryLevel.Master: return [2, 3, 3, 4];
    default: return [3, 3, 4, 4];
  }
}

function strongPointOf(c: Record<ZoneRole, number>, row: Row): string {
  if (row.note.includes("yönetici")) return "Saha yönetimi & koçluk — ekibi tepe-saatte dengeler.";
  const best = [...STAFF_ROLES].filter((r) => r !== "Sprinter").sort((a, b) => c[b] - c[a])[0];
  if (c[best] >= 4) return `${best}'de usta — başkasına öğretebilir, tepe-saatte sakin.`;
  if (c[best] >= 3) return `${best}'de güçlü; yoğunlukta güvenilir.`;
  return "Öğrenmeye hevesli; temeller oturuyor.";
}

function growthEdgeOf(c: Record<ZoneRole, number>, row: Row): string {
  if (row.tenure === "NEW_0_1") return "Çok yeni — kıdemli eşliğinde temel roller.";
  const weakFront = c["Welcome"] <= 1 ? "Welcome (karşılama)" : c["Kabin"] <= 1 ? "Kabin akışı" : null;
  if (weakFront) return `${weakFront} — kademeli geliştirilir.`;
  return "One Store derinliği & tepe-saat dayanıklılığı.";
}

function buildEmployee(row: Row): Employee {
  const c = compMap(row);
  STAFF_COMP[row.id] = c;
  const level = levelOf(row);
  const teachRole = STAFF_ROLES.find((r) => c[r] >= 4);
  return {
    id: row.id,
    name: row.name,
    role: Role.SalesAssistant,
    level,
    tenure: TENURE_LABEL[row.tenure],
    asaMap: asaOf(c, row),
    skills: skillsOf(c),
    kpis: kpisOf(c),
    tendency: tendencyOf(level),
    confidence: confidenceOf(row),
    strongPoint: strongPointOf(c, row),
    growthEdge: growthEdgeOf(c, row),
    ...(teachRole ? { canTeach: teachRole } : {}),
  };
}

export const employees: Employee[] = ROWS.map(buildEmployee);
export const byId = (id: string): Employee | undefined => employees.find((e) => e.id === id);

/** Bir role en yetkin kişiler (chart yerleşimi + öneri için). */
export function rankForRole(role: ZoneRole, excludeIds: string[] = []): string[] {
  return ROWS.map((r) => r.id)
    .filter((id) => !excludeIds.includes(id))
    .sort((a, b) => STAFF_COMP[b][role] - STAFF_COMP[a][role]);
}
