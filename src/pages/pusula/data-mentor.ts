// src/pages/pusula/data-mentor.ts
// Usta Yolu — mentor↔mentee eşleştirme. Sistem yetkinlik boşluğunu + o günkü
// vardiya çakışmasını okur, gerekçeli eşleşme önerir; koç onaylar/düzenler.
// "Eğitimcinin eğitimi": koç (Deniz) de mentee olabilir.
// MATCH-SCORE YÜZDESİ YOK — güven SOFT (emerging/medium/high).

import type { MentorMatch } from "./types-gelisim";

/** Başlangıç önerileri (Bugün). */
export const MENTOR_MATCHES: MentorMatch[] = [
  {
    id: "mm1",
    mentorId: "ayse",
    menteeId: "ece",
    focus: "Drop-off iade & müşteri iletişimi",
    reason: "Ayşe karşılama ve kasa iade akışında usta; Ece'nin bu alandaki ilk haftaları onunla örtüşüyor. Bugün ikisi de sabah vardiyasında.",
    shift: "Sabah · 09–18",
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm2",
    mentorId: "selin",
    menteeId: "kerem",
    focus: "Tepe-saat dayanıklılığı",
    reason: "Selin tepe-saat kabininde en sakin el; Kerem'in dayanıklılığı kontrollü maruziyetle gelişiyor. Öğle vardiyasında çakışıyorlar.",
    shift: "Öğle · 12–21",
    confidence: "medium",
    aiSuggested: true,
  },
];

/** "Yeniden optimize" sonrası (model dünkü sahadan öğrenir) — eğitimcinin eğitimi dahil. */
export const MENTOR_MATCHES_OPTIMIZED: MentorMatch[] = [
  {
    id: "mm3",
    mentorId: "ayse",
    menteeId: "ece",
    focus: "Drop-off çıkış & hızlı aksiyon",
    reason: "Model dünkü yoğun vardiyada Ece'nin drop-off bekleme sürelerini uzun buldu. Ayşe bu konuda mağazanın en iyilerinden; vardiya eşleşmesi de uygun.",
    shift: "Sabah · 09–18",
    confidence: "high",
    aiSuggested: true,
  },
  {
    id: "mm4",
    mentorId: "deniz",
    menteeId: "selin",
    focus: "Usta aktarımı metodolojisi",
    reason: "Selin usta aktarımına hazır; Deniz koçluk yöntemini sadeleştirerek aktarıyor. Koçun da gelişimi — eğitimcinin eğitimi.",
    shift: "Öğle · 12–21",
    confidence: "medium",
    aiSuggested: true,
  },
];
