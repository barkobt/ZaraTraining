// src/pages/pusula/data-mentor.ts
// Usta Yolu — mentor↔mentee eşleştirme (GERÇEK roster id'leriyle). Sistem yetkinlik
// boşluğunu + o günkü vardiya çakışmasını okur, gerekçeli eşleşme önerir; koç
// onaylar/düzenler. "Eğitimcinin eğitimi": koç (Baran) da mentee olabilir.
// MATCH-SCORE YÜZDESİ YOK — güven SOFT (emerging/medium/high).
// Metinler render-time pick() ile aktif dilde üretilir.

import type { MentorMatch } from "./types-gelisim";
import { pick } from "./i18n";

const eveningShift = () => pick({ tr: "Akşam · 15–22", en: "Evening · 15–22", es: "Tarde · 15–22" });

/** Başlangıç önerileri (Bugün) — aktif dilde. */
export const mentorMatches = (): MentorMatch[] => [
  {
    id: "mm1",
    mentorId: "Fatma",
    menteeId: "Asya",
    focus: pick({ tr: "Tepe-saat kabin akışı", en: "Peak-hour fitting-room flow", es: "Flujo de probador en hora pico" }),
    reason: pick({
      tr: "Fatma Kabin Akışı'nda usta — öğretebilir (kabin sayacı kanıtlı); Asya çok yeni, kabin temellerini onunla öğreniyor. Bugün ikisi de akşam vardiyasında.",
      en: "Fatma is a master of Fitting-room Flow — can teach (counter-evidenced); Asya is very new and learns the basics with her. Both are on the evening shift today.",
      es: "Fatma es maestra del Flujo de Probador — puede enseñar (evidencia del contador); Asya es muy nueva y aprende lo básico con ella. Hoy ambas están en el turno de tarde.",
    }),
    shift: eveningShift(),
    slot: pick({ tr: "Yarın 15:30–16:00 · sakin açılış", en: "Tomorrow 15:30–16:00 · calm opening", es: "Mañana 15:30–16:00 · apertura tranquila" }),
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm2",
    mentorId: "Şeyma",
    menteeId: "Kaan",
    focus: pick({ tr: "Tepe-saat dayanıklılığı", en: "Peak-hour resilience", es: "Resistencia en hora pico" }),
    reason: pick({
      tr: "Şeyma her alanda güçlü; Kaan kabinde iyi ama yoğunlukta ritmi korumayı geliştiriyor. Vardiyaları çakışıyor.",
      en: "Şeyma is strong everywhere; Kaan is good in the fitting room but working on holding rhythm under load. Their shifts overlap.",
      es: "Şeyma es fuerte en todo; Kaan es bueno en el probador pero mejora el mantener el ritmo bajo presión. Sus turnos coinciden.",
    }),
    shift: pick({ tr: "Öğle · 12–21", en: "Midday · 12–21", es: "Mediodía · 12–21" }),
    slot: pick({ tr: "Yarın 20:00–20:30 · kapanış öncesi", en: "Tomorrow 20:00–20:30 · before closing", es: "Mañana 20:00–20:30 · antes del cierre" }),
    confidence: "medium",
    aiSuggested: true,
  },
];

/** "Yeniden optimize" sonrası (model dünkü sahadan öğrenir) — eğitimcinin eğitimi dahil. */
export const mentorMatchesOptimized = (): MentorMatch[] => [
  {
    id: "mm3",
    mentorId: "Fatma",
    menteeId: "Gamze",
    focus: pick({ tr: "Kabin temelleri & güven", en: "Fitting-room basics & confidence", es: "Básicos de probador y confianza" }),
    reason: pick({
      tr: "Model dünkü yoğun vardiyada Gamze'nin kabinde zorlandığını gördü. Fatma mağazanın en iyilerinden; vardiya eşleşmesi uygun.",
      en: "The model saw Gamze struggle in the fitting room during yesterday's busy shift. Fatma is among the store's best; the shift match fits.",
      es: "El modelo vio que Gamze tuvo dificultades en el probador en el turno ajetreado de ayer. Fatma es de las mejores de la tienda; el emparejamiento de turno encaja.",
    }),
    shift: eveningShift(),
    slot: pick({ tr: "Yarın 15:00–15:30 · sakin", en: "Tomorrow 15:00–15:30 · calm", es: "Mañana 15:00–15:30 · tranquilo" }),
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm4",
    mentorId: "Sevim",
    menteeId: "Fatma",
    focus: pick({ tr: "Usta aktarımı metodolojisi", en: "Mastery-transfer methodology", es: "Metodología de transferencia de maestría" }),
    reason: pick({
      tr: "Fatma usta aktarımına hazır; Sevim (saha yöneticisi) koçluk yöntemini sadeleştirerek aktarıyor. Eğitimcinin de eğitimi — koç gelişir.",
      en: "Fatma is ready to transfer mastery; Sevim (floor manager) passes on a simplified coaching method. Training the trainer — the coach grows.",
      es: "Fatma está lista para transferir maestría; Sevim (gerente de sala) transmite un método de coaching simplificado. Formar al formador — el coach crece.",
    }),
    shift: pick({ tr: "Sabah · 09–18", en: "Morning · 09–18", es: "Mañana · 09–18" }),
    slot: pick({ tr: "Yarın 12:30–13:00 · öğle düşüşü", en: "Tomorrow 12:30–13:00 · midday dip", es: "Mañana 12:30–13:00 · bajada de mediodía" }),
    confidence: "medium",
    aiSuggested: true,
  },
];
