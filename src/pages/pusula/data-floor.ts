// src/pages/pusula/data-floor.ts
// Saha Krokisi — Pusula mağaza planını (public/pusula-plan.png) "tanır": zone'lar
// GERÇEK mimariye göre konumlanır (kullanıcının etiketli krokisinden birebir).
// Mağaza ÜÇ BÖLÜME ayrılır: Kadın (sol) · Çocuk (orta) · Erkek (sağ). Aynı zone
// numarası farklı bölümlerde farklı fiziksel alandır.
// Her zone bir SÜRÜCÜ METRİKten beslenir: Welcome → ziyaret artışı + ürün alarmı,
// reyon zone'ları → sell-through, kabin → trafik/bekleme, kasa → kuyruk. Trafik mock;
// akşam tepe örüntüsüne sadık. Rol olan zone'a tıklayınca Pusula "kimi koyar + neden"
// önerir ve müsait (boşta) bir eli o zone'a EŞLER (yetkinlikten, NİTEL — skor yok).

import type { ZoneRole } from "./types";
import type { CompNeed } from "./data-competency";
import { pick, type Tri } from "./i18n";

/** Bir zone'u SÜRÜKLEYEN metrik türü (yerleşim bundan planlanır). */
export type ZoneDriver = "footfall" | "alarm" | "fitting" | "queue" | "sellthrough";
/** Mağaza bölümü (beyaz çizgilerle ayrılan üç reyon). */
export type Dept = "kadin" | "cocuk" | "erkek" | null;

export interface FloorZone {
  id: string;
  label: Tri; // görünen ad (üç dilli; "· Bölüm" ile ayrışır)
  x: number; // % yatay
  y: number; // % dikey (0 üst = kuzey)
  traffic: number; // 0–100 canlı yoğunluk (sürücü metriğin şiddeti)
  role: ZoneRole | null; // yerleşim için geçerli kadro rolü (null = bağlam alanı)
  area: "on" | "context"; // ön cephe vs bağlam (kapı/kasa)
  dept: Dept; // hangi reyon bölümü
  drivers: ZoneDriver[]; // bu zone'u besleyen metrik(ler)
  metric: Tri; // tek satır canlı okuma
  /** Bu zone'un TALEP ettiği yetkinlikler (eşleşme = talep × kişi kanıtı). Bağlam alanı = []. */
  needs: CompNeed[];
  /** Bugünkü baskı sinyali (mock) — talep tarafının "neden şimdi"si. */
  pressure?: Tri;
}

// Konumlar kullanıcının ETİKETLİ krokisinden (kuzey=üst). NOT: Zone 1 için ayrı
// kadro rolü yok → en yakın "Zone 2" rolüne eşlenir (etiket "Zone 1 · …" kalır).
export const FLOOR_ZONES: FloorZone[] = [
  // ══ KADIN BÖLÜMÜ (sol) ══
  {
    id: "kw", label: { tr: "Kabin Welcomer · Kadın", en: "Fitting-room Welcomer · Women", es: "Welcomer de Probador · Mujer" },
    x: 10, y: 8, traffic: 74, role: "Kabin Welcomer", area: "on", dept: "kadin",
    drivers: ["fitting", "alarm"],
    metric: { tr: "Kabin girişi yoğun · alarm/kayıp izleme", en: "Busy cabin entry · alarm/loss watch", es: "Entrada de probador concurrida · vigilancia de alarma/pérdida" },
    needs: [{ comp: "kabin", weight: 3 }, { comp: "kayip", weight: 2 }],
    pressure: { tr: "iade hacmi ↑ · alarm izleme sürekli", en: "returns volume ↑ · constant alarm watch", es: "volumen de devoluciones ↑ · vigilancia constante" },
  },
  {
    id: "kabin", label: { tr: "Kabin · Kadın", en: "Fitting Room · Women", es: "Probador · Mujer" },
    x: 31, y: 7, traffic: 92, role: "Kabin", area: "on", dept: "kadin",
    drivers: ["fitting"],
    metric: { tr: "Kabin trafiği zirvede · bekleme ↑ · dönüşüm dibinde", en: "Fitting traffic peaking · wait ↑ · conversion bottoming", es: "Tráfico de probador en pico · espera ↑ · conversión al fondo" },
    needs: [{ comp: "kabin", weight: 3 }, { comp: "urun", weight: 1 }],
    pressure: { tr: "denenen parça zirvede (sayaç) · FR→satış baskısı", en: "items tried peaking (counter) · FR→sale pressure", es: "prendas probadas en pico (contador) · presión FR→venta" },
  },
  {
    id: "zone5", label: { tr: "Zone 5 · Kadın", en: "Zone 5 · Women", es: "Zone 5 · Mujer" },
    x: 24, y: 22, traffic: 40, role: "Zone 5", area: "on", dept: "kadin",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %34 · reyon sakin", en: "Sell-through 34% · floor calm", es: "Sell-through 34% · sala tranquila" },
    needs: [{ comp: "sellthrough", weight: 3 }, { comp: "dolum", weight: 2 }],
    pressure: { tr: "sell-through düşük — düzen + dolum baskısı", en: "sell-through low — order + refill pressure", es: "sell-through bajo — presión de orden y reposición" },
  },
  {
    id: "zone4", label: { tr: "Zone 4 · Kadın", en: "Zone 4 · Women", es: "Zone 4 · Mujer" },
    x: 21, y: 39, traffic: 52, role: "Zone 4", area: "on", dept: "kadin",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %48 · dengede", en: "Sell-through 48% · balanced", es: "Sell-through 48% · equilibrado" },
    needs: [{ comp: "dolum", weight: 2 }, { comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 1 }],
    pressure: { tr: "bekleyen dolum görevleri · iade dönüşü yoğun", en: "pending refill tasks · busy returns flow", es: "tareas de reposición pendientes · devoluciones intensas" },
  },
  {
    id: "zone3k", label: { tr: "Zone 3 · Kadın", en: "Zone 3 · Women", es: "Zone 3 · Mujer" },
    x: 21, y: 56, traffic: 56, role: "Zone 3", area: "on", dept: "kadin",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %51 · dönüşüm artıyor", en: "Sell-through 51% · conversion rising", es: "Sell-through 51% · conversión subiendo" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 2 }, { comp: "dolum", weight: 1 }],
  },
  {
    id: "zone2k", label: { tr: "Zone 2 · Kadın", en: "Zone 2 · Women", es: "Zone 2 · Mujer" },
    x: 22, y: 71, traffic: 60, role: "Zone 2", area: "on", dept: "kadin",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %55 · trafik yükseliyor", en: "Sell-through 55% · traffic rising", es: "Sell-through 55% · tráfico subiendo" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 2 }, { comp: "dolum", weight: 1 }, { comp: "kayip", weight: 1 }],
  },
  {
    id: "welcome", label: { tr: "Welcome · Kadın", en: "Welcome · Women", es: "Welcome · Mujer" },
    x: 21, y: 85, traffic: 78, role: "Welcome", area: "on", dept: "kadin",
    drivers: ["footfall", "alarm"],
    metric: { tr: "Ziyaret +18% · 2 ürün alarmı/saat", en: "Visits +18% · 2 product alarms/hr", es: "Visitas +18% · 2 alarmas de producto/h" },
    needs: [{ comp: "karsilama", weight: 3 }, { comp: "kayip", weight: 2 }],
    pressure: { tr: "footfall ↑ · 2 alarm/saat — ilk temas kritik", en: "footfall ↑ · 2 alarms/hr — first contact critical", es: "footfall ↑ · 2 alarmas/h — primer contacto crítico" },
  },
  {
    id: "kadingiris", label: { tr: "Kadın Giriş", en: "Women's Entrance", es: "Entrada Mujer" },
    x: 31, y: 94, traffic: 82, role: null, area: "context", dept: "kadin",
    drivers: ["footfall"],
    metric: { tr: "Giriş sayacı zirvede — footfall ↑", en: "Door counter peaking — footfall ↑", es: "Contador de puerta en pico — footfall ↑" },
    needs: [],
  },

  // ══ ORTAK KASA HATTI ══
  {
    id: "kasa", label: { tr: "Regular Kasa · İade", en: "Regular Till · Returns", es: "Caja Regular · Devoluciones" },
    x: 45, y: 13, traffic: 66, role: null, area: "context", dept: null,
    drivers: ["queue"],
    metric: { tr: "Kuyruk orta · iade akışı · ticket/saat iyi", en: "Queue medium · returns flow · tickets/hr good", es: "Cola media · flujo de devoluciones · tickets/h bien" },
    needs: [],
  },
  {
    id: "aco", label: { tr: "ACO · Ödeme Kasası", en: "ACO · Self-checkout", es: "ACO · Autopago" },
    x: 46, y: 30, traffic: 58, role: null, area: "context", dept: null,
    drivers: ["queue"],
    metric: { tr: "Self-ödeme akıyor · yönlendirme gerekli", en: "Self-checkout flowing · needs guidance", es: "Autopago fluyendo · requiere orientación" },
    needs: [],
  },

  // ══ ÇOCUK BÖLÜMÜ (orta) ══
  {
    id: "cocukkabin", label: { tr: "Çocuk Kabin", en: "Kids' Fitting Room", es: "Probador Infantil" },
    x: 51, y: 37, traffic: 44, role: null, area: "context", dept: "cocuk",
    drivers: ["fitting"],
    metric: { tr: "Orta trafik · sakin akış", en: "Medium traffic · calm flow", es: "Tráfico medio · flujo tranquilo" },
    needs: [],
  },
  {
    id: "zone2c", label: { tr: "Zone 2 · Çocuk", en: "Zone 2 · Kids", es: "Zone 2 · Niños" },
    x: 55, y: 51, traffic: 58, role: "Zone 2", area: "on", dept: "cocuk",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %52 · çocuk reyonu dengede", en: "Sell-through 52% · kids' floor balanced", es: "Sell-through 52% · sala infantil equilibrada" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 2 }, { comp: "dolum", weight: 1 }],
  },
  {
    id: "zone1c", label: { tr: "Zone 1 · Çocuk", en: "Zone 1 · Kids", es: "Zone 1 · Niños" },
    x: 57, y: 73, traffic: 66, role: "Zone 2", area: "on", dept: "cocuk",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %60 · giriş yakını, yoğun", en: "Sell-through 60% · near entry, busy", es: "Sell-through 60% · cerca de entrada, concurrido" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "dolum", weight: 2 }, { comp: "urun", weight: 1 }],
  },
  {
    id: "cocukgiris", label: { tr: "Çocuk Giriş", en: "Kids' Entrance", es: "Entrada Infantil" },
    x: 57, y: 91, traffic: 58, role: null, area: "context", dept: "cocuk",
    drivers: ["footfall"],
    metric: { tr: "Orta footfall · aile akışı", en: "Medium footfall · family flow", es: "Footfall medio · flujo familiar" },
    needs: [],
  },

  // ══ ERKEK BÖLÜMÜ (sağ) ══
  {
    id: "erkekkabin", label: { tr: "Erkek Kabin", en: "Men's Fitting Room", es: "Probador de Hombre" },
    x: 73, y: 19, traffic: 40, role: null, area: "context", dept: "erkek",
    drivers: ["fitting"],
    metric: { tr: "Düşük trafik · sakin", en: "Low traffic · calm", es: "Tráfico bajo · tranquilo" },
    needs: [],
  },
  {
    id: "zone3e", label: { tr: "Zone 3 · Erkek", en: "Zone 3 · Men", es: "Zone 3 · Hombre" },
    x: 84, y: 36, traffic: 48, role: "Zone 3", area: "on", dept: "erkek",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %44 · erkek üst reyon dengede", en: "Sell-through 44% · men's upper floor balanced", es: "Sell-through 44% · sala superior de hombre equilibrada" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 2 }, { comp: "dolum", weight: 1 }],
  },
  {
    id: "zone2e", label: { tr: "Zone 2 · Erkek", en: "Zone 2 · Men", es: "Zone 2 · Hombre" },
    x: 84, y: 56, traffic: 54, role: "Zone 2", area: "on", dept: "erkek",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %50 · erkek orta reyon", en: "Sell-through 50% · men's mid floor", es: "Sell-through 50% · sala media de hombre" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "urun", weight: 2 }, { comp: "dolum", weight: 1 }],
  },
  {
    id: "zone1e", label: { tr: "Zone 1 · Erkek", en: "Zone 1 · Men", es: "Zone 1 · Hombre" },
    x: 81, y: 73, traffic: 58, role: "Zone 2", area: "on", dept: "erkek",
    drivers: ["sellthrough"],
    metric: { tr: "Sell-through %54 · erkek giriş yakını", en: "Sell-through 54% · near men's entry", es: "Sell-through 54% · cerca de entrada de hombre" },
    needs: [{ comp: "sellthrough", weight: 2 }, { comp: "dolum", weight: 2 }, { comp: "kayip", weight: 1 }],
  },
  {
    id: "erkekgiris", label: { tr: "Erkek Giriş", en: "Men's Entrance", es: "Entrada Hombre" },
    x: 83, y: 87, traffic: 50, role: null, area: "context", dept: "erkek",
    drivers: ["footfall"],
    metric: { tr: "Orta footfall · iki kapı", en: "Medium footfall · two doors", es: "Footfall medio · dos puertas" },
    needs: [],
  },
];

/** Zone etiketi — aktif dilde. */
export const zoneLabel = (z: FloorZone): string => pick(z.label);
/** Zone canlı metrik okuması — aktif dilde. */
export const zoneMetric = (z: FloorZone): string => pick(z.metric);

/** Bölüm etiketi — aktif dilde. */
export const deptLabel = (d: Dept): string => {
  switch (d) {
    case "kadin": return pick({ tr: "Kadın Bölümü", en: "Women's Section", es: "Sección de Mujer" });
    case "cocuk": return pick({ tr: "Çocuk Bölümü", en: "Kids' Section", es: "Sección Infantil" });
    case "erkek": return pick({ tr: "Erkek Bölümü", en: "Men's Section", es: "Sección de Hombre" });
    default: return pick({ tr: "Ortak", en: "Shared", es: "Común" });
  }
};
/** Lejant için bölüm listesi. */
export const DEPTS: Exclude<Dept, null>[] = ["kadin", "cocuk", "erkek"];

/** Sürücü metrik etiketi — aktif dilde (panelde çip olarak görünür). */
export const driverLabel = (d: ZoneDriver): string => {
  switch (d) {
    case "footfall": return pick({ tr: "Ziyaret artışı", en: "Visit increase", es: "Aumento de visitas" });
    case "alarm": return pick({ tr: "Ürün alarmı", en: "Product alarm", es: "Alarma de producto" });
    case "fitting": return pick({ tr: "Kabin trafiği", en: "Fitting traffic", es: "Tráfico de probador" });
    case "queue": return pick({ tr: "Kasa kuyruğu", en: "Till queue", es: "Cola de caja" });
    case "sellthrough": return pick({ tr: "Sell-through", en: "Sell-through", es: "Sell-through" });
  }
};

export type TrafficLevel = "Zirve" | "Yoğun" | "Dengede" | "Sakin";
export function trafficLevel(t: number): TrafficLevel {
  return t >= 85 ? "Zirve" : t >= 62 ? "Yoğun" : t >= 40 ? "Dengede" : "Sakin";
}
/** Trafik seviyesi etiketi — aktif dilde (anahtar TR kalır). */
export function trafficLabel(t: number): string {
  const lvl = trafficLevel(t);
  return lvl === "Zirve"
    ? pick({ tr: "Zirve", en: "Peak", es: "Pico" })
    : lvl === "Yoğun"
      ? pick({ tr: "Yoğun", en: "Busy", es: "Concurrido" })
      : lvl === "Dengede"
        ? pick({ tr: "Dengede", en: "Balanced", es: "Equilibrado" })
        : pick({ tr: "Sakin", en: "Calm", es: "Tranquilo" });
}

/** Markör boyutu trafikle (32–58px). */
export function markerSize(t: number): number {
  return Math.round(32 + (t / 100) * 26);
}
