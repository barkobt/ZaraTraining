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
  /** Soft güven — match-score yüzdesinin yerine. */
  confidence: MentorConfidence;
  aiSuggested: boolean;
}
