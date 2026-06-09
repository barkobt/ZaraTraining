// src/pages/pusula/data.ts
// TÜM VERİ TEMSÎLÎ (mock). Gerçek isim yok. Gerçek verilerle TUTARLI:
//   • Roller: Welcome / Kabin / Kabin Welcomer / Sprinter / Zone 2–5 (solver rolleri)
//   • ASA'lar: Gelişim Takip Kitapçıklarından (Satış/Kasa/Operasyon)
//   • Akşam cebi: 17:00–19:00 (KİLİTLİ) — gerçek 2025 sayıları: 17–18h trafik 743 · %17,0 · 18–19h 652 · %18,9
// Bu dosya dört boşluğu kapatır:
//   #1 Yerleştirme köprüsü  → chartBefore / chartAfter + recommendations
//   #2 ASA → KPI eşlemesi   → asaKpiMap (+ her ASA'da provenBy)
//   #3 Yeni-kişi akışı       → "ece" (3 hafta) + rec "r-ece-growth" (gölge, eş, az kanıt)
//   #4 Cep saati kilitli     → pocket.window = "17:00–19:00" (her yerde aynı)

import {
  Role,
  MasteryLevel,
  SkillStatus,
  type Employee,
  type ChartState,
  type Recommendation,
  type PocketState,
  type HourPoint,
  type TeachingCard,
} from "./types";

// ───────────────────────────────────────────────────────────
// #2 ASA → KPI eşlemesi (hangi ASA'yı hangi KPI "daha gerçek" kılar)
// ───────────────────────────────────────────────────────────
export const asaKpiMap: { asa: string; kpi: string }[] = [
  { asa: "Satış", kpi: "conversion · ATV (üst satış) · UPT (çapraz satış)" },
  { asa: "Müşteri Servisi", kpi: "yaklaşım · tepe-saatte korunmuş conversion (dayanıklılık)" },
  { asa: "Kasa Operasyonu & Kayıp Önleme", kpi: "ticket/saat (hız) · iade servis akışı · add-on (parfüm/poşet)" },
  { asa: "Depo Operasyonu · Ürün Bilgisi", kpi: "25R Correction isabeti · picking/SINT hızı · ITX istek çözümü" },
];

// ───────────────────────────────────────────────────────────
// Ekip (6 kişi) — yeni/yetkin/usta/koç karışık, gerçek ASA'larla
// ───────────────────────────────────────────────────────────
export const employees: Employee[] = [
  {
    id: "selin",
    name: "Selin",
    role: Role.SalesAssistant,
    level: MasteryLevel.Master,
    tenure: "14 ay",
    asaMap: [
      { label: "Müşteri Servisi", weight: 25, status: "strong", provenBy: "tepe-saatte korunmuş conversion" },
      { label: "Satış", weight: 20, status: "strong", provenBy: "ATV · UPT" },
      { label: "Mağaza İçi Operasyonu", weight: 25, status: "neutral" },
      { label: "Kendini Geliştirme", weight: 10, status: "developing" },
    ],
    skills: [
      { topic: "Zor müşteri", status: SkillStatus.CanTeach },
      { topic: "Tepe-saat kabin akışı", status: SkillStatus.CanTeach },
      { topic: "One Store hakimiyeti", status: SkillStatus.NeedImprovement },
      { topic: "Koleksiyon anlatımı", status: SkillStatus.CanDo },
    ],
    kpis: [
      { label: "Yoğunlukta kapatma", value: "güçlü", trend: "up", evidence: "14 vardiyadan" },
      { label: "Çapraz satış", value: "iyi", trend: "neutral" },
    ],
    tendency: [2, 3, 3, 4],
    confidence: "high",
    strongPoint: "Yoğunlukta kapatma — akşam cebinde fark yaratır.",
    growthEdge: "One Store derinliği.",
    canTeach: "Zor müşteri",
  },
  {
    id: "ayse",
    name: "Ayşe",
    role: Role.SalesAssistant,
    level: MasteryLevel.Competent,
    tenure: "8 ay",
    asaMap: [
      { label: "Müşteri Servisi", weight: 25, status: "strong", provenBy: "yaklaşım · karşılama akışı" },
      { label: "Satış", weight: 20, status: "developing" },
      { label: "Mağaza İçi Operasyonu", weight: 25, status: "neutral" },
      { label: "Kendini Geliştirme", weight: 10, status: "neutral" },
    ],
    skills: [
      { topic: "Karşılama ve ilk temas", status: SkillStatus.CanTeach },
      { topic: "Çapraz satış", status: SkillStatus.NeedImprovement },
      { topic: "İstek hakimiyeti", status: SkillStatus.CanDo },
    ],
    kpis: [
      { label: "Sıcak karşılama", value: "güçlü", trend: "up" },
      { label: "Çapraz satış", value: "gelişiyor", trend: "up" },
    ],
    tendency: [2, 2, 3, 3],
    confidence: "medium",
    strongPoint: "Karşılamada akış kurar; Selin ile birlikte daha iyi.",
    growthEdge: "Çapraz satış.",
  },
  {
    id: "mert",
    name: "Mert",
    role: Role.Cashier,
    level: MasteryLevel.Competent,
    tenure: "6 ay",
    asaMap: [
      { label: "Kasa Operasyonu & Kayıp Önleme", weight: 40, status: "strong", provenBy: "ticket/saat · iade akışı" },
      { label: "Müşteri Servisi", weight: 30, status: "developing" },
      { label: "Süreç & Sistem Bilgisi", weight: 20, status: "neutral" },
      { label: "Kendini Geliştirme", weight: 10, status: "neutral" },
    ],
    skills: [
      { topic: "Regular kapanış", status: SkillStatus.CanDo },
      { topic: "Drop-off iade", status: SkillStatus.CanTeach },
      { topic: "One Store ile stok", status: SkillStatus.NeedImprovement },
      { topic: "Parfüm / add-on satışı", status: SkillStatus.NeedImprovement },
    ],
    kpis: [
      { label: "Kasa hızı", value: "yüksek", trend: "up", evidence: "22 vardiyadan" },
      { label: "İade servis akışı", value: "iyi", trend: "neutral" },
    ],
    tendency: [2, 3, 3, 3],
    confidence: "medium",
    strongPoint: "Kasada hız ve akış; yeni kişilere iyi eşlik eder.",
    growthEdge: "One Store ile stok kullanımı.",
  },
  {
    // #3 YENİ-KİŞİ — charta ilk kez "az kanıt, gölge, güçlü eş" diliyle akar
    id: "ece",
    name: "Ece",
    role: Role.Operations,
    level: MasteryLevel.New,
    tenure: "3 hafta",
    asaMap: [
      { label: "Depo Operasyonu", weight: 35, status: "developing" },
      { label: "Ürün Bilgisi", weight: 15, status: "developing" },
      { label: "Müşteri Servisi", weight: 20, status: "neutral" },
      { label: "Kendini Geliştirme", weight: 10, status: "strong" },
    ],
    skills: [
      { topic: "Askı değiştirme", status: SkillStatus.CanDo },
      { topic: "25R Correction", status: SkillStatus.NeedImprovement },
      { topic: "Backstock toplama", status: SkillStatus.NeedImprovement },
      { topic: "Albarán kontrol", status: SkillStatus.Theory },
    ],
    kpis: [
      { label: "25R isabeti", value: "gelişiyor", trend: "up", evidence: "henüz az kanıt" },
    ],
    tendency: [0, 1, 1, 2],
    confidence: "emerging",
    strongPoint: "Öğrenmeye hevesli; temeller oturuyor.",
    growthEdge: "25R Correction — kıdemli eşliğinde.",
  },
  {
    id: "kerem",
    name: "Kerem",
    role: Role.SalesAssistant,
    level: MasteryLevel.Competent,
    tenure: "5 ay",
    asaMap: [
      { label: "Müşteri Servisi", weight: 25, status: "developing" },
      { label: "Satış", weight: 20, status: "neutral" },
      { label: "Mağaza İçi Operasyonu", weight: 25, status: "strong" },
      { label: "Kendini Geliştirme", weight: 10, status: "neutral" },
    ],
    skills: [
      { topic: "Reyon düzeni", status: SkillStatus.CanTeach },
      { topic: "Tepe-saat dayanıklılığı", status: SkillStatus.NeedImprovement },
      { topic: "QR ile yönlendirme", status: SkillStatus.CanDo },
    ],
    kpis: [
      { label: "Sakin saatte conversion", value: "iyi", trend: "neutral" },
      { label: "Tepe-saat dayanıklılığı", value: "gelişiyor", trend: "up" },
    ],
    tendency: [1, 2, 2, 3],
    confidence: "medium",
    strongPoint: "Sakin saatte istikrarlı; düzen kurar.",
    growthEdge: "Tepe-saat dayanıklılığı — kademeli geliştir.",
  },
  {
    // Eğitimcinin eğitimi — koç da gelişen biri
    id: "deniz",
    name: "Deniz",
    role: Role.SalesAssistant,
    level: MasteryLevel.Coach,
    tenure: "3 yıl",
    asaMap: [
      { label: "Müşteri Servisi", weight: 25, status: "strong" },
      { label: "Satış", weight: 20, status: "strong" },
      { label: "Kendini Geliştirme", weight: 10, status: "developing" },
    ],
    skills: [
      { topic: "Koçluk · geri bildirim", status: SkillStatus.CanTeach },
      { topic: "İleri One Store anlatımı", status: SkillStatus.NeedImprovement },
    ],
    kpis: [{ label: "Yetiştirdiği kişide gelişim", value: "güçlü", trend: "up", evidence: "3 vakada +1 seviye" }],
    tendency: [3, 3, 4, 4],
    confidence: "high",
    strongPoint: "Koçluk: '2 gölge seansı' aksiyonu son 3 vakada +1 seviye getirdi.",
    growthEdge: "İleri One Store anlatımı (kendi gelişim kenarı).",
    canTeach: "Koçluk · geri bildirim",
  },
];

// ───────────────────────────────────────────────────────────
// Saatlik örüntü (15:00–21:00) — cep 17:00–19:00 (TEMSÎLÎ, gerçek şekle sadık)
// ───────────────────────────────────────────────────────────
export const hourly: HourPoint[] = [
  { hour: "15:00–16:00", traffic: 520, conv: 45 },
  { hour: "16:00–17:00", traffic: 640, conv: 38 },
  { hour: "17:00–18:00", traffic: 743, conv: 17 }, // cep · gerçek 2025
  { hour: "18:00–19:00", traffic: 652, conv: 19 }, // cep · gerçek 2025
  { hour: "19:00–20:00", traffic: 560, conv: 28 },
  { hour: "20:00–21:00", traffic: 430, conv: 42 },
];

// ───────────────────────────────────────────────────────────
// #1 YERLEŞTİRME KÖPRÜSÜ — kim / nerede / ne zaman (before → after)
// Cep saatleri (17–19) ön cephe rolleri. layoutId morph bu iki durum arasında akar.
// BEFORE (gergin): Selin ön cephede değil (Zone 4'e park); cepte Kerem tek Kabin, Ece (yeni) Welcome'da.
// AFTER (rahat):  Selin → Kabin, Ayşe → Welcome (sinerji); Kerem yan zonda gelişir; Ece sakin saate çekilir.
// ───────────────────────────────────────────────────────────
const HOURS = ["16:00–17:00", "17:00–18:00", "18:00–19:00"] as const;

export const chartBefore: ChartState = [
  { role: "Welcome", hour: "16:00–17:00", persons: ["ayse"] },
  { role: "Kabin", hour: "16:00–17:00", persons: ["kerem"] },
  { role: "Kabin Welcomer", hour: "16:00–17:00", persons: ["mert"] },
  { role: "Zone 2", hour: "16:00–17:00", persons: ["ece"] },
  { role: "Zone 4", hour: "16:00–17:00", persons: ["selin"] },

  { role: "Welcome", hour: "17:00–18:00", persons: ["ece"] }, // yeni kişi en zor cepte — gergin
  { role: "Kabin", hour: "17:00–18:00", persons: ["kerem"] }, // tek, dayanıklılığı gelişiyor
  { role: "Kabin Welcomer", hour: "17:00–18:00", persons: ["mert"] },
  { role: "Zone 2", hour: "17:00–18:00", persons: ["ayse"] },
  { role: "Zone 4", hour: "17:00–18:00", persons: ["selin"] }, // usta ön cepheden uzak (clustered)

  { role: "Welcome", hour: "18:00–19:00", persons: ["ece"] },
  { role: "Kabin", hour: "18:00–19:00", persons: ["kerem"] },
  { role: "Kabin Welcomer", hour: "18:00–19:00", persons: ["mert"] },
  { role: "Zone 2", hour: "18:00–19:00", persons: ["ayse"] },
  { role: "Zone 4", hour: "18:00–19:00", persons: ["selin"] },
];

export const chartAfter: ChartState = [
  { role: "Welcome", hour: "16:00–17:00", persons: ["ayse"] },
  { role: "Kabin", hour: "16:00–17:00", persons: ["selin"] },
  { role: "Kabin Welcomer", hour: "16:00–17:00", persons: ["mert"] },
  { role: "Zone 2", hour: "16:00–17:00", persons: ["kerem"] },
  { role: "Zone 4", hour: "16:00–17:00", persons: ["ece"] }, // yeni kişi arka/sakin zonda

  { role: "Welcome", hour: "17:00–18:00", persons: ["ayse"] }, // Selin ile sinerji
  { role: "Kabin", hour: "17:00–18:00", persons: ["selin"] }, // usta tam cepte
  { role: "Kabin Welcomer", hour: "17:00–18:00", persons: ["mert"] },
  { role: "Zone 2", hour: "17:00–18:00", persons: ["kerem"] }, // yan cephede gelişir
  { role: "Zone 4", hour: "17:00–18:00", persons: ["ece"] },

  { role: "Welcome", hour: "18:00–19:00", persons: ["ayse"] },
  { role: "Kabin", hour: "18:00–19:00", persons: ["selin"] },
  { role: "Kabin Welcomer", hour: "18:00–19:00", persons: ["mert"] },
  { role: "Zone 2", hour: "18:00–19:00", persons: ["kerem"] },
  { role: "Zone 4", hour: "18:00–19:00", persons: ["ece"] },
];

export const chartRoles = ["Welcome", "Kabin", "Kabin Welcomer", "Zone 2", "Zone 4"] as const;
export const chartHours = HOURS;

// ───────────────────────────────────────────────────────────
// Öneriler — morph'u tetikler, KİŞİYİ kredilendirir; kanıt öneride (kişide rakam YOK).
// Kademeli uygula: tek tek inebilir; her biri cebi biraz rahatlatır.
// ───────────────────────────────────────────────────────────
export const recommendations: Recommendation[] = [
  {
    id: "r-selin-strength",
    kind: "strength",
    employeeId: "selin",
    toRole: "Kabin",
    hours: "17:00–19:00",
    thesis: "Yoğunlukta kapatması güçlü — akşam cebini rahatlatır.",
    evidence: "14 benzer vardiyadan öğrenildi.",
  },
  {
    id: "r-ayse-synergy",
    kind: "synergy",
    employeeId: "ayse",
    toRole: "Welcome",
    hours: "17:00–19:00",
    thesis: "Selin ile birlikte karşılama akışı daha iyi — sinerji.",
    evidence: "Birlikte çalıştıkları dönemlerden.",
    buddyId: "selin",
  },
  {
    id: "r-kerem-growth",
    kind: "growth",
    employeeId: "kerem",
    toRole: "Zone 2",
    hours: "17:00–19:00",
    thesis: "Tepe-saat dayanıklılığı gelişsin diye, ön cephenin hemen yanında — kontrollü.",
    evidence: "Gelişim için · kanıt birikiyor.",
  },
  {
    // #3 yeni-kişi: gölge, eş, az kanıt — sakin saate çekilir
    id: "r-ece-growth",
    kind: "growth",
    employeeId: "ece",
    toRole: "Zone 4",
    hours: "14:00–16:00",
    thesis: "Yeni — gölge olarak, Mert eşliğinde; tepe cepte değil.",
    evidence: "3 haftalık · kanıt birikiyor.",
    buddyId: "mert",
  },
];

// ───────────────────────────────────────────────────────────
// #4 Akşam cebi — KİLİTLİ pencere 17:00–19:00
// ───────────────────────────────────────────────────────────
export const pocket: PocketState = {
  window: "17:00–19:00",
  trafficPeak: 743,
  convBefore: [17, 19], // gerçek 2025
  convAfter: [26, 27], // TEMSÎLÎ rahatlama (sert sıçrama değil, yumuşak)
  note: "Tepe trafik · düşük conversion. Dayanıklı/usta kişiler öne alınınca cep yumuşakça rahatlar. (TEMSÎLÎ)",
};

// ───────────────────────────────────────────────────────────
// Usta Aktarımı anı — "Öğretebilir" → çıkar-sonra-onayla
// ───────────────────────────────────────────────────────────
export const teachingCard: TeachingCard = {
  topic: "Zor müşteri",
  masterId: "selin",
  method:
    'Önce "haklısınız" de, sesini düşür, sonra çözümü göster; iade yerine önce değişim öner.',
  evidence: "7 devirde işe yaradı.",
  confirmPrompt: "Yöntemini şöyle anladım — doğru mu?",
};

// Yardımcı
export const byId = (id: string) => employees.find((e) => e.id === id);
