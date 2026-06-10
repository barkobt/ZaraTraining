// src/pages/pusula/data-curriculum.ts
// Müfredat öğrenmesi — koçların aksiyon planlarından/notlarından çıkan ORTAK desenler.
// Çok sayıda koç benzer not yazınca, form/plan statik kalmamalı: Pusula plan revizyonu
// önerir (formlar tek başına kusursuz değil, mağaza dinamik). Sayılar temsîlî.

export interface PlanSignal {
  topic: string;
  signal: string; // koç notlarından gözlenen ortak desen
  suggestion: string; // plan revizyon önerisi
  coaches: number; // kaç koç (kanıt birikimi)
  kind: "ekle" | "taşı" | "pekiştir";
}

export const PLAN_SIGNALS: PlanSignal[] = [
  {
    topic: "Online iade (Drop-off) ekranı",
    signal: "9 koç notu: 'ekran adımları karışık, yeni kişi takılıyor'.",
    suggestion: "Bu konuya kısa bir mikro-eğitim + ekran rehberi ekle (Başlangıç).",
    coaches: 9,
    kind: "ekle",
  },
  {
    topic: "Money Mapping (disk mantığı)",
    signal: "Çoğunlukla 'Geliştirilmeli' işaretleniyor; 7 koç 'çok erken geliyor' dedi.",
    suggestion: "İleri seviyeden Orta'ya çek; ön koşulu 'reyon hakimiyeti' yap.",
    coaches: 7,
    kind: "taşı",
  },
  {
    topic: "Tepe-saat kabin akışı",
    signal: "8 koç ortak aksiyon yazdı: 'gölge + sıra-yönetimi yöntemi' işe yarıyor.",
    suggestion: "Bu yöntemi standart aksiyon olarak Başlangıç planına işle.",
    coaches: 8,
    kind: "pekiştir",
  },
];
