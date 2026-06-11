// src/pages/pusula/data.ts
// Pusula veri HUB'ı. Roster artık GERÇEK (ShiftOrganizer seed → data-staff.ts);
// chart/öneri köprüsü placement.ts (gerçek yetkinlik + kademeli swap). Cep, saatlik
// örüntü, ASA→KPI ve Usta Aktarımı burada. Sert skor/sıralama YOK; her şey nitel.

import { SWAPS } from "./placement";
import { jobTypeOf } from "./data-staff";
import { pick } from "./i18n";
import type { HourPoint, PocketState, Recommendation, TeachingCard } from "./types";

// ── Gerçek roster (30 kişi + türetilen nitel profiller) ────
export { employees, byId, jobTypeOf } from "./data-staff";
export type { JobType } from "./data-staff";

/** İş tipi etiketi — aktif dilde (render-time). */
export function jobTypeLabel(id: string): string {
  const j = jobTypeOf(id);
  if (j === "Müdür") return pick({ tr: "Müdür", en: "Manager", es: "Gerente" });
  if (j === "Commercial") return "Commercial";
  return pick({ tr: "Satış Danışmanı", en: "Sales Assistant", es: "Asesor de Ventas" });
}

/** İş tipi — CAPS bağlamlar için (mono uppercase satırlar): TR locale'in
 *  "Commercial"ı "COMMERCİAL" yapmasını önlemek için el-büyütülmüş. */
export function jobTypeLabelCaps(id: string): string {
  const j = jobTypeOf(id);
  if (j === "Müdür") return pick({ tr: "MÜDÜR", en: "MANAGER", es: "GERENTE" });
  if (j === "Commercial") return "COMMERCIAL";
  return pick({ tr: "SATIŞ DANIŞMANI", en: "SALES ASSISTANT", es: "ASESOR DE VENTAS" });
}

// ── Chart köprüsü (placement) ──────────────────────────────
export { CHART_HOURS as chartHours, CHART_ROLES as chartRoles } from "./placement";

/** Öneriler = placement SWAP'larından türetilir (render-time, aktif dilde). */
export function getRecommendations(): Recommendation[] {
  return SWAPS.map((s) => ({
    id: s.id,
    kind: s.kind,
    employeeId: s.expertId,
    buddyId: s.newId,
    toRole: s.toRole,
    hours: s.hours ?? "15:00–20:00",
    thesis: typeof s.thesis === "function" ? s.thesis() : s.thesis,
    evidence: typeof s.evidence === "function" ? s.evidence() : s.evidence,
  }));
}

// ── #4 Akşam cebi — KİLİTLİ 17:00–19:00 (gerçek 2025) ──────
export const pocket: PocketState = {
  window: "17:00–19:00",
  trafficPeak: 743,
  convBefore: [17, 19],
  convAfter: [26, 27], // TEMSÎLÎ rahatlama (yumuşak)
  note: "Tepe trafik · düşük conversion. Dayanıklı/usta eller öne alınınca cep yumuşakça rahatlar.",
};
/** Cep notu — aktif dilde (render-time). */
export const pocketNote = (): string =>
  pick({
    tr: "Tepe trafik · düşük conversion. Dayanıklı/usta eller öne alınınca cep yumuşakça rahatlar.",
    en: "Peak traffic · low conversion. As resilient/master hands come forward, the pocket softly eases.",
    es: "Tráfico pico · baja conversión. Cuando entran manos resistentes/maestras, el hueco se relaja suavemente.",
  });

// ── Saatlik örüntü (Export.xlsx 2025) ──────────────────────
export const hourly: HourPoint[] = [
  { hour: "15:00–16:00", traffic: 520, conv: 45 },
  { hour: "16:00–17:00", traffic: 640, conv: 38 },
  { hour: "17:00–18:00", traffic: 743, conv: 17 }, // cep
  { hour: "18:00–19:00", traffic: 652, conv: 19 }, // cep
  { hour: "19:00–20:00", traffic: 560, conv: 28 },
  { hour: "20:00–21:00", traffic: 430, conv: 42 },
];

// ── #2 ASA → KPI eşlemesi (hangi KPI hangi ASA'yı kanıtlar) ─
/** ASA → KPI eşlemesi — aktif dilde (render-time). */
export const asaKpiRows = (): { asa: string; kpi: string }[] => [
  {
    asa: pick({ tr: "Satış", en: "Sales", es: "Ventas" }),
    kpi: pick({ tr: "conversion · ATV (üst satış) · UPT (çapraz satış)", en: "conversion · ATV (upsell) · UPT (cross-sell)", es: "conversión · ATV (venta adicional) · UPT (venta cruzada)" }),
  },
  {
    asa: pick({ tr: "Müşteri Servisi", en: "Customer Service", es: "Servicio al Cliente" }),
    kpi: pick({ tr: "yaklaşım · tepe-saatte korunmuş conversion (dayanıklılık)", en: "approach · conversion held in peak hours (resilience)", es: "acercamiento · conversión mantenida en hora pico (resistencia)" }),
  },
  {
    asa: pick({ tr: "Kasa Operasyonu & Kayıp Önleme", en: "Till Operations & Loss Prevention", es: "Operación de Caja y Prevención de Pérdidas" }),
    kpi: pick({ tr: "ticket/saat (hız) · iade servis akışı · add-on (parfüm/poşet)", en: "tickets/hour (speed) · returns service flow · add-on (perfume/bag)", es: "tickets/hora (velocidad) · flujo de devoluciones · add-on (perfume/bolsa)" }),
  },
  {
    asa: pick({ tr: "Depo Operasyonu · Ürün Bilgisi", en: "Stockroom Operations · Product Knowledge", es: "Operación de Almacén · Conocimiento de Producto" }),
    kpi: pick({ tr: "25R Correction isabeti · picking/SINT hızı · ITX çözümü", en: "25R Correction accuracy · picking/SINT speed · ITX resolution", es: "precisión 25R Correction · velocidad picking/SINT · resolución ITX" }),
  },
];

// ── Usta Aktarımı — gerçek usta (Fatma, Kabin Akışı: usta · öğretebilir) ──
export const teachingCard: TeachingCard = {
  topic: "Tepe-saat kabin akışı",
  masterId: "Fatma",
  method:
    "Sırayı önce gözle yönet: göz teması + 'hemen alıyorum' ile bekleme stresini düşür; paralel kabin kontrolünü tek elden topla.",
  evidence: "Yoğun vardiyalarda tutarlı.",
  confirmPrompt: "Yöntemini şöyle anladım — doğru mu?",
};
/** Usta Aktarımı metni — aktif dilde (render-time). */
export const teachingText = () => ({
  topic: pick({ tr: "Tepe-saat kabin akışı", en: "Peak-hour fitting-room flow", es: "Flujo de probador en hora pico" }),
  method: pick({
    tr: "Sırayı önce gözle yönet: göz teması + 'hemen alıyorum' ile bekleme stresini düşür; paralel kabin kontrolünü tek elden topla.",
    en: "Manage the queue with your eyes first: eye contact + 'right with you' lowers waiting stress; consolidate parallel fitting-room control in one hand.",
    es: "Gestiona la cola primero con la mirada: contacto visual + 'enseguida estoy' baja el estrés de espera; centraliza el control de los probadores paralelos.",
  }),
  confirmPrompt: pick({ tr: "Yöntemini şöyle anladım — doğru mu?", en: "Here's how I understood your method — is that right?", es: "Así entendí tu método — ¿es correcto?" }),
});
