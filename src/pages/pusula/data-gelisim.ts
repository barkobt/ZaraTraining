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
  section("Satış Danışmanı", "Başlangıç", SD_ASA, [
    [1, "Müşteri", "Çalışan enerjisi ve pozitif mağaza tutumu", "Öğretebilir"],
    [2, "Müşteri", "Tutum – Bilgi – Beceri dengesi ve rol beklentileri (oryantasyon)", "Yapabiliyor"],
    [3, "Müşteri", "Müşteri türleri ve CX (müşteri deneyimi) projesinin önemi", "Geliştirilmeli"],
    [4, "Müşteri", "Müşteri deneyiminde rolümüz", "Yapabiliyor"],
    [5, "Müşteri", "Müşteri önceliği ilkesi", "Teorik"],
    [6, "Müşteri", "Müşteri servisi temel yaklaşımı", "Boş"],
    [7, "Müşteri", "İstek noktası ve istek hakimiyeti", "Öğretebilir"],
    [8, "Müşteri", "QR kullanımı ve müşteriyi yönlendirme", "Yapabiliyor"],
    [9, "Müşteri", "iPod ile ürün gösterme ve satış", "Geliştirilmeli"],
    [10, "Müşteri", "Geri bildirim kültürü: geri bildirim verme ve isteme", "Yapabiliyor"],
    [11, "Ürün", "Departmanlar ve buyer'lar", "Teorik"],
    [12, "Ürün", "Commercial gruplar", "Boş"],
    [13, "Ürün", "Etiket okuma ve ürün içerik bilgisi", "Öğretebilir"],
    [14, "Ürün", "Koleksiyonlar ve tipler", "Yapabiliyor"],
    [15, "Ürün", "Zara Glossary (terim sözlüğü)", "Geliştirilmeli"],
    [16, "Süreçler", "Askılama ve askı türleri", "Yapabiliyor"],
    [17, "Süreçler", "Chart sistemi ve vardiya (shift): DC1 / DC2 / Hold", "Teorik"],
    [18, "Süreçler", "Zone hakimiyeti ve devretme", "Boş"],
    [19, "Süreçler", "Sprinter / Runner sistemi (360°)", "Öğretebilir"],
    [20, "Süreçler", "Araç ve mola düzeni", "Yapabiliyor"],
    [21, "Süreçler", "Açılış ve kapanış süreçleri: düzen ve sıralama", "Geliştirilmeli"],
    [22, "Süreçler", "Deadline ve verimlilik (productivity) bilinci", "Yapabiliyor"],
  ]),
  section("Satış Danışmanı", "Orta", SD_ASA, [
    [2, "Müşteri", "Omnichannel / online sayfa: Click & Find, Click & Go, Click & Try", "Teorik"],
    [3, "Müşteri", "Alternatif ürün sunma", "Boş"],
    [4, "Müşteri", "Tadilat hizmeti süreci", "Geliştirilmeli"],
    [5, "Ürün", "Ürün bilgisinin önemi (→ Digital Library)", "Boş"],
    [6, "Ürün", "Kumaş bilgisinin önemi (→ Digital Library)", "Teorik"],
    [7, "Ürün", "Fit – kalıp bilgisi", "Teorik"],
    [8, "Ürün", "ACC – Tempe alanları", "Boş"],
    [9, "Ürün", "Money Mapping ve Money Map diskleri (ürün yerleşim mantığı)", "Geliştirilmeli"],
    [10, "Süreçler", "Prova odaları (Fitting Room): alarming, theft (çalıntı) ve tara nedenleri", "Boş"],
    [11, "Süreçler", "Door Control uygulaması", "Teorik"],
    [12, "Süreçler", "Gun, RFID ve soft tag (EAS) — kayıp önleme", "Teorik"],
    [13, "Süreçler", "Inline süreci", "Boş"],
    [14, "Süreçler", "ITX ve One Store süreç ilişkisi", "Geliştirilmeli"],
    [16, "Süreçler", "Alarm Finder", "Boş"],
  ]),
  section("Satış Danışmanı", "İleri", SD_ASA, [
    [1, "Müşteri", "Müşteri portföyü oluşturma ve artırma", "Boş"],
    [2, "Müşteri", "SINT ve productivity (verimlilik) takibi", "Teorik"],
    [3, "Ürün", "Ranking Top 10 analizi ve kullanımı", "Boş"],
    [4, "Ürün", "Twin – Market: eş/kardeş mağaza karşılaştırması ile aksiyon", "Boş"],
    [5, "Ürün", "GAP / Compran kavramı ve kullanımı", "Boş"],
    [6, "Ürün", "Mağaza imajı ve mobilya bilgisi (frontal, manken, hizalama)", "Teorik"],
    [7, "Süreçler", "One Store hakimiyeti ve uçtan uca süreç", "Boş"],
    [8, "Süreçler", "ACO ve önemi", "Boş"],
    [9, "Süreçler", "iPod ve envantere sahip olmanın önemi", "Boş"],
    [10, "Süreçler", "İleri açılış / kapanış: tam bağımsız düzen ve sıralama", "Teorik"],
  ]),
  section("Kasa", "Başlangıç", KS_ASA, [
    [1, "Müşteri", "Müşteriye yaklaşım ve ilk temas (ACO noktası)", "Öğretebilir"],
    [2, "Müşteri", "Ödeme sırasında müşteriye yaklaşım ve son onay", "Yapabiliyor"],
    [3, "Müşteri", "İade müşterisinin sırasını takip etme ve yönlendirme", "Geliştirilmeli"],
    [4, "Müşteri", "Online iade (Drop-off) front sürecinde müşteriye yaklaşım", "Yapabiliyor"],
    [5, "Müşteri", "Müşteri hizmetlerinin ne zaman ve nasıl aranacağı; numara paylaşımı", "Teorik"],
    [6, "Ürün", "Hediye Kartı satış prosedürü", "Boş"],
    [7, "Ürün", "İşlem sonrası poşet satışı ve poşet–askı alanı kontrolü", "Öğretebilir"],
    [8, "Ürün", "iPod satışı ve ödeme alma", "Yapabiliyor"],
    [9, "Ürün", "Ödeme tipleri: puan kullanımı, e-fatura, Tax-Free ve Hediye Kartı", "Geliştirilmeli"],
    [10, "Süreçler", "Kasa şifresi oluşturma", "Yapabiliyor"],
    [11, "Süreçler", "Kasa alanı tanıtımı (Regular / ACO / Drop-off iade / Online Pickup)", "Teorik"],
    [12, "Süreçler", "ACO'da ödeme alma (nakit, kart, çoklu kart, büyük tutarlı satış)", "Boş"],
    [13, "Süreçler", "Zara QR / e-bilet (e-ticket) önemi ve kullanımı", "Öğretebilir"],
    [14, "Süreçler", "Hediye değişim belgesi basma", "Yapabiliyor"],
    [15, "Süreçler", "Son fişi gösterme ve fatura basma", "Geliştirilmeli"],
    [16, "Süreçler", "Fiyat değişimi işlemi", "Yapabiliyor"],
    [17, "Süreçler", "Yönetici onayı yetkisi ve iletişim prosedürü", "Teorik"],
    [18, "Süreçler", "POS cihazı rulo talebi ve değişimi", "Boş"],
    [19, "Süreçler", "Fiş iptali ve QR iptali", "Öğretebilir"],
    [20, "Süreçler", "Giriş (Door) kontrolü sonrası fiş kontrolü ve prosedürü", "Yapabiliyor"],
    [21, "Süreçler", "ACO kasalarını yeniden başlatma", "Geliştirilmeli"],
    [22, "Süreçler", "Online iade (Drop-off) prosedürü ve ekranı", "Yapabiliyor"],
    [23, "Süreçler", "Online teslimat (pickup): ekran, müşteri adımları ve talep süreci", "Teorik"],
    [25, "Süreçler", "Regular kasa alanı: aktif/pasif barlar, tempo sepeti, terzi barı", "Boş"],
    [26, "Süreçler", "Online iade süreçleri ve temel (basic) işlem alma", "Öğretebilir"],
    [27, "Süreçler", "iPod iade alma işlemi", "Yapabiliyor"],
    [28, "Süreçler", "Fiziksel mağazada temel iade ve değişim (parçalı/QR iade hariç)", "Geliştirilmeli"],
    [29, "Süreçler", "Parçalı/QR iade, ödeme yardımcısı iptali, bağlantı koparma ve evrak", "Yapabiliyor"],
    [30, "Süreçler", "Personel satışı ve iade prosedürü", "Teorik"],
    [31, "Süreçler", "ACO kapanış işlemleri (anlatım ve uygulama)", "Boş"],
  ]),
  section("Kasa", "Orta", KS_ASA, [
    [1, "Müşteri", "İade deneyimini yönetme (Drop-off çıkış ve Back-1 akışında müşteri)", "Teorik"],
    [2, "Müşteri", "Unutulan eşya ve tadilat sürecinde müşteri iletişimi", "Boş"],
    [3, "Ürün", "Para ürünlerinin (money products) takibi ve yönetimi", "Geliştirilmeli"],
    [4, "Süreçler", "Drop-off çıkış işlemleri (anlatım ve birlikte uygulama)", "Boş"],
    [5, "Süreçler", "Back-1 iade alanı takibi ve operasyon sürecini yönetme", "Teorik"],
    [6, "Süreçler", "Ops Tester açma", "Teorik"],
    [8, "Süreçler", "Unutulan eşya prosedürü", "Boş"],
    [9, "Süreçler", "Tadilat formu düzenleme", "Geliştirilmeli"],
  ]),
  section("Kasa", "İleri", KS_ASA, [
    [1, "Müşteri", "Kapanışta müşteri ve kasa akışını yönetme", "Boş"],
    [2, "Müşteri", "Online teslimat alan müşteri deneyimi", "Teorik"],
    [3, "Ürün", "Parfüm satışı takibi", "Boş"],
    [4, "Ürün", "One Store ile stok ve ürün kullanımı", "Boş"],
    [5, "Ürün", "Öncelikli banka kontrolü", "Boş"],
    [6, "Süreçler", "Regular kapanış prosedürü ve organizasyonu (öncelikli kasa, yönetici)", "Teorik"],
    [7, "Süreçler", "Regular kapanış işlemleri: para sayımı, gün sonu, standalone gün", "Boş"],
    [8, "Süreçler", "Process süreçleri: Back-1 – tara – poşet/askı alanı ve Drop-off alanı", "Boş"],
  ]),
  section("Operasyon", "Başlangıç", OP_ASA, [
    [1, "Müşteri", "Müşteri servisi anlayışının operasyona yansıması (önceliğin müşteri)", "Öğretebilir"],
    [3, "Müşteri", "Araca teslimat prosedürü ve reyon ile iletişim", "Yapabiliyor"],
    [4, "Ürün", "Depo tanıtımı: bölümler, askılı–katlı ayrımı, tempo ve parfüm deposu", "Geliştirilmeli"],
    [5, "Ürün", "Ürün açılışı: verimlilik, ürün listesi (chart) ve genel mantık", "Yapabiliyor"],
    [6, "Ürün", "Etiket bağlama prosedürü ve etiket basımı detayları", "Teorik"],
    [7, "Ürün", "Askı değiştirme prosedürü ve askı tipleri", "Boş"],
    [8, "Ürün", "iPod ile ürün sorgulama", "Öğretebilir"],
    [9, "Süreçler", "Depo standartları: location, priority, geçici zone, working area, cihaz", "Yapabiliyor"],
    [10, "Süreçler", "ITX istek sekmesi: Reject, Found, Delivered, Not Seen, Not Found", "Geliştirilmeli"],
    [11, "Süreçler", "Cihaz kullanımı: iPod, BB ve Printer (etiket formatı: tekstil / parfüm)", "Yapabiliyor"],
    [12, "Süreçler", "ops uygulaması: hangi verileri içerir ve nasıl çalışır", "Teorik"],
    [13, "Süreçler", "ops 25 sekmesi: 25'in anlamı, liste düşüş mantığı", "Boş"],
    [14, "Süreçler", "ITX istek takibi: kısmi sorumluluk verme ve geri bildirim", "Öğretebilir"],
    [16, "Süreçler", "Operasyon uygulamaları: 07 ATS, 05 Genel Servis, ITX Deliveries, 19", "Yapabiliyor"],
    [17, "Süreçler", "Depo açılış prosedürü: indirme, 19 isteği, ops reading, 25 kontrolü", "Geliştirilmeli"],
    [18, "Süreçler", "Depo kapanış prosedürü: cihaz sayımı, alan toparlama, materyal/askı", "Yapabiliyor"],
  ]),
  section("Operasyon", "Orta", OP_ASA, [
    [2, "Müşteri", "Seçilen (online) ürün yönetiminin müşteri teslimine etkisi", "Teorik"],
    [3, "Ürün", "Ürün günü: açılış, picking, seçilen ürün yönetimi ve reyona gönderim", "Boş"],
    [4, "Ürün", "Depo düzeni: bölüm bazlı askılı–katlı yerleşim ve atama (assign) süreci", "Geliştirilmeli"],
    [10, "Süreçler", "Depo jargonu: Backstock 1, Backstock 2, Backstock Guided, Tara", "Boş"],
  ]),
  section("Operasyon", "İleri", OP_ASA, [
    [1, "Müşteri", "ITX Deliveries akışının online müşteri teslimine etkisi", "Boş"],
    [2, "Ürün", "Bölüm bazlı ürün filtreleme, albarán kontrolü ve adet hesaplama", "Teorik"],
    [3, "Ürün", "Gelecek ürün adedine göre materyal ihtiyacı (kapasite; örn. 1 bar = 50)", "Boş"],
    [4, "Ürün", "Backstock'tan commercial basket toplama", "Boş"],
    [5, "Ürün", "Askı gönderimi prosedürü", "Boş"],
    [7, "Süreçler", "Stockroom Locations sekmesi: Move Content, NOC arama", "Teorik"],
    [8, "Süreçler", "Back-1 iade çıkış işlemleri", "Boş"],
    [9, "Süreçler", "Materyal talebi ve geri bildirimi: çöp poşeti, etiket, sırt malzemesi", "Boş"],
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
