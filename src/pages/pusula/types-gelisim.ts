// src/pages/pusula/types-gelisim.ts
// GELİŞİM bölümü (Defter · Öğrenen Hafıza · Usta Yolu) tip katmanı.
// Kullanıcının types.ts'ine DOKUNULMAZ; bu dosya additive'dir.
// KURAL korunur: sert skor/yüzde YOK — durumlar nitel, güven SOFT.

// ── Gelişim Defteri (dijital takip kitapçığı) ──────────────
export type GuidebookRole = "Satış Danışmanı" | "Kasa" | "Operasyon";
export type GuidebookLevel = "Başlangıç" | "Orta" | "İleri";
export type TopicCategory = "Müşteri" | "Ürün" | "Satış" | "Süreçler" | "Kasa" | "Depo" | "Sistem";

/** Konunun öğrenme durumu (kitapçıktan). "Boş" = henüz işaretlenmedi. */
export type TopicStatus = "Boş" | "Teorik" | "Yapabiliyor" | "Geliştirilmeli" | "Öğretebilir";

export interface GuidebookTopic {
  id: string;
  no: number;
  category: TopicCategory;
  title: string;
  status: TopicStatus;
}

export interface GuidebookSection {
  role: GuidebookRole;
  level: GuidebookLevel;
  weeks: string;
  asa: string[];
  topics: GuidebookTopic[];
}

export interface GlossaryTerm {
  term: string;
  type: string;
  definition: string;
}

// ── Yetkinlik değerlendirmesi (5 davranışsal · 0–5 · 4 dönem) ──
// 0–5'in kendi NİTEL etiketleri var; ekranda sayı değil etiket gösterilir.
export const COMPETENCY_SCALE = [
  "Gözlemlenmedi",
  "Çok Gelişmeli",
  "Gelişmeli",
  "Yapabilir",
  "Güçlü",
  "Çok Güçlü",
] as const;

export interface CompetencyRow {
  name: string;
  priority: boolean; // "Eğitim Önceliği"
  periods: number[]; // 4 dönem (Hafta 2/4/6/8), her biri 0–5
}

// ── Dönem aksiyon planı (Hafta 2/4/6/8) ──
// PROVENANCE: önerinin türetim zinciri — neyi nereden çıkardığı görünür olsun
// (sinyal → kanıt kanalı → çıkarım adımı → güven). Mimari rapor: öneri =
// kanıt + yöntem + beklenen etki + onay hakkı.
export interface ActionProvenance {
  scenario: string; // Senaryo etiketi (hangi yetkinlik alanı)
  method: string; // Yöntem etiketi (Gölge→Solo, Kontrollü maruziyet…)
  signal: string; // ① tetikleyen sinyal ("Kabin filizlenen, 2 dönem durağan")
  channel: string; // ② kanıt kanalı (sayaç / vardiya-kesişim / kitapçık+koç)
  inference: string; // ③ çıkarım adımı ("benzer profilde n≈14 vardiyada işe yaradı")
  confidence: "emerging" | "medium" | "high"; // ⑤ güven bandı (SOFT, sayı değil)
  confidenceWhy: string; // güvenin gerekçesi ("3 kanaldan 1'i besliyor")
  expected: string; // ⑥ beklenen etki + ufuk (temsilî)
}
export interface PeriodAction {
  week: string;
  priorities: string[];
  goal: string;
  action: string;
  prov: ActionProvenance;
}

// ── Dönem / final raporu ──
export interface FinalReport {
  strengths: string[];
  growth: string[];
  result: string;
}

// ── Dinamik alan sinyali (alanın GERÇEK çıktısından güncellenir) ──
// "none" = o alanda bulunmamış → veri yok → YARGI DEĞİL, keşif önerilir.
export interface AreaSignal {
  area: string; // "Tepe-saat kapatma"
  source: string; // "Kabin → kasada satın alınan ürün"
  level: "strong" | "developing" | "neutral" | "none";
  evidence: string; // "n≈14" | "veri yok"
}

// ── Öğrenen Hafıza (koçluk gözlem arşivi) ──────────────────
export type NoteKind = "Gözlem" | "Koçluk" | "Değerlendirme";

export interface ArchiveNote {
  id: string;
  employeeId: string;
  date: string; // ISO (yyyy-mm-dd)
  kind: NoteKind;
  topic: string;
  note: string;
  author: string;
  signed: boolean;
  /** Nitel gidişat — sentiment yüzdesinin yerine. */
  tone: "developing" | "steady" | "strong";
}

// ── Usta Yolu (mentor eşleştirme) ──────────────────────────
export type MentorConfidence = "emerging" | "medium" | "high";

export interface MentorMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  focus: string;
  reason: string;
  shift: string;
  /** Müsait (slack) saat — önceki günden trafikten bilinir, eğitim fırsatı. */
  slot: string;
  /** Soft güven — match-score yüzdesinin yerine. */
  confidence: MentorConfidence;
  aiSuggested: boolean;
}
