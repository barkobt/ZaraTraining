// src/pages/pusula/placement.ts
// #3 GERÇEK VERİ KÖPRÜSÜ + #2 KADEMELİ UYGULAMA — artık GERÇEK roster + GERÇEK
// yetkinlikle. Yerleştirme "net": tam akşam (15–20), gerçek 8 kişilik ekip, roller
// operasyonel sırada. ÖNCE (suboptimal: ustalar arka zone'da boşa, tepe kabin yeni
// ellerde) → SONRA (Pusula yetkinliğe göre ustaları tepe kabine alır).
//
// Öneriler = DISJOINT swap'lar (sıra-bağımsız): her kabul iki kişinin rolünü değiştirir,
// kapasite korunur. Hepsi kabul = optimal. Gerçeğe geçişte applyMoves yerine
// trpc.chart.generate → SolveResponse.chart konur; UI değişmez.

import type { ChartState, ZoneRole } from "./types";

export const CHART_HOURS = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
export const PEAK_HOURS = ["17:00", "18:00"];
export const CHART_ROLES: ZoneRole[] = [
  "Kabin",
  "Kabin Welcomer",
  "Welcome",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Sprinter",
];

/** Akşam ekibi (8 kişi) — 3 usta · 3 yetkin · 2 yeni. Hepsi 15–20 vardiyada. */
export const CREW = ["Fatma", "Şeyma", "Ecem", "Aysu", "Emir", "Selin", "Asya", "Gamze"];

/** ÖNCE: ustalar (Fatma·Şeyma) arka/joker, tepe kabin yeni ellerde (Asya·Gamze). */
const BEFORE: Record<string, ZoneRole> = {
  Asya: "Kabin",
  Gamze: "Kabin",
  Selin: "Kabin Welcomer",
  Emir: "Welcome",
  Aysu: "Zone 2",
  Ecem: "Zone 3",
  Fatma: "Zone 4",
  Şeyma: "Sprinter",
};

export type Swap = {
  id: string;
  expertId: string;
  newId: string;
  toRole: ZoneRole; // uzmanın gideceği ön-cephe rolü
  kind: "strength" | "synergy" | "growth";
  thesis: string;
  evidence: string;
};

/** DISJOINT swap'lar: her kişi en çok bir swap'ta. */
export const SWAPS: Swap[] = [
  {
    id: "s1",
    expertId: "Fatma",
    newId: "Asya",
    toRole: "Kabin",
    kind: "strength",
    thesis: "Fatma Kabin'de usta (★★★★) ama tepe-saatte Zone 4'te boşa duruyor — kabine alınır. Asya çok yeni, kabin yerine sakin Zone 4'te gölge.",
    evidence: "Yetkinlik tablosu · Kabin 4 vs 2.",
  },
  {
    id: "s2",
    expertId: "Şeyma",
    newId: "Gamze",
    toRole: "Kabin",
    kind: "strength",
    thesis: "Şeyma her alanda güçlü, Sprinter'da joker kalmış — tepe kabine. Gamze çok yeni, Sprinter'da kıdemli yanında öğrenir.",
    evidence: "Yetkinlik · Kabin 4 · all-rounder.",
  },
  {
    id: "s3",
    expertId: "Aysu",
    newId: "Emir",
    toRole: "Welcome",
    kind: "synergy",
    thesis: "Aysu karşılamada güçlü (Welcome ★★★) — Welcome'a; Emir Zone 2'de daha verimli. Yer değişir, ikisi de güçlü olduğu yerde.",
    evidence: "Welcome 3 · birlikte akış.",
  },
];

const SWAP_BY_ID: Record<string, Swap> = Object.fromEntries(SWAPS.map((s) => [s.id, s]));

/** Kabul edilen swap'ları ÖNCE üzerine uygula → id→rol haritası. */
function roleMap(acceptedSwapIds: string[]): Record<string, ZoneRole> {
  const map: Record<string, ZoneRole> = { ...BEFORE };
  for (const sid of acceptedSwapIds) {
    const sw = SWAP_BY_ID[sid];
    if (!sw) continue;
    const ra = map[sw.expertId];
    const rb = map[sw.newId];
    map[sw.expertId] = rb;
    map[sw.newId] = ra;
  }
  return map;
}

/** id→rol haritasını tüm saatlere kopyalayarak ChartState üret. */
export function applyMoves(acceptedSwapIds: string[]): ChartState {
  const map = roleMap(acceptedSwapIds);
  const cells: ChartState = [];
  for (const hour of CHART_HOURS) {
    const byRole = new Map<ZoneRole, string[]>();
    for (const [id, role] of Object.entries(map)) {
      if (!byRole.has(role)) byRole.set(role, []);
      byRole.get(role)!.push(id);
    }
    for (const [role, persons] of byRole) cells.push({ role, hour, persons });
  }
  return cells;
}

export type { ChartState };
