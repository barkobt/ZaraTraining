// src/pages/pusula/data-curriculum.ts
// Müfredat öğrenmesi — koçların aksiyon planlarından/notlarından çıkan ORTAK desenler.
// Çok sayıda koç benzer not yazınca, form/plan statik kalmamalı: Pusula plan revizyonu
// önerir (formlar tek başına kusursuz değil, mağaza dinamik). Sayılar temsîlî.

import { pick } from "./i18n";
import type { GuidebookRole } from "./types-gelisim";

// ── KOÇLUK YÖNTEMİ TAKSONOMİSİ — çıkarım motorunun "Yöntem" sözlüğü.
// Mimari rapor §5: gözlem/öneri serbest metin değil, Senaryo+Yöntem çiftine
// etiketlenir; aynı sözlük Dönem Aksiyonu provenance'ında ve Öğrenen Hafıza
// çıkarımında kullanılır (tek kaynak).
export type MethodId = "golge" | "maruz" | "prova" | "es";
const METHOD_LABEL: Record<MethodId, { tr: string; en: string; es: string }> = {
  golge: { tr: "Gölge→Solo", en: "Shadow→Solo", es: "Sombra→Solo" },
  maruz: { tr: "Kontrollü maruziyet", en: "Controlled exposure", es: "Exposición controlada" },
  prova: { tr: "Prova", en: "Rehearsal", es: "Ensayo" },
  es: { tr: "Eş-çalışma", en: "Pair work", es: "Trabajo en pareja" },
};
export const METHOD_IDS: MethodId[] = ["golge", "maruz", "prova", "es"];
export const methodLabel = (m: MethodId): string => pick(METHOD_LABEL[m]);

export interface PlanSignal {
  topic: string;
  signal: string; // koç notlarından gözlenen ortak desen
  suggestion: string; // plan revizyon önerisi
  coaches: number; // kaç koç (kanıt birikimi)
  kind: "ekle" | "taşı" | "pekiştir";
}

/** Satış Danışmanı kitapçığından gelen sinyaller. */
const SALES_SIGNALS = (): PlanSignal[] => [
  {
    topic: pick({ tr: "Online iade (Drop-off) ekranı", en: "Online-returns (Drop-off) screen", es: "Pantalla de devolución online (Drop-off)" }),
    signal: pick({
      tr: "9 koç notu: 'ekran adımları karışık, yeni kişi takılıyor'.",
      en: "9 coach notes: 'the screen steps are confusing, new people get stuck'.",
      es: "9 notas de coach: 'los pasos de la pantalla confunden, los nuevos se atascan'.",
    }),
    suggestion: pick({
      tr: "Bu konuya kısa bir mikro-eğitim + ekran rehberi ekle (Başlangıç).",
      en: "Add a short micro-training + screen guide to this topic (Beginner).",
      es: "Añade un micro-entrenamiento corto + guía de pantalla a este tema (Inicial).",
    }),
    coaches: 9,
    kind: "ekle",
  },
  {
    topic: pick({ tr: "Money Mapping (disk mantığı)", en: "Money Mapping (disc logic)", es: "Money Mapping (lógica de discos)" }),
    signal: pick({
      tr: "Çoğunlukla 'Geliştirilmeli' işaretleniyor; 7 koç 'çok erken geliyor' dedi.",
      en: "Mostly marked 'to improve'; 7 coaches said 'it comes too early'.",
      es: "Marcado en su mayoría como 'a mejorar'; 7 coaches dijeron 'llega demasiado pronto'.",
    }),
    suggestion: pick({
      tr: "İleri seviyeden Orta'ya çek; ön koşulu 'reyon hakimiyeti' yap.",
      en: "Move it from Advanced to Intermediate; make 'floor mastery' a prerequisite.",
      es: "Muévelo de Avanzado a Intermedio; pon 'dominio de sala' como prerrequisito.",
    }),
    coaches: 7,
    kind: "taşı",
  },
  {
    topic: pick({ tr: "Tepe-saat kabin akışı", en: "Peak-hour fitting-room flow", es: "Flujo de probador en hora pico" }),
    signal: pick({
      tr: "8 koç ortak aksiyon yazdı: 'gölge + sıra-yönetimi yöntemi' işe yarıyor.",
      en: "8 coaches wrote a shared action: the 'shadow + queue-management method' works.",
      es: "8 coaches escribieron una acción común: el 'método de acompañamiento + gestión de cola' funciona.",
    }),
    suggestion: pick({
      tr: "Bu yöntemi standart aksiyon olarak Başlangıç planına işle.",
      en: "Write this method into the Beginner plan as a standard action.",
      es: "Incorpora este método al plan Inicial como acción estándar.",
    }),
    coaches: 8,
    kind: "pekiştir",
  },
];

/** Kasa kitapçığından gelen sinyaller. */
const KASA_SIGNALS = (): PlanSignal[] => [
  {
    topic: pick({ tr: "Cüzdansız iade / farklı ödeme yöntemi", en: "Walletless refund / mixed payment", es: "Devolución sin tarjeta / pago mixto" }),
    signal: pick({
      tr: "6 koç notu: 'karma ödemeli iadede adım sırası şaşıyor, kuyruk büyüyor'.",
      en: "6 coach notes: 'step order breaks on mixed-payment refunds, queue grows'.",
      es: "6 notas de coach: 'el orden de pasos falla en devoluciones mixtas, crece la cola'.",
    }),
    suggestion: pick({
      tr: "İade senaryolarına karma-ödeme provası ekle (Orta).",
      en: "Add a mixed-payment rehearsal to refund scenarios (Intermediate).",
      es: "Añade un ensayo de pago mixto a los escenarios de devolución (Intermedio).",
    }),
    coaches: 6,
    kind: "ekle",
  },
  {
    topic: pick({ tr: "Tepe-saat kasa açılışı (2. kasa)", en: "Peak-hour second-till opening", es: "Apertura de segunda caja en hora pico" }),
    signal: pick({
      tr: "5 koç: 'ikinci kasayı açma kararı geç veriliyor' — bekleme şikâyeti artıyor.",
      en: "5 coaches: 'second-till call comes late' — wait complaints rise.",
      es: "5 coaches: 'la segunda caja se abre tarde' — suben las quejas de espera.",
    }),
    suggestion: pick({
      tr: "Kuyruk eşiği kuralını Başlangıç planına standart aksiyon olarak işle.",
      en: "Write the queue-threshold rule into the Beginner plan as a standard action.",
      es: "Incorpora la regla de umbral de cola al plan Inicial como acción estándar.",
    }),
    coaches: 5,
    kind: "pekiştir",
  },
  {
    topic: pick({ tr: "SINT / online sipariş teslimi", en: "SINT / online order pickup", es: "SINT / recogida de pedido online" }),
    signal: pick({
      tr: "Çoğunlukla 'Teorik' kalıyor; 6 koç 'gerçek teslim provası gerek' dedi.",
      en: "Mostly stuck at 'Theory'; 6 coaches asked for a real handover rehearsal.",
      es: "Se queda en 'Teórico'; 6 coaches pidieron un ensayo real de entrega.",
    }),
    suggestion: pick({
      tr: "İleri'den Orta'ya çek; teslim provasını zorunlu adım yap.",
      en: "Move from Advanced to Intermediate; make the handover rehearsal mandatory.",
      es: "Mueve de Avanzado a Intermedio; haz obligatorio el ensayo de entrega.",
    }),
    coaches: 6,
    kind: "taşı",
  },
];

/** Operasyon kitapçığından gelen sinyaller. */
const OPS_SIGNALS = (): PlanSignal[] => [
  {
    topic: pick({ tr: "Sevkiyat açılışı & alarm rotası", en: "Shipment opening & alarm route", es: "Apertura de envío y ruta de alarmas" }),
    signal: pick({
      tr: "7 koç notu: 'sevkiyat sabahı rota karışıyor, yeni kişi koliyle bekliyor'.",
      en: "7 coach notes: 'route gets messy on shipment mornings, new people wait with boxes'.",
      es: "7 notas: 'la ruta se enreda en mañanas de envío, los nuevos esperan con cajas'.",
    }),
    suggestion: pick({
      tr: "Sevkiyat sabahı akış şemasını Başlangıç'a ekle (tek sayfa).",
      en: "Add a one-page shipment-morning flow chart to Beginner.",
      es: "Añade a Inicial un esquema de flujo de mañana de envío (una página).",
    }),
    coaches: 7,
    kind: "ekle",
  },
  {
    topic: pick({ tr: "RFID sayım & stok düzeltme", en: "RFID count & stock correction", es: "Conteo RFID y corrección de stock" }),
    signal: pick({
      tr: "6 koç: 'sayım cihazı pratiği İleri'de çok geç geliyor'.",
      en: "6 coaches: 'count-device practice arrives too late in Advanced'.",
      es: "6 coaches: 'la práctica del lector llega muy tarde en Avanzado'.",
    }),
    suggestion: pick({
      tr: "Cihaz pratiğini Orta'ya çek; ön koşulu 'depo düzeni' yap.",
      en: "Pull device practice to Intermediate; prerequisite: 'stockroom order'.",
      es: "Adelanta la práctica a Intermedio; prerrequisito: 'orden de almacén'.",
    }),
    coaches: 6,
    kind: "taşı",
  },
  {
    topic: pick({ tr: "İade→raf devri (reyon sprinter)", en: "Returns→shelf turnover (floor sprinter)", es: "Devolución→estante (sprinter de sala)" }),
    signal: pick({
      tr: "8 koç ortak aksiyon: 'kabin iadesini 15 dk içinde rafa' kuralı işliyor.",
      en: "8 coaches share an action: the 'fitting-room return to shelf in 15 min' rule works.",
      es: "8 coaches comparten: la regla 'devolución al estante en 15 min' funciona.",
    }),
    suggestion: pick({
      tr: "15 dk devir kuralını standart aksiyon olarak Orta plana işle.",
      en: "Write the 15-min turnover rule into the Intermediate plan as standard.",
      es: "Incorpora la regla de 15 min al plan Intermedio como estándar.",
    }),
    coaches: 8,
    kind: "pekiştir",
  },
];

/** Müfredat sinyalleri — ROL-BAZLI (her kitapçığın kendi desenleri). */
export const planSignals = (role: GuidebookRole = "Satış Danışmanı"): PlanSignal[] =>
  role === "Kasa" ? KASA_SIGNALS() : role === "Operasyon" ? OPS_SIGNALS() : SALES_SIGNALS();
