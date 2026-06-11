// src/pages/pusula/data-competency.ts
// İKİ KATMAN + KEŞİF yetkinlik modeli — "Zone 3'te yetkin" yerine ÖLÇÜLEBİLİR davranış.
// Katman 0 (davranışsal 5'li) data-gelisim'de yaşar; bu dosya Katman 1'i taşır:
// 6 operasyonel yetkinlik, her biri GERÇEK kanıt kanalından beslenir:
//   · counter      → kabin sayacı (denenen parça → FR→satış; iade→raf devri)
//   · attribution  → vardiya-kesişim KPI (Orquest roster × One Store saatlik, n vardiya)
//   · booklet      → kitapçık işareti (koç, tarihli)
//   · eas          → EAS kapı kaydı (alarm yanıtları)
//   · coach        → koç gözlem notu
// Kişi×yetkinlik üç hâlde: unexplored (hiç denenmedi → boş bar DEĞİL, keşif aksiyonu) |
// emerging (az kanıt: "sinyal birikiyor · n=3") | proven (NİTEL seviye + kanıt satırı).
// Zone'lar YER olarak kalır; her pozisyon yetkinlik TALEP eder (ROLE_NEEDS) ve eşleşme
// "talep × kanıt" üzerinden kurulur. Ham 0–4 değerler İÇ matematiktir — ASLA ekrana basılmaz;
// n kanıt sayıları (vardiya/olay) serbesttir (kişi skoru değil, kanıt hacmi).

import { STAFF_COMP, byId, employees, tenureKey } from "./data-staff";
import { MasteryLevel } from "./types";
import type { Employee, ZoneRole } from "./types";
import { pick, type Tri } from "./i18n";

// ── Tipler ──────────────────────────────────────────────────
export const COMP_KEYS = ["karsilama", "kabin", "dolum", "sellthrough", "urun", "kayip"] as const;
export type CompKey = (typeof COMP_KEYS)[number];

export type ProvenLevel = "gelisiyor" | "yapabiliyor" | "guclu" | "usta";
export type EvidenceChannel = "counter" | "attribution" | "booklet" | "eas" | "coach";

export interface Evidence {
  channel: EvidenceChannel;
  n: number; // vardiya / olay / işaret sayısı — kanıt HACMİ (kişi skoru değil)
  line: Tri;
}

export type CompState =
  | { kind: "unexplored" }
  | { kind: "emerging"; n: number }
  | { kind: "proven"; level: ProvenLevel; teachable: boolean; n: number };

export interface PersonCompetency {
  comp: CompKey;
  state: CompState;
  evidence: Evidence[];
}

export type AptitudeStatus = "pending" | "approved";
export interface AptitudeSuggestion {
  id: string;
  personId: string;
  comp: CompKey;
  from: ProvenLevel;
  to: ProvenLevel;
  evidence: Evidence; // öneriyi tetikleyen kanıt
  status: AptitudeStatus; // başlangıç hâli; onay UI local state'te
}

export interface CompNeed {
  comp: CompKey;
  weight: 1 | 2 | 3;
}

/** Pozisyon (ZoneRole = YER) → talep ettiği yetkinlikler. Eşleşme buradan kurulur. */
export const ROLE_NEEDS: Record<ZoneRole, CompNeed[]> = {
  Welcome: [
    { comp: "karsilama", weight: 3 },
    { comp: "kayip", weight: 2 },
  ],
  Kabin: [
    { comp: "kabin", weight: 3 },
    { comp: "urun", weight: 1 },
  ],
  "Kabin Welcomer": [
    { comp: "kabin", weight: 3 },
    { comp: "kayip", weight: 2 },
  ],
  Sprinter: [{ comp: "dolum", weight: 3 }],
  "Zone 2": [
    { comp: "sellthrough", weight: 2 },
    { comp: "urun", weight: 2 },
    { comp: "dolum", weight: 1 },
    { comp: "kayip", weight: 1 },
  ],
  "Zone 3": [
    { comp: "sellthrough", weight: 2 },
    { comp: "urun", weight: 2 },
    { comp: "dolum", weight: 1 },
  ],
  "Zone 4": [
    { comp: "dolum", weight: 2 },
    { comp: "sellthrough", weight: 2 },
    { comp: "urun", weight: 1 },
  ],
  "Zone 5": [
    { comp: "sellthrough", weight: 3 },
    { comp: "dolum", weight: 2 },
  ],
};

// ── Etiketler (hepsi render-time, aktif dilde) ──────────────
const LABEL: Record<CompKey, Tri> = {
  karsilama: { tr: "Karşılama & Yönlendirme", en: "Greeting & Guidance", es: "Bienvenida y Orientación" },
  kabin: { tr: "Kabin Akışı & FR→Satış", en: "Fitting-room Flow & FR→Sale", es: "Flujo de Probador y FR→Venta" },
  dolum: { tr: "Reyon Dolumu & Devir", en: "Floor Refill & Turnover", es: "Reposición y Rotación de Sala" },
  sellthrough: { tr: "Reyon Düzeni & Sell-through", en: "Floor Order & Sell-through", es: "Orden de Sala y Sell-through" },
  urun: { tr: "Ürün Bilgisi & Mix-Match", en: "Product Knowledge & Mix-Match", es: "Conocimiento de Producto y Mix-Match" },
  kayip: { tr: "Kayıp Önleme", en: "Loss Prevention", es: "Prevención de Pérdidas" },
};
const SHORT: Record<CompKey, Tri> = {
  karsilama: { tr: "Karşılama", en: "Greeting", es: "Bienvenida" },
  kabin: { tr: "Kabin Akışı", en: "Fitting Flow", es: "Flujo Probador" },
  dolum: { tr: "Dolum & Devir", en: "Refill & Turnover", es: "Reposición" },
  sellthrough: { tr: "Sell-through", en: "Sell-through", es: "Sell-through" },
  urun: { tr: "Ürün & Mix-Match", en: "Product & Mix-Match", es: "Producto y Mix-Match" },
  kayip: { tr: "Kayıp Önleme", en: "Loss Prevention", es: "Prevención" },
};

export const compLabel = (c: CompKey): string => pick(LABEL[c]);
export const compShort = (c: CompKey): string => pick(SHORT[c]);

// CAPS bağlamlar (mono uppercase çipler) için EL-BÜYÜTÜLMÜŞ kısa adlar:
// CSS text-transform TR locale'de İngilizce token'lara noktalı İ basar
// ("MİX-MATCH") — hazır-büyük string'de transform no-op kalır.
const SHORT_CAPS: Record<CompKey, Tri> = {
  karsilama: { tr: "KARŞILAMA", en: "GREETING", es: "BIENVENIDA" },
  kabin: { tr: "KABİN AKIŞI", en: "FITTING FLOW", es: "FLUJO PROBADOR" },
  dolum: { tr: "DOLUM & DEVİR", en: "REFILL & TURNOVER", es: "REPOSICIÓN" },
  sellthrough: { tr: "SELL-THROUGH", en: "SELL-THROUGH", es: "SELL-THROUGH" },
  urun: { tr: "ÜRÜN & MIX-MATCH", en: "PRODUCT & MIX-MATCH", es: "PRODUCTO Y MIX-MATCH" },
  kayip: { tr: "KAYIP ÖNLEME", en: "LOSS PREVENTION", es: "PREVENCIÓN" },
};
export const compShortCaps = (c: CompKey): string => pick(SHORT_CAPS[c]);

const PROVEN_WORD: Record<ProvenLevel, Tri> = {
  gelisiyor: { tr: "gelişiyor", en: "growing", es: "en desarrollo" },
  yapabiliyor: { tr: "yapabiliyor", en: "can do", es: "lo hace" },
  guclu: { tr: "güçlü", en: "strong", es: "fuerte" },
  usta: { tr: "usta", en: "master", es: "maestro" },
};
export const provenWord = (l: ProvenLevel): string => pick(PROVEN_WORD[l]);

export const stateWord = (s: CompState): string =>
  s.kind === "unexplored"
    ? pick({ tr: "keşfedilmemiş", en: "unexplored", es: "sin explorar" })
    : s.kind === "emerging"
      ? pick({ tr: `sinyal birikiyor · n=${s.n}`, en: `signal building · n=${s.n}`, es: `señal en curso · n=${s.n}` })
      : provenWord(s.level);

const CHANNEL: Record<EvidenceChannel, Tri> = {
  counter: { tr: "kabin sayacı", en: "fitting-room counter", es: "contador de probador" },
  attribution: { tr: "vardiya-kesişim KPI", en: "shift-overlap KPI", es: "KPI de cruce de turnos" },
  booklet: { tr: "kitapçık işareti", en: "booklet mark", es: "marca del cuadernillo" },
  eas: { tr: "EAS kapı kaydı", en: "EAS gate log", es: "registro de arcos EAS" },
  coach: { tr: "koç gözlemi", en: "coach observation", es: "observación del coach" },
};
export const channelLabel = (ch: EvidenceChannel): string => pick(CHANNEL[ch]);

// ── Türetme: 8'li pozisyon tohumundan 6'lı kanıt vektörüne ──
// STAFF_COMP burada yalnız İÇ TOHUM olarak okunur; ekrana hiçbir ham değer çıkmaz.
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const clamp4 = (v: number) => Math.max(0, Math.min(4, v));

function tenureBoost(id: string): number {
  const lvl = byId(id)?.level;
  if (lvl === MasteryLevel.Coach || lvl === MasteryLevel.Master) return 1;
  if (lvl === MasteryLevel.Competent) return 0.5;
  return 0;
}

/** Bilinçli "hiç denenmedi" işaretleri — hikâyeyle (data-hafiza notları + keşif önerisi) tutarlı. */
const UNEXPLORED_OVERRIDES: Partial<Record<string, CompKey[]>> = {
  Gamze: ["kabin", "kayip"],
  Asya: ["karsilama", "sellthrough"],
  Fadime: ["karsilama"],
  Saliha: ["kabin"],
  Selin: ["sellthrough"], // Yerleştirme'deki keşif önerisinin (s4) profil karşılığı
};

const RAW_CACHE = new Map<string, Record<CompKey, number>>();

function rawOf(id: string): Record<CompKey, number> {
  const hit = RAW_CACHE.get(id);
  if (hit) return hit;
  const c = STAFF_COMP[id] ?? ({} as Record<ZoneRole, number>);
  const h = hash(id);
  const boost = tenureBoost(id);
  const zoneAvg = ((c["Zone 2"] ?? 0) + (c["Zone 3"] ?? 0) + (c["Zone 4"] ?? 0) + (c["Zone 5"] ?? 0)) / 4;
  const spread = h % 3 === 0 ? 0.5 : h % 3 === 1 ? -0.5 : 0;
  const raw: Record<CompKey, number> = {
    karsilama: clamp4(c["Welcome"] ?? 0),
    kabin: clamp4((2 * (c["Kabin"] ?? 0) + (c["Kabin Welcomer"] ?? 0)) / 3),
    // Sprinter kolonu tohumda sabit (1) — varyans reyon ortalaması + kıdem + hash'ten gelir
    dolum: clamp4(0.45 * zoneAvg + 0.3 * (c["Sprinter"] ?? 0) + boost + ((h % 3) - 1) * 0.5),
    sellthrough: clamp4(zoneAvg + spread),
    // güçlü kabin kapatan ürünü bilir — ürün bilgisi kabin'den de beslenir
    urun: clamp4(Math.max(zoneAvg - spread, (zoneAvg + (c["Kabin"] ?? 0)) / 2 - 0.5)),
    // kayıp önleme kabin hattı + kapı (Welcome) deneyiminden beslenir — tek başına
    // herkesin tepe yetkinliği olmasın diye ağırlık dağıtılmış
    kayip: clamp4(0.5 * (c["Kabin Welcomer"] ?? 0) + 0.35 * (c["Welcome"] ?? 0) + boost * 0.5 + ((h % 5) - 2) * 0.25),
  };
  for (const k of UNEXPLORED_OVERRIDES[id] ?? []) raw[k] = 0;
  RAW_CACHE.set(id, raw);
  return raw;
}

/** İÇ matematik (yerleşim/sıralama) — ASLA ekrana basılmaz. */
export const compRaw = (id: string, comp: CompKey): number => rawOf(id)[comp];

function stateOf(raw: number, h: number): CompState {
  if (raw < 0.75) return { kind: "unexplored" };
  if (raw < 1.5) return { kind: "emerging", n: 2 + (h % 3) };
  const n = 8 + Math.round(raw * 2) + (h % 5);
  const level: ProvenLevel = raw >= 3.5 ? "usta" : raw >= 3 ? "guclu" : raw >= 2.2 ? "yapabiliyor" : "gelisiyor";
  return { kind: "proven", level, teachable: level === "usta", n };
}

// Kanıt satırı şablonları — yetkinlik başına birincil + ikincil kanal.
function evidenceFor(comp: CompKey, n: number): Evidence[] {
  switch (comp) {
    case "karsilama":
      return [
        { channel: "attribution", n, line: { tr: `Welcome saatlerinde mağaza conversion'ı taban üstü ·\u00A0${n}\u00A0vardiya`, en: `store conversion above baseline in Welcome hours ·\u00A0${n}\u00A0shifts`, es: `conversión sobre la base en horas de Welcome ·\u00A0${n}\u00A0turnos` } },
        { channel: "booklet", n: Math.max(2, Math.round(n / 3)), line: { tr: "kitapçık müşteri konuları işaretli", en: "booklet customer topics marked", es: "temas de cliente marcados en el cuadernillo" } },
      ];
    case "kabin":
      return [
        { channel: "counter", n, line: { tr: `FR→satış dönüşümü taban üstü ·\u00A0${n}\u00A0vardiya`, en: `FR→sale conversion above baseline ·\u00A0${n}\u00A0shifts`, es: `conversión probador→venta sobre la base ·\u00A0${n}\u00A0turnos` } },
        { channel: "attribution", n, line: { tr: "kabindeyken tepe-saat conversion korunuyor", en: "peak conversion held while on fitting room", es: "conversión pico sostenida mientras está en probador" } },
      ];
    case "dolum":
      return [
        { channel: "counter", n, line: { tr: `iade→raf devri hızlı (sayaç çıkışı) ·\u00A0${n}\u00A0vardiya`, en: `returns→shelf turnover fast (counter outflow) ·\u00A0${n}\u00A0shifts`, es: `rotación devolución→estante rápida ·\u00A0${n}\u00A0turnos` } },
        { channel: "coach", n: Math.max(2, Math.round(n / 4)), line: { tr: "koç notu: dolum temposu istikrarlı", en: "coach note: steady refill tempo", es: "nota del coach: ritmo de reposición estable" } },
      ];
    case "sellthrough":
      return [
        { channel: "attribution", n, line: { tr: `baktığı reyonun sell-through'u dönem ortalaması üstü ·\u00A0${n}\u00A0vardiya`, en: `sell-through of covered floor above period average ·\u00A0${n}\u00A0shifts`, es: `sell-through de su sala sobre la media ·\u00A0${n}\u00A0turnos` } },
        { channel: "coach", n: Math.max(2, Math.round(n / 4)), line: { tr: "koç notu: reyon düzeni tutarlı", en: "coach note: consistent floor order", es: "nota del coach: orden de sala consistente" } },
      ];
    case "urun":
      return [
        { channel: "booklet", n: Math.max(3, Math.round(n / 2)), line: { tr: "kitapçık ürün konuları işaretli", en: "booklet product topics marked", es: "temas de producto marcados" } },
        { channel: "attribution", n, line: { tr: `sahadayken UPT eğilimi yukarı ·\u00A0${n}\u00A0vardiya`, en: `UPT trends up while on floor ·\u00A0${n}\u00A0shifts`, es: `UPT al alza cuando está en sala ·\u00A0${n}\u00A0turnos` } },
      ];
    case "kayip":
      return [
        { channel: "eas", n, line: { tr: `EAS alarm yanıtları kayıtlı ·\u00A0${n}\u00A0olay`, en: `EAS alarm responses logged ·\u00A0${n}\u00A0events`, es: `respuestas a alarmas EAS registradas ·\u00A0${n}\u00A0eventos` } },
        { channel: "coach", n: Math.max(2, Math.round(n / 4)), line: { tr: "koç notu: düşen ürünü akışa geri kazandırıyor", en: "coach note: recovers dropped items into flow", es: "nota del coach: recupera prendas al flujo" } },
      ];
  }
}

const PC_CACHE = new Map<string, PersonCompetency[]>();

/** Kişinin 6'lı operasyonel yetkinlik profili (kanıtlarıyla). Tri'ler render'da pick'lenir. */
export function personCompetencies(id: string): PersonCompetency[] {
  const hit = PC_CACHE.get(id);
  if (hit) return hit;
  const raw = rawOf(id);
  const h = hash(id);
  const out: PersonCompetency[] = COMP_KEYS.map((comp, i) => {
    const state = stateOf(raw[comp], h + i * 7);
    const evidence =
      state.kind === "proven"
        ? evidenceFor(comp, state.n)
        : state.kind === "emerging"
          ? [{ ...evidenceFor(comp, state.n)[0], n: state.n }]
          : [];
    return { comp, state, evidence };
  });
  PC_CACHE.set(id, out);
  return out;
}

// ── Eşleşme: talep × kanıt ──────────────────────────────────
export function zoneFit(id: string, needs: CompNeed[]): number {
  const raw = rawOf(id);
  return needs.reduce((a, n) => a + n.weight * raw[n.comp], 0);
}

export const roleFit = (id: string, role: ZoneRole): number => zoneFit(id, ROLE_NEEDS[role]);

/** Bir pozisyona en uygun kişiler — talep × kanıt sıralı (eski rankForRole'un yerine). */
export function rankForRoleByFit(role: ZoneRole, excludeIds: string[] = []): string[] {
  return employees
    .map((e) => e.id)
    .filter((id) => !excludeIds.includes(id))
    .sort((a, b) => roleFit(b, role) - roleFit(a, role));
}

/** Zone talebine en uygun kişiler. */
export function rankForZoneByNeeds(needs: CompNeed[], excludeIds: string[] = []): string[] {
  return employees
    .map((e) => e.id)
    .filter((id) => !excludeIds.includes(id))
    .sort((a, b) => zoneFit(b, needs) - zoneFit(a, needs));
}

/** Eşleşmenin NİTEL sözü ("usta/güçlü/uygun/gelişiyor/yeni") — sayı yok. */
export function fitWord(id: string, role: ZoneRole): string {
  const needs = ROLE_NEEDS[role];
  const w = needs.reduce((a, n) => a + n.weight, 0);
  const avg = w ? zoneFit(id, needs) / w : 0;
  return avg >= 3.5
    ? pick({ tr: "usta", en: "master", es: "maestro" })
    : avg >= 3
      ? pick({ tr: "güçlü", en: "strong", es: "fuerte" })
      : avg >= 2.2
        ? pick({ tr: "uygun", en: "a good fit", es: "adecuado" })
        : avg >= 1.5
          ? pick({ tr: "gelişiyor", en: "growing", es: "en desarrollo" })
          : pick({ tr: "yeni", en: "new", es: "nuevo" });
}

/** Eşleşmenin kanıt gerekçesi: "Kabin Akışı güçlü · kabin sayacı · 14 vardiya" gibi. */
export function zoneFitReason(id: string, needs: CompNeed[]): string | null {
  const pcs = personCompetencies(id);
  const sorted = [...needs].sort((a, b) => b.weight - a.weight);
  for (const need of sorted) {
    const pc = pcs.find((p) => p.comp === need.comp);
    if (pc && pc.state.kind === "proven") {
      const ev = pc.evidence[0];
      const unit = pick({ tr: "vardiya", en: "shifts", es: "turnos" });
      return `${compShort(pc.comp)} ${provenWord(pc.state.level)} · ${channelLabel(ev.channel)} ·\u00A0${pc.state.n}\u00A0${unit}`;
    }
  }
  return null;
}

// ── Aptitude döngüsü: kanıt → öneri → koç onayı ─────────────
// Orquest'teki aptitude'u bugün yönetici kanaatle girer; Pusula kanıt birikince
// GÜNCELLEME ÖNERİSİ üretir, koç onaylar. Yazım NİTELDİR (sayı yok).
const NEXT_LEVEL: Record<ProvenLevel, ProvenLevel | null> = {
  gelisiyor: "yapabiliyor",
  yapabiliyor: "guclu",
  guclu: "usta",
  usta: null,
};

export function aptitudeSuggestions(id: string): AptitudeSuggestion[] {
  const h = hash(id);
  const out: AptitudeSuggestion[] = [];
  personCompetencies(id).forEach((pc, i) => {
    if (pc.state.kind !== "proven") return;
    const to = NEXT_LEVEL[pc.state.level];
    if (!to) return;
    // kanıt hacmi eşiği + deterministik "momentum" (herkese değil, birikene)
    if (pc.state.n < 13 || (h + i) % 2 !== 0) return;
    out.push({
      id: `${id}-${pc.comp}`,
      personId: id,
      comp: pc.comp,
      from: pc.state.level,
      to,
      evidence: pc.evidence[0],
      status: "pending",
    });
  });
  return out.slice(0, 2);
}

// ── Keşif: hiç denenmemiş alan → buddy'li deneme vardiyası ──
export interface Discovery {
  comp: CompKey;
  buddyId: string;
  buddyName: string;
}

export function discoveryFor(id: string): Discovery | null {
  const un = personCompetencies(id).find((p) => p.state.kind === "unexplored");
  if (!un) return null;
  const buddyId = employees
    .map((e) => e.id)
    .filter((bid) => bid !== id)
    .sort((a, b) => compRaw(b, un.comp) - compRaw(a, un.comp))[0];
  if (!buddyId) return null;
  return { comp: un.comp, buddyId, buddyName: byId(buddyId)?.name.split(" ")[0] ?? buddyId };
}

/** Keşif cümlesi — aktif dilde ("hem gelişim hem sinyal"). */
export function discoveryText(d: Discovery): string {
  return pick({
    tr: `${compLabel(d.comp)} hiç denenmedi — sakin saatte (15–16) ${d.buddyName} eşliğinde keşif vardiyası: hem gelişim hem sinyal.`,
    en: `${compLabel(d.comp)} never tried — a discovery shift in the calm hour (15–16) alongside ${d.buddyName}: growth and signal at once.`,
    es: `${compLabel(d.comp)} sin probar — turno de descubrimiento en la hora tranquila (15–16) junto a ${d.buddyName}: desarrollo y señal a la vez.`,
  });
}

/** Keşif slot etiketi (kısa). */
export const discoverySlot = (): string =>
  pick({ tr: "sakin saat · 15–16", en: "calm hour · 15–16", es: "hora tranquila · 15–16" });

// ── Kişi cümleleri (kart/drawer) — eski "Zone X'te usta" dili yerine yetkinlik dili ──
export function strongPointOf(emp: Employee): string {
  if (emp.level === MasteryLevel.Coach)
    return pick({
      tr: "Saha yönetimi & koçluk — ekibi tepe-saatte dengeler.",
      en: "Floor management & coaching — balances the team in peak hours.",
      es: "Gestión de sala y coaching — equilibra al equipo en hora pico.",
    });
  const raw = rawOf(emp.id);
  const best = [...COMP_KEYS].sort((a, b) => raw[b] - raw[a])[0];
  const pc = personCompetencies(emp.id).find((p) => p.comp === best);
  if (pc?.state.kind === "proven" && pc.state.level === "usta")
    return pick({
      tr: `${compLabel(best)} — usta seviye kanıt; başkasına öğretebilir, tepe-saatte sakin.`,
      en: `${compLabel(best)} — master-level evidence; can teach others, calm at peak.`,
      es: `${compLabel(best)} — evidencia de nivel maestro; puede enseñar, serena en pico.`,
    });
  if (pc?.state.kind === "proven" && (pc.state.level === "guclu" || pc.state.level === "yapabiliyor"))
    return pick({
      tr: `${compLabel(best)} — kanıtlı güç; yoğunlukta güvenilir.`,
      en: `${compLabel(best)} — proven strength; reliable under load.`,
      es: `${compLabel(best)} — fuerza comprobada; fiable bajo presión.`,
    });
  return pick({ tr: "Öğrenmeye hevesli; temeller oturuyor.", en: "Eager to learn; foundations settling.", es: "Con ganas de aprender; las bases se asientan." });
}

export function growthEdgeOf(emp: Employee): string {
  if (tenureKey(emp.id) === "NEW_0_1")
    return pick({ tr: "Çok yeni — kıdemli eşliğinde temel akışlar.", en: "Very new — core flows paired with a senior.", es: "Muy nuevo — flujos básicos junto a un sénior." });
  const pcs = personCompetencies(emp.id);
  const front = pcs.find((p) => (p.comp === "karsilama" || p.comp === "kabin") && p.state.kind !== "proven");
  if (front?.state.kind === "unexplored")
    return pick({
      tr: `${compLabel(front.comp)} hiç denenmedi — keşif vardiyasıyla başlanır.`,
      en: `${compLabel(front.comp)} never tried — starts with a discovery shift.`,
      es: `${compLabel(front.comp)} sin probar — se empieza con un turno de descubrimiento.`,
    });
  if (front)
    return pick({
      tr: `${compLabel(front.comp)} — sinyal birikiyor, kademeli geliştirilir.`,
      en: `${compLabel(front.comp)} — signal building, developed gradually.`,
      es: `${compLabel(front.comp)} — señal en curso, se desarrolla gradualmente.`,
    });
  return pick({ tr: "One Store derinliği & tepe-saat dayanıklılığı.", en: "One Store depth & peak-hour resilience.", es: "Profundidad One Store y resistencia en hora pico." });
}
