// src/pages/pusula/data-curriculum.ts
// Müfredat öğrenmesi — koçların aksiyon planlarından/notlarından çıkan ORTAK desenler.
// Çok sayıda koç benzer not yazınca, form/plan statik kalmamalı: Pusula plan revizyonu
// önerir (formlar tek başına kusursuz değil, mağaza dinamik). Sayılar temsîlî.

import { pick } from "./i18n";

export interface PlanSignal {
  topic: string;
  signal: string; // koç notlarından gözlenen ortak desen
  suggestion: string; // plan revizyon önerisi
  coaches: number; // kaç koç (kanıt birikimi)
  kind: "ekle" | "taşı" | "pekiştir";
}

/** Müfredat sinyalleri — aktif dilde (render-time). */
export const planSignals = (): PlanSignal[] => [
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
