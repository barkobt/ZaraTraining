// src/pages/pusula/data-staff.ts
// GERÇEK ROSTER — ShiftOrganizer seed'inden (db/seed.ts) birebir: 30 personel.
// Buradaki 8-pozisyon matrisi (STAFF_COMP) artık yalnız İÇ TOHUMDUR: UI ve
// sıralama bunu OKUMAZ — data-competency.ts ondan 6'lı KANIT katmanını türetir
// (karşılama · kabin · dolum · sell-through · ürün · kayıp önleme) ve tüm
// eşleşme/etiketler oradan gelir. Sert skor ekrana basılmaz.

import { MasteryLevel, Role, type Employee, type ZoneRole } from "./types";
import { pick } from "./i18n";

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

export type TenureKey = "NEW_0_1" | "NEW_1_3" | "NEW_3_6" | "NEW_6_PLUS" | "EXPERT";

type Row = {
  id: string;
  name: string;
  tenure: TenureKey;
  mgr: boolean;
  note: string;
  /** [Welcome, Kabin, Kabin Welcomer, Sprinter, Zone 2, Zone 3, Zone 4, Zone 5] */
  c: [number, number, number, number, number, number, number, number];
};

// Kaynak: db/seed.ts STAFF (2026-05-18 yetkinlik tablosu).
// 2026-06-18: `c` yetkinlik tohumları canlı DB competencies ile MAX-MERGE edildi
// (her hücre = max(mock, gerçek)). Demo ustaları korunur (mock taban), gerçek veri
// daha yüksek olduğu yerde yansır. İsimler/anlatı bilinçli MOCK kaldı (çapraz-link
// bütünlüğü). DB'de karşılığı olmayanlar (Asya·Ceren·Emrah·Nimet) saf mock.
const ROWS: Row[] = [
  { id: "Ada", name: "Ada Özaşçı", tenure: "NEW_3_6", mgr: false, note: "", c: [4, 2, 3, 3, 4, 3, 3, 2] },
  { id: "Baran", name: "Baran Bozkurt", tenure: "EXPERT", mgr: false, note: "", c: [1, 1, 2, 3, 2, 4, 4, 2] },
  { id: "Asya", name: "Asya Güner", tenure: "NEW_0_1", mgr: false, note: "Çok yeni — tek bırakma", c: [0, 2, 2, 1, 0, 0, 0, 0] },
  { id: "Aysu", name: "Aysu Öztürk", tenure: "NEW_3_6", mgr: false, note: "", c: [4, 2, 2, 2, 4, 3, 3, 1] },
  { id: "Begüm", name: "Begüm Akar", tenure: "EXPERT", mgr: false, note: "", c: [4, 3, 2, 2, 4, 3, 3, 3] },
  { id: "Ceren", name: "Ceren Bölük", tenure: "NEW_3_6", mgr: false, note: "", c: [0, 2, 2, 1, 0, 3, 3, 2] },
  { id: "Ecem", name: "Ecem Urcan", tenure: "EXPERT", mgr: false, note: "", c: [1, 4, 4, 1, 1, 3, 3, 2] },
  { id: "Emirhan", name: "Emirhan Yeşilçiçek", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 2, 2, 3, 2, 2, 4] },
  { id: "Emrah", name: "Emrah Buzlu", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 1, 2, 1, 3, 2, 2, 1] },
  { id: "Eylül", name: "Eylül Özbek", tenure: "EXPERT", mgr: false, note: "", c: [3, 3, 3, 3, 2, 3, 3, 4] },
  { id: "Fadime", name: "Fadime Kıvrak", tenure: "NEW_1_3", mgr: false, note: "", c: [0, 1, 2, 3, 2, 4, 4, 2] },
  { id: "Fatma", name: "Fatma Yavuz", tenure: "EXPERT", mgr: false, note: "", c: [2, 4, 4, 1, 2, 2, 2, 2] },
  { id: "Gamze", name: "Gamze Kafadar", tenure: "NEW_0_1", mgr: false, note: "Çok yeni — tek bırakma", c: [0, 0, 0, 1, 0, 1, 1, 1] },
  { id: "Güney", name: "Güney Kanıcıoğlu", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 2, 2, 3, 4, 4, 1] },
  { id: "Kaan", name: "Kaan Gündüz", tenure: "NEW_3_6", mgr: false, note: "", c: [2, 3, 2, 3, 2, 4, 4, 2] },
  { id: "Kayra", name: "Kayra Uzun", tenure: "NEW_3_6", mgr: false, note: "", c: [2, 4, 4, 1, 2, 2, 2, 2] },
  { id: "Kıymet", name: "Kıymet Bakır", tenure: "EXPERT", mgr: false, note: "", c: [2, 4, 3, 3, 2, 4, 4, 2] },
  { id: "Meral", name: "Meral Çolak", tenure: "NEW_1_3", mgr: false, note: "", c: [2, 4, 2, 4, 2, 3, 3, 3] },
  { id: "Merih", name: "Merih Baltacı", tenure: "NEW_3_6", mgr: false, note: "", c: [1, 2, 2, 4, 2, 2, 2, 2] },
  { id: "Emir", name: "Emir Güneş", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 2, 1, 1, 3, 4, 4, 1] },
  { id: "Nehir", name: "Nehir Budak", tenure: "EXPERT", mgr: false, note: "", c: [2, 4, 4, 1, 2, 2, 2, 2] },
  { id: "Nimet", name: "Nimet Bozkurt", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 3, 1, 1, 3, 2, 2, 1] },
  { id: "Pelin", name: "Pelin Aydın", tenure: "EXPERT", mgr: false, note: "", c: [1, 4, 4, 1, 1, 3, 3, 2] },
  { id: "Ramazan", name: "Ramazan Hordun", tenure: "EXPERT", mgr: false, note: "", c: [2, 3, 3, 3, 2, 3, 3, 4] },
  { id: "Saliha", name: "Saliha Kılıç", tenure: "NEW_1_3", mgr: false, note: "", c: [1, 1, 1, 2, 2, 2, 2, 4] },
  { id: "Selin", name: "Selin Varlıoğlu", tenure: "NEW_3_6", mgr: false, note: "Güvenli yeni", c: [4, 2, 4, 4, 4, 3, 3, 3] },
  { id: "Sevilay", name: "Sevilay Çelik", tenure: "NEW_3_6", mgr: false, note: "", c: [1, 2, 4, 4, 3, 3, 3, 3] },
  { id: "Sevim", name: "Sevim Yalçın", tenure: "EXPERT", mgr: true, note: "Saha yöneticisi", c: [2, 4, 4, 1, 2, 2, 2, 3] },
  { id: "Şeyma", name: "Şeyma Şemşit", tenure: "EXPERT", mgr: false, note: "", c: [3, 4, 4, 1, 3, 2, 2, 2] },
  { id: "Sude", name: "Sude Yeni", tenure: "NEW_3_6", mgr: false, note: "", c: [3, 4, 3, 3, 3, 3, 3, 4] },
];

const TENURE_LABEL: Record<TenureKey, () => string> = {
  NEW_0_1: () => pick({ tr: "0–1 ay", en: "0–1 month", es: "0–1 mes" }),
  NEW_1_3: () => pick({ tr: "1–3 ay", en: "1–3 months", es: "1–3 meses" }),
  NEW_3_6: () => pick({ tr: "3–6 ay", en: "3–6 months", es: "3–6 meses" }),
  NEW_6_PLUS: () => pick({ tr: "6+ ay", en: "6+ months", es: "6+ meses" }),
  // "Yetkin" mastery çipiyle ("Usta") çelişkili okunuyordu — kıdem dili ayrıştırıldı
  EXPERT: () => pick({ tr: "Deneyimli", en: "Experienced", es: "Experimentado" }),
};

const ROW_BY_ID: Record<string, Row> = {};

/** İÇ TOHUM — UI/sıralama bunu OKUMAZ; data-competency türetilmiş 6'lı katmanı kullanır. */
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

// ── Render-time, lang-aware erişimciler ─────────────────────
export const tenureOf = (emp: Employee): string => {
  const row = ROW_BY_ID[emp.id];
  return row ? TENURE_LABEL[row.tenure]() : emp.tenure;
};

/** Kıdem anahtarı (dil-bağımsız) — data-competency'nin türetimi için. */
export const tenureKey = (id: string): TenureKey => ROW_BY_ID[id]?.tenure ?? "NEW_3_6";

function buildEmployee(row: Row): Employee {
  STAFF_COMP[row.id] = compMap(row);
  ROW_BY_ID[row.id] = row;
  return {
    id: row.id,
    name: row.name,
    role: Role.SalesAssistant,
    level: levelOf(row),
    tenure: TENURE_LABEL[row.tenure](),
    confidence: confidenceOf(row),
  };
}

export const employees: Employee[] = ROWS.map(buildEmployee);
export const byId = (id: string): Employee | undefined => employees.find((e) => e.id === id);

// ── İş tipi (Müdür / Commercial / Satış Danışmanı) ─────────
// ShiftOrganizer Rapor'undaki görev dağılımına sadık: Müdür 1, Commercial (COM) birkaç,
// gerisi Satış Danışmanı. Herkesin gelişim planı buna + yaşam evresine göre değişir.
export type JobType = "Müdür" | "Commercial" | "Satış Danışmanı";
const COMMERCIAL = new Set(["Şeyma", "Begüm", "Ecem", "Eylül"]);
export function jobTypeOf(id: string): JobType {
  if (id === "Sevim") return "Müdür";
  if (COMMERCIAL.has(id)) return "Commercial";
  return "Satış Danışmanı";
}
