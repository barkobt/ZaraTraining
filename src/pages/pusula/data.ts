// src/pages/pusula/data.ts
// Pusula veri HUB'ı. Roster artık GERÇEK (ShiftOrganizer seed → data-staff.ts);
// chart/öneri köprüsü placement.ts (gerçek yetkinlik + kademeli swap). Cep, saatlik
// örüntü, ASA→KPI ve Usta Aktarımı burada. Sert skor/sıralama YOK; her şey nitel.

import { SWAPS } from "./placement";
import type { HourPoint, PocketState, Recommendation, TeachingCard } from "./types";

// ── Gerçek roster (30 kişi + türetilen nitel profiller) ────
export { employees, byId } from "./data-staff";

// ── Chart köprüsü (placement) ──────────────────────────────
export { CHART_HOURS as chartHours, CHART_ROLES as chartRoles } from "./placement";

/** Öneriler = placement SWAP'larından türetilir (kanıt öneride, kişide değil). */
export const recommendations: Recommendation[] = SWAPS.map((s) => ({
  id: s.id,
  kind: s.kind,
  employeeId: s.expertId,
  buddyId: s.newId,
  toRole: s.toRole,
  hours: "15:00–20:00",
  thesis: s.thesis,
  evidence: s.evidence,
}));

// ── #4 Akşam cebi — KİLİTLİ 17:00–19:00 (gerçek 2025) ──────
export const pocket: PocketState = {
  window: "17:00–19:00",
  trafficPeak: 743,
  convBefore: [17, 19],
  convAfter: [26, 27], // TEMSÎLÎ rahatlama (yumuşak)
  note: "Tepe trafik · düşük conversion. Dayanıklı/usta eller öne alınınca cep yumuşakça rahatlar.",
};

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
export const asaKpiMap: { asa: string; kpi: string }[] = [
  { asa: "Satış", kpi: "conversion · ATV (üst satış) · UPT (çapraz satış)" },
  { asa: "Müşteri Servisi", kpi: "yaklaşım · tepe-saatte korunmuş conversion (dayanıklılık)" },
  { asa: "Kasa Operasyonu & Kayıp Önleme", kpi: "ticket/saat (hız) · iade servis akışı · add-on (parfüm/poşet)" },
  { asa: "Depo Operasyonu · Ürün Bilgisi", kpi: "25R Correction isabeti · picking/SINT hızı · ITX çözümü" },
];

// ── Usta Aktarımı — gerçek usta (Fatma, Kabin ★★★★) ────────
export const teachingCard: TeachingCard = {
  topic: "Tepe-saat kabin akışı",
  masterId: "Fatma",
  method:
    "Sırayı önce gözle yönet: göz teması + 'hemen alıyorum' ile bekleme stresini düşür; paralel kabin kontrolünü tek elden topla.",
  evidence: "Yoğun vardiyalarda tutarlı.",
  confirmPrompt: "Yöntemini şöyle anladım — doğru mu?",
};
