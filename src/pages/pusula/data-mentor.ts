// src/pages/pusula/data-mentor.ts
// Usta Yolu — mentor↔mentee eşleştirme (GERÇEK roster id'leriyle). Sistem yetkinlik
// boşluğunu + o günkü vardiya çakışmasını okur, gerekçeli eşleşme önerir; koç
// onaylar/düzenler. "Eğitimcinin eğitimi": koç (Baran) da mentee olabilir.
// MATCH-SCORE YÜZDESİ YOK — güven SOFT (emerging/medium/high).

import type { MentorMatch } from "./types-gelisim";

/** Başlangıç önerileri (Bugün). */
export const MENTOR_MATCHES: MentorMatch[] = [
  {
    id: "mm1",
    mentorId: "Fatma",
    menteeId: "Asya",
    focus: "Tepe-saat kabin akışı",
    reason: "Fatma kabinde usta (★★★★); Asya çok yeni, kabin temellerini onunla öğreniyor. Bugün ikisi de akşam vardiyasında.",
    shift: "Akşam · 15–22",
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm2",
    mentorId: "Şeyma",
    menteeId: "Kaan",
    focus: "Tepe-saat dayanıklılığı",
    reason: "Şeyma her alanda güçlü; Kaan kabinde iyi ama yoğunlukta ritmi korumayı geliştiriyor. Vardiyaları çakışıyor.",
    shift: "Öğle · 12–21",
    confidence: "medium",
    aiSuggested: true,
  },
];

/** "Yeniden optimize" sonrası (model dünkü sahadan öğrenir) — eğitimcinin eğitimi dahil. */
export const MENTOR_MATCHES_OPTIMIZED: MentorMatch[] = [
  {
    id: "mm3",
    mentorId: "Fatma",
    menteeId: "Gamze",
    focus: "Kabin temelleri & güven",
    reason: "Model dünkü yoğun vardiyada Gamze'nin kabinde zorlandığını gördü. Fatma mağazanın en iyilerinden; vardiya eşleşmesi uygun.",
    shift: "Akşam · 15–22",
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm4",
    mentorId: "Baran",
    menteeId: "Fatma",
    focus: "Usta aktarımı metodolojisi",
    reason: "Fatma usta aktarımına hazır; Baran koçluk yöntemini sadeleştirerek aktarıyor. Eğitimcinin de eğitimi — koç gelişir.",
    shift: "Sabah · 09–18",
    confidence: "medium",
    aiSuggested: true,
  },
];
