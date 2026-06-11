// src/pages/pusula/placement.ts
// #3 GERÇEK VERİ KÖPRÜSÜ + #2 KADEMELİ UYGULAMA — artık GERÇEK roster + GERÇEK
// yetkinlikle. Yerleştirme "net": tam akşam (15–20), gerçek 8 kişilik ekip, roller
// operasyonel sırada. ÖNCE (suboptimal: ustalar arka zone'da boşa, tepe kabin yeni
// ellerde) → SONRA (Pusula yetkinliğe göre ustaları tepe kabine alır).
//
// Öneriler = DISJOINT swap'lar (sıra-bağımsız): her kabul iki kişinin rolünü değiştirir,
// kapasite korunur. Hepsi kabul = optimal. Gerçeğe geçişte applyMoves yerine
// trpc.chart.generate → SolveResponse.chart konur; UI değişmez.

import type { ChartState, RecKind, ZoneRole } from "./types";
import { pick } from "./i18n";

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
  kind: RecKind;
  hours?: string; // görünen saat penceresi (keşif = sakin saat)
  thesis: string | (() => string);
  evidence: string | (() => string);
};

/** DISJOINT swap'lar: her kişi en çok bir swap'ta. (thesis/evidence aktif dilde)
 *  Tez dili KANIT dilidir: yetkinlik adı + kanal (sayaç/kesişim/kitapçık) — sayı kişide değil. */
export const SWAPS: Swap[] = [
  {
    id: "s1",
    expertId: "Fatma",
    newId: "Asya",
    toRole: "Kabin",
    kind: "strength",
    thesis: () => pick({
      tr: "Fatma'nın Kabin Akışı & FR→Satış kanıtı usta seviyede (kabin sayacı: dönüşüm taban üstü) ama tepe-saatte Zone 4'te — kabine alınır. Asya çok yeni: kabin yerine sakin Zone 4'te gölge.",
      en: "Fatma's Fitting-room Flow & FR→Sale evidence is at master level (counter: conversion above baseline) yet she's in Zone 4 at peak — move her to the fitting room. Asya is very new: shadows in the calmer Zone 4 instead.",
      es: "La evidencia de Fatma en Flujo de Probador y FR→Venta es de maestra (contador: conversión sobre la base) pero está en Zone 4 en pico — pásala al probador. Asya es muy nueva: acompaña en la tranquila Zone 4.",
    }),
    evidence: () => pick({ tr: "kabin sayacı · FR→satış taban üstü · vardiya-kesişim KPI", en: "fitting-room counter · FR→sale above baseline · shift-overlap KPI", es: "contador de probador · FR→venta sobre la base · KPI de cruce de turnos" }),
  },
  {
    id: "s2",
    expertId: "Şeyma",
    newId: "Gamze",
    toRole: "Kabin",
    kind: "strength",
    thesis: () => pick({
      tr: "Şeyma'nın kanıtı çok kanallı: Kabin Akışı ve Karşılama güçlü — Sprinter'da joker kalmış, tepe kabine alınır. Gamze çok yeni: Sprinter'da (dolum & devir) kıdemli yanında öğrenir, ilk sinyalleri birikir.",
      en: "Şeyma's evidence is multi-channel: strong in Fitting Flow and Greeting — parked as Sprinter joker, move her to peak fitting room. Gamze is very new: learns Sprinter (refill & turnover) beside a senior while her first signals build.",
      es: "La evidencia de Şeyma es multicanal: fuerte en Flujo de Probador y Bienvenida — aparcada como comodín de Sprinter, pásala al probador en pico. Gamze es muy nueva: aprende Sprinter (reposición) junto a una sénior mientras se acumulan sus primeras señales.",
    }),
    evidence: () => pick({ tr: "kabin sayacı + Welcome saatleri conversion'ı · çok kanallı kanıt", en: "fitting-room counter + Welcome-hours conversion · multi-channel evidence", es: "contador de probador + conversión en horas de Welcome · evidencia multicanal" }),
  },
  {
    id: "s3",
    expertId: "Aysu",
    newId: "Emir",
    toRole: "Welcome",
    kind: "synergy",
    thesis: () => pick({
      tr: "Aysu'nun Karşılama & Yönlendirme kanıtı güçlü (Welcome saatlerinde conversion taban üstü) — Welcome'a. Emir'in Ürün & Sell-through sinyali Zone 2 talebine uyuyor. Yer değişir; ikisi de kanıtının olduğu yerde.",
      en: "Aysu's Greeting & Guidance evidence is strong (conversion above baseline in her Welcome hours) — to Welcome. Emir's Product & Sell-through signal fits Zone 2's demand. They swap; each stands where their evidence is.",
      es: "La evidencia de Aysu en Bienvenida y Orientación es fuerte (conversión sobre la base en sus horas de Welcome) — a Welcome. La señal de Producto y Sell-through de Emir encaja con la demanda de Zone 2. Intercambian; cada uno donde está su evidencia.",
    }),
    evidence: () => pick({ tr: "vardiya-kesişim KPI · kitapçık işaretleri", en: "shift-overlap KPI · booklet marks", es: "KPI de cruce de turnos · marcas del cuadernillo" }),
  },
  {
    id: "s4",
    expertId: "Selin",
    newId: "Ecem",
    toRole: "Zone 3",
    kind: "discovery",
    hours: "15:00–16:00",
    thesis: () => pick({
      tr: "Selin'in Reyon Düzeni & Sell-through'da hiç sinyali yok — yargı değil, veri yok. Sakin saatte Zone 3'te keşif vardiyası: hem gelişir hem sinyal birikir. Ecem Kabin Welcomer'da güçlü; kabin hattı sahipsiz kalmaz.",
      en: "Selin has zero signal in Floor Order & Sell-through — not a judgment, just no data. A discovery shift in calm-hour Zone 3: she grows and signal builds. Ecem is strong as Kabin Welcomer; the fitting line stays covered.",
      es: "Selin no tiene señal en Orden de Sala y Sell-through — no es juicio, es falta de datos. Turno de descubrimiento en Zone 3 en hora tranquila: crece y se acumula señal. Ecem es fuerte como Kabin Welcomer; la línea de probador queda cubierta.",
    }),
    evidence: () => pick({ tr: "sinyal haritası · keşfedilmemiş alan → kanıt toplama", en: "signal map · unexplored area → evidence gathering", es: "mapa de señales · área sin explorar → recogida de evidencia" }),
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
