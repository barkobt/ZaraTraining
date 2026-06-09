// src/pages/pusula/data-gelisim.ts
// Gelişim Defteri verisi — GERÇEK kitapçıklardan zeminlenmiştir
// (docs/Gelişim Formu: Satış Danışmanı · Kasa · Operasyon). Konu adları, ASA'lar,
// seviye yapısı (Başlangıç 1–4h · Orta 5–6h · İleri 7–8h) ve 4 durum (Teorik /
// Yapabiliyor / Geliştirilmeli / Öğretebilir) kitapçığın aslına sadıktır.
// İlk durumlar demo içindir; UI'da işaretlenince değişir. RAKAM yok.

import type {
  GlossaryTerm,
  GuidebookLevel,
  GuidebookRole,
  GuidebookSection,
  GuidebookTopic,
  TopicCategory,
  TopicStatus,
} from "./types-gelisim";

export const GUIDEBOOK_ROLES: GuidebookRole[] = ["Satış Danışmanı", "Kasa", "Operasyon"];
export const GUIDEBOOK_LEVELS: GuidebookLevel[] = ["Başlangıç", "Orta", "İleri"];

export const LEVEL_WEEKS: Record<GuidebookLevel, string> = {
  Başlangıç: "1–4. Hafta",
  Orta: "5–6. Hafta",
  İleri: "7–8. Hafta",
};

/** Rol başına ASA (Ana Sorumluluk Alanları) + form ağırlıkları (rol tanımı, kişi skoru değil). */
export const ROLE_ASA: Record<GuidebookRole, { label: string; weight: string }[]> = {
  "Satış Danışmanı": [
    { label: "Mağaza İçi Operasyonu", weight: "%20–30" },
    { label: "Müşteri Servisi", weight: "%20–30" },
    { label: "Satış", weight: "%15–25" },
    { label: "Kendini Geliştirme", weight: "%10" },
  ],
  Kasa: [
    { label: "Kasa Operasyonu & Kayıp Önleme", weight: "%40" },
    { label: "Müşteri Servisi", weight: "%30" },
    { label: "Süreç & Sistem Bilgisi", weight: "%20" },
    { label: "Kendini Geliştirme", weight: "%10" },
  ],
  Operasyon: [
    { label: "Depo Operasyonu", weight: "%35" },
    { label: "Müşteri Servisi", weight: "%20" },
    { label: "Ürün Bilgisi", weight: "%15" },
    { label: "Kendini Geliştirme", weight: "%10" },
  ],
};

/** 5 davranışsal yetkinlik (tüm rollerde ortak — kitapçıktan). */
export const COMPETENCIES = [
  "Etkili İletişim ve İş Birliği",
  "Motivasyonel Uyum",
  "Ekip Çalışması",
  "Sürdürülebilir Performans",
  "Öğrenme Çevikliği",
];

type Seed = [no: number, category: TopicCategory, title: string, status: TopicStatus];

function section(role: GuidebookRole, level: GuidebookLevel, asa: string[], seeds: Seed[]): GuidebookSection {
  const topics: GuidebookTopic[] = seeds.map(([no, category, title, status]) => ({
    id: `${role[0]}${level[0]}-${no}`,
    no,
    category,
    title,
    status,
  }));
  return { role, level, weeks: LEVEL_WEEKS[level], asa, topics };
}

const SD_ASA = ["Mağaza İçi Operasyonu", "Müşteri Servisi", "Satış", "Kendini Geliştirme"];
const KS_ASA = ["Kasa Operasyonu & Kayıp Önleme", "Müşteri Servisi", "Süreç & Sistem", "Kendini Geliştirme"];
const OP_ASA = ["Depo Operasyonu", "Müşteri Servisi", "Ürün Bilgisi", "Kendini Geliştirme"];

export const GUIDEBOOK: GuidebookSection[] = [
  // ── SATIŞ DANIŞMANI ────────────────────────────────────
  section("Satış Danışmanı", "Başlangıç", SD_ASA, [
    [1, "Müşteri", "Çalışan enerjisi ve pozitif mağaza tutumu", "Öğretebilir"],
    [3, "Müşteri", "Müşteri türleri ve CX (müşteri deneyimi) projesinin önemi", "Yapabiliyor"],
    [7, "Müşteri", "İstek noktası ve istek hakimiyeti", "Yapabiliyor"],
    [9, "Müşteri", "iPod ile ürün gösterme ve satış", "Geliştirilmeli"],
    [13, "Ürün", "Etiket okuma ve ürün içerik bilgisi", "Yapabiliyor"],
    [16, "Süreçler", "Askılama ve askı türleri", "Öğretebilir"],
    [17, "Süreçler", "Chart sistemi ve vardiya: DC1 / DC2 / Hold", "Teorik"],
    [19, "Süreçler", "Sprinter / Runner sistemi (360°)", "Geliştirilmeli"],
  ]),
  section("Satış Danışmanı", "Orta", SD_ASA, [
    [2, "Müşteri", "Omnichannel: Click & Find, Click & Go, Click & Try", "Teorik"],
    [3, "Müşteri", "Alternatif ürün sunma", "Boş"],
    [7, "Ürün", "Fit – kalıp bilgisi", "Geliştirilmeli"],
    [9, "Ürün", "Money Mapping ve disk mantığı (ürün yerleşimi)", "Boş"],
    [12, "Süreçler", "RFID ve soft tag (EAS) — kayıp önleme", "Teorik"],
    [14, "Süreçler", "ITX ve One Store süreç ilişkisi", "Boş"],
  ]),
  section("Satış Danışmanı", "İleri", SD_ASA, [
    [2, "Süreçler", "SINT ve productivity (verimlilik) takibi", "Boş"],
    [4, "Süreçler", "Twin – Market: eş/kardeş mağaza karşılaştırması ile aksiyon", "Boş"],
    [5, "Satış", "GAP / Compran kavramı ve kullanımı", "Boş"],
    [6, "Ürün", "Mağaza imajı ve mobilya (frontal, manken, hizalama)", "Teorik"],
    [10, "Süreçler", "İleri açılış / kapanış: tam bağımsız düzen", "Boş"],
  ]),

  // ── KASA ───────────────────────────────────────────────
  section("Kasa", "Başlangıç", KS_ASA, [
    [2, "Müşteri", "Ödeme sırasında müşteriye yaklaşım ve son onay", "Öğretebilir"],
    [4, "Müşteri", "Online iade (Drop-off) front sürecinde yaklaşım", "Yapabiliyor"],
    [9, "Kasa", "Ödeme tipleri: puan, e-fatura, Tax-Free, Hediye Kartı", "Yapabiliyor"],
    [11, "Kasa", "Kasa alanı: Regular / ACO / Drop-off iade / Online Pickup", "Geliştirilmeli"],
    [13, "Sistem", "Zara QR / e-bilet (e-ticket) kullanımı", "Yapabiliyor"],
    [17, "Süreçler", "Yönetici onayı yetkisi ve iletişim prosedürü", "Teorik"],
  ]),
  section("Kasa", "Orta", KS_ASA, [
    [22, "Süreçler", "Online iade (Drop-off) prosedürü ve ekranı", "Yapabiliyor"],
    [23, "Süreçler", "Online teslimat (pickup): ekran ve müşteri adımları", "Geliştirilmeli"],
    [29, "Kasa", "Parçalı / QR iade, bağlantı koparma ve evrak", "Geliştirilmeli"],
    [31, "Süreçler", "ACO kapanış işlemleri (anlatım ve uygulama)", "Boş"],
  ]),
  section("Kasa", "İleri", KS_ASA, [
    [4, "Sistem", "One Store ile stok ve ürün kullanımı", "Boş"],
    [7, "Süreçler", "Regular kapanış: para sayımı, gün sonu", "Teorik"],
    [8, "Süreçler", "Back-1 – tara – poşet/askı ve Drop-off alanı", "Boş"],
  ]),

  // ── OPERASYON ──────────────────────────────────────────
  section("Operasyon", "Başlangıç", OP_ASA, [
    [5, "Depo", "Ürün açılışı: verimlilik, ürün listesi (chart) ve mantık", "Yapabiliyor"],
    [7, "Depo", "Askı değiştirme prosedürü ve askı tipleri", "Öğretebilir"],
    [8, "Sistem", "iPod ile ürün sorgulama", "Yapabiliyor"],
    [10, "Sistem", "ITX istek: Reject, Found, Delivered, Not Seen, Not Found", "Geliştirilmeli"],
    [13, "Sistem", "ops 25 sekmesi: 25'in anlamı, liste düşüş mantığı", "Geliştirilmeli"],
    [17, "Depo", "Depo açılış prosedürü: indirme, 19 isteği, 25 kontrolü", "Teorik"],
  ]),
  section("Operasyon", "Orta", OP_ASA, [
    [4, "Depo", "Depo düzeni: askılı–katlı yerleşim ve atama (assign)", "Geliştirilmeli"],
    [10, "Depo", "Depo jargonu: Backstock 1, Backstock 2, Guided, Tara", "Boş"],
    [2, "Müşteri", "Seçilen (online) ürün yönetiminin müşteri teslimine etkisi", "Boş"],
  ]),
  section("Operasyon", "İleri", OP_ASA, [
    [3, "Depo", "Materyal ihtiyacı / kapasite (örn. 1 bar = 50 ürün)", "Boş"],
    [4, "Depo", "Backstock'tan commercial basket toplama", "Boş"],
    [7, "Sistem", "Stockroom Locations: Move Content, NOC arama", "Teorik"],
  ]),
];

export function sectionFor(role: GuidebookRole, level: GuidebookLevel): GuidebookSection | undefined {
  return GUIDEBOOK.find((s) => s.role === role && s.level === level);
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: "ASA", type: "Kavram", definition: "Ana Sorumluluk Alanı — bir rolün mağaza içindeki temel görev tanımı ve performans kriterlerinin bütünü." },
  { term: "Shadowing", type: "Pedagoji", definition: "Yeni çalışanın tecrübeli bir takım arkadaşını saha operasyonunda izleyerek süreci doğal akışında öğrenmesi." },
  { term: "Reverse Mentoring", type: "Pedagoji", definition: "Yeni başlayanın; teknoloji/trend adaptasyonu gibi konularda tecrübeli yöneticilere kendi perspektifini aktarması." },
  { term: "One Store", type: "Kavram", definition: "Tüm kanalların (online, depo, kasa, reyon) izole değil entegre işlemesi prensibi." },
  { term: "Active Listening", type: "Pedagoji", definition: "Çalışanı yargılamadan, tamamen sürece odaklanarak dinleme ve beden diliyle geri bildirim verme." },
  { term: "Drop-off", type: "Operasyon", definition: "Müşterinin online sipariş iadesini mağaza kasasına bırakması sürecinin bütünü." },
  { term: "Money Mapping", type: "Satış", definition: "Ürün yerleşim mantığı; disklerle satış potansiyeli yüksek alanların düzenlenmesi." },
  { term: "Twin-Market", type: "Analiz", definition: "Eş/kardeş mağaza karşılaştırması ile aksiyon çıkarma yöntemi." },
  { term: "ops 25", type: "Sistem", definition: "Operasyon uygulamasında liste düşüş ve eksik tamamlama mantığını yöneten sekme." },
];
