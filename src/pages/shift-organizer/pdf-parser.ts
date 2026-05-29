/**
 * PDF / metin'den vardiya çıkarma — API'siz, tamamen client-side.
 *
 * Strateji:
 *   1. PDF.js ile metin satırlarını çıkar (y-koordinat gruplama)
 *   2. Her satırı sırayla bir dizi regex'le dene
 *   3. Hiçbiri tutmazsa "saat çifti + uzun isim" fallback'i
 *   4. Sonuç: ParsedShift[] + matched/skipped raporu
 *
 * Desteklenen formatlar:
 *   - "Ahmet Baran 10:00-19:00"
 *   - "Ahmet Baran 10:00 - 19:00"
 *   - "Ahmet Baran 10-19"
 *   - "Ahmet Baran 10 19"
 *   - "10:00-19:00 Ahmet Baran"
 *   - "Pazartesi  Ahmet  10:00  19:00"  (tab/multi-space)
 *   - Türkçe karakterler (ı, ö, ü, ç, ş, ğ, İ, Ö, Ü, Ç, Ş, Ğ)
 */
// pdfjs lazy yüklenir — text parser Node'da test edilebilsin diye.
let _pdfjsLib: typeof import("pdfjs-dist") | null = null;
async function loadPdfjs() {
  if (_pdfjsLib) return _pdfjsLib;
  const pdfjsLib = await import("pdfjs-dist");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — Vite ?url import
  const pdfWorker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  _pdfjsLib = pdfjsLib;
  return pdfjsLib;
}

/**
 * Operasyonel task tipleri:
 *   - HR/TR/ISG (BLOCKING): kişi o saatte chart'a atanamaz (aktif iş gücünden düşer)
 *   - PEMBE (yumuşak): RUNNER LIDER, AKSIYON, IPOD vb. — solver kısıtlamaz, sadece bilgi
 */
export type BlockingTaskType = "HR" | "TR" | "ISG" | "OTHER";

export type SoftTask = { hour: number | null; label: string };

export type ParsedShift = {
  name: string;
  startHour: number;
  endHour: number;
  /** Mola aralıkları (tam saat veya yarım). 11:00-12:00 → [[11, 12]] */
  breaks: Array<[number, number]>;
  /** Blocking task'lar (HR/TR/ISG). Bu saatlerde kişi chart'ta yer almaz. */
  tasks: Array<{ hour: number; type: BlockingTaskType; label: string }>;
  /** Pembe (soft) görevler — RUNNER LIDER, AKSIYON, IPOD vb. Solver kısıtlamaz. */
  soft_tasks: SoftTask[];
  source: string; // hangi satırdan çıkarıldı (debug için)
};

export type ParseReport = {
  shifts: ParsedShift[];
  totalLines: number;
  matchedLines: number;
  skippedSamples: string[]; // ilk 5 atlanmış satır (debug için)
  warnings?: string[]; // boş shift, eksik veri vb. uyarılar (UI'da göster)
};

// ─── Yardımcılar ───

function parseHour(s: string): number | null {
  // "10:00", "10.00", "10", "1000" → 10  (13:30 → 13.5)
  const m = s.trim().match(/^(\d{1,2})(?:[:.,](\d{1,2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (!Number.isFinite(h) || h < 0 || h > 24) return null;
  if (!Number.isFinite(min) || min < 0 || min > 59) return null;
  return h + min / 60;
}

function cleanName(s: string): string {
  return s
    .trim()
    .replace(/[\s\t]+/g, " ")
    .replace(/[.,:;]+$/g, "")
    .replace(/^(pzt|sal|car|per|cum|cts|paz|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+/i, "");
}

// Orquest PDF'inde sıkça karşılaşılan, isim OLMAYAN satır başlangıçları.
// İçinde geçerse satır elenir (case-insensitive substring).
const REJECT_TOKENS = [
  "TARIH", "TARİH", "TOPLAM", "TOPLAM:", "MAGAZA", "MAĞAZA", "SECTION", "TURN",
  "TOTAL", "BREAK", "ZARA", "BASIC", "WOMAN", "WOMEN", "MAN", "MEN", "KIDS",
  "KID", "TRF", "BABY", "ACCESSORIES", "ACCESORIES", "SHOES", "BEAUTY",
  "DISTRIBUCION", "DISTRIBUCIÓN", "PERSONEL", "ÇALIŞAN", "SHIFT", "VARDIYA",
  "PAUSA", "DESCANSO", "EMPLEADO", "REPORT",
];

function isLikelyName(s: string): boolean {
  // En az 2 karakter, ilk harf alfabetik (Türkçe dahil), 40 karakterden kısa
  const cleaned = cleanName(s);
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  // İlk karakter harf olmalı
  if (!/^[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(cleaned)) return false;
  // Sadece rakamdan veya noktalamadan ibaret olamaz
  if (/^[\d\s\-.,:;]+$/.test(cleaned)) return false;
  // Reject token içeriyorsa (başlık/footer/section) elenir
  const upper = cleaned.toUpperCase();
  if (REJECT_TOKENS.some((t) => upper.includes(t))) return false;
  // 1-4 kelime arası olmalı (gerçek isimler)
  const words = cleaned.split(/\s+/);
  if (words.length < 1 || words.length > 4) return false;
  // Her kelime ya capitalized ya all-caps olmalı (de/da/von gibi küçük edatlar hariç)
  const SMALL_WORDS = new Set(["de", "da", "von", "van", "el", "al"]);
  const looksLikeName = words.every((w) => {
    if (SMALL_WORDS.has(w.toLowerCase())) return true;
    return /^[A-ZÇĞİÖŞÜ][a-zçğıöşü.-]*$/.test(w) || /^[A-ZÇĞİÖŞÜ]+$/.test(w);
  });
  if (!looksLikeName) return false;
  return true;
}

// ─── Mola birleştirme (çakışan/adjacent aralıkları union et) ───
function mergeBreaks(breaks: Array<[number, number]>): Array<[number, number]> {
  if (breaks.length < 2) return breaks;
  const sorted = [...breaks].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1];
    if (last && s < last[1] - 0.01) {
      // Çakışıyor → union
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

// ─── Mola ve task çıkartma (parse edilmiş satır üzerinden) ───
//
// Orquest PDF formatları çok çeşitli; aynı satırda mola gösterimi:
//   "Ada 10:00-19:00 b 13:00"          (B + saat)
//   "Ada 10:00-19:00 13:00 b"           (saat + B)
//   "Ada 10:00-19:00 B 13:00-14:00"     (B + aralık)
//   "Ada 10:00-19:00 13:00-14:00 B"     (aralık + B)
//   "Ada 10:00-19:00 B13"               (bitişik)
//   "Ada 10:00-19:00 13B"               (bitişik, ters)
//   "Ada 10:00-19:00 MOLA 13:00"        (Türkçe keyword)
//   "Ada 10:00-19:00 13:00 MOLA"        (Türkçe keyword, ters)
//
// HR/TR/ISG task notasyonu:
//   "HR 18", "HR 18:00", "TR 15:00-16:00", "ISG 17", "18 HR", "18:00 HR"
function extractBreaksAndTasks(
  rawLine: string,
  startHour: number,
  endHour: number,
): { breaks: Array<[number, number]>; tasks: ParsedShift["tasks"]; soft_tasks: SoftTask[] } {
  const breaks: Array<[number, number]> = [];
  const tasks: ParsedShift["tasks"] = [];
  const soft_tasks: SoftTask[] = [];

  const BLOCKING_TASKS = new Set<BlockingTaskType>(["HR", "TR", "ISG"]);

  const inRange = (h: number) =>
    Number.isFinite(h) && h >= startHour && h < endHour;

  const pushBreak = (h1: number, h2?: number) => {
    if (!inRange(h1)) return;
    let e: number;
    if (Number.isFinite(h2) && (h2 as number) > h1) {
      e = Math.min(h2!, endHour);
    } else {
      // Yarım saat başlangıç (13.5) → 0.5 saat mola; tam saat (13) → 1 saat
      e = Math.min(h1 + (h1 % 1 === 0.5 ? 0.5 : 1.0), endHour);
    }
    // dedupe (float karşılaştırma)
    if (!breaks.some(([s]) => Math.abs(s - h1) < 0.01)) breaks.push([h1, e]);
  };

  // Parser 1 — "B"/"MOLA"/"BREAK" keyword + saat (HH veya HH:MM, opsiyonel aralık)
  // Yakaladığı: "b 13", "B13:00", "mola 14", "Mola 14:30-15:00", "Break 15"
  {
    const re = /\b(?:b|bb|mola|break)\s*[:.\s]*(\d{1,2})(?:[:.,](\d{1,2}))?(?:\s*[-–—]\s*(\d{1,2})(?:[:.,](\d{1,2}))?)?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h1 = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
      const h2 = m[3] ? parseInt(m[3], 10) + (m[4] ? parseInt(m[4], 10) / 60 : 0) : NaN;
      pushBreak(h1, h2);
    }
  }

  // Parser 2 — saat + "B"/"MOLA"/"BREAK" (ters sıralama)
  // Yakaladığı: "13 b", "13:00 B", "13:00-14:00 B", "14 Mola", "13B"
  {
    const re = /(\d{1,2})(?:[:.,](\d{1,2}))?(?:\s*[-–—]\s*(\d{1,2})(?:[:.,](\d{1,2}))?)?\s*\b(?:b|bb|mola|break)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h1 = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
      const h2 = m[3] ? parseInt(m[3], 10) + (m[4] ? parseInt(m[4], 10) / 60 : 0) : NaN;
      pushBreak(h1, h2);
    }
  }

  // Parser 3 — bitişik "B13" / "B13:30" / "13B" (no space)
  {
    const re = /(?:^|[\s\t])(?:[Bb])(\d{1,2})(?:[:.,](\d{1,2}))?(?=[\s\t]|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
      pushBreak(h);
    }
  }
  {
    const re = /(?:^|[\s\t])(\d{1,2})(?:[:.,](\d{1,2}))?[Bb](?=[\s\t]|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0);
      pushBreak(h);
    }
  }

  // Blocking Task: "HR 18", "TR 15:00", "ISG 17"
  const taskRe = /\b(HR|TR|ISG)\b\s*[:.\s]*(\d{1,2})(?:[:.,]\d{1,2})?/g;
  let mt: RegExpExecArray | null;
  while ((mt = taskRe.exec(rawLine))) {
    const type = mt[1].toUpperCase() as BlockingTaskType;
    if (!BLOCKING_TASKS.has(type)) continue;
    const hour = parseInt(mt[2], 10);
    if (!Number.isFinite(hour) || hour < startHour || hour >= endHour) continue;
    tasks.push({ hour, type, label: mt[0].trim() });
  }
  // Tersine: "18 HR", "18:00 ISG"
  const taskReRev = /\b(\d{1,2})(?:[:.,]\d{1,2})?\s+(HR|TR|ISG)\b/g;
  while ((mt = taskReRev.exec(rawLine))) {
    const type = mt[2].toUpperCase() as BlockingTaskType;
    if (!BLOCKING_TASKS.has(type)) continue;
    const hour = parseInt(mt[1], 10);
    if (!Number.isFinite(hour) || hour < startHour || hour >= endHour) continue;
    if (!tasks.some((t) => t.hour === hour && t.type === type)) {
      tasks.push({ hour, type, label: mt[0].trim() });
    }
  }

  // Soft (PEMBE) görevler — HR/TR/ISG/BREAK/MOLA dışı büyük harfli token'lar
  // Örn: "RUNNER LIDER", "AKSIYON", "IPOD", "TEMPE", "CX QR", "PEMBE"
  {
    const usedRanges = new Set<number>();
    tasks.forEach((t) => usedRanges.add(t.hour));
    // HR/TR/ISG/B/MOLA/BREAK keyword'lerini hariç tut
    const softRe = /\b([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü.&\/\-]*(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü.&\/\-]+)*)\b/g;
    let sm: RegExpExecArray | null;
    while ((sm = softRe.exec(rawLine))) {
      const label = sm[1].trim();
      // HR/TR/ISG/BREAK/MOLA/B ile başlayanları at
      const upper = label.toUpperCase();
      if (/^(HR|TR|ISG|BREAK|MOLA|B\b|BR\b)/.test(upper)) continue;
      // Saat araması: token'dan önceki son sayı (örn. "15 AKSİYON")
      const before = rawLine.slice(0, sm.index);
      const hourMatch = before.match(/(\d{1,2})(?:[:.,]\d{1,2})?\s*$/);
      const hour = hourMatch ? parseHour(hourMatch[1]) : null;
      soft_tasks.push({ hour, label });
    }
  }

  return { breaks: mergeBreaks(breaks), tasks, soft_tasks };
}

// ─── Regex pattern'leri (sıra önemli — en spesifik önce) ───

const PATTERNS: Array<{
  name: string;
  re: RegExp;
  extract: (m: RegExpMatchArray) => { name: string; startHour: number; endHour: number } | null;
}> = [
  {
    // "Name HH:MM-HH:MM ..." — satır başında isim + ilk saat aralığı. Sonrasında
    // break saati veya total saat olabilir, yoksayılır.
    name: "name + HH:MM-HH:MM (anchored start)",
    re: /^([A-Za-zÇĞİÖŞÜçğıöşü.][\wÇĞİÖŞÜçğıöşü.\s-]{1,40}?)\s+(\d{1,2}[:.,]\d{1,2})\s*[-–—]\s*(\d{1,2}[:.,]\d{1,2})(?:\s|$)/,
    extract: (m) => {
      const sh = parseHour(m[2]);
      const eh = parseHour(m[3]);
      if (sh === null || eh === null || sh >= eh) return null;
      return { name: cleanName(m[1]), startHour: sh, endHour: eh };
    },
  },
  {
    // "Name H-H" (yalnız satır sonu) — daha eski format
    name: "name + H-H (anchored end)",
    re: /^([A-Za-zÇĞİÖŞÜçğıöşü.][\wÇĞİÖŞÜçğıöşü.\s-]{1,60}?)\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*$/,
    extract: (m) => {
      const sh = parseHour(m[2]);
      const eh = parseHour(m[3]);
      if (sh === null || eh === null || sh >= eh) return null;
      return { name: cleanName(m[1]), startHour: sh, endHour: eh };
    },
  },
  {
    // "Name HH HH" (multi-space)
    name: "name + H<space>H",
    re: /^([A-Za-zÇĞİÖŞÜçğıöşü.][\wÇĞİÖŞÜçğıöşü.\s-]{1,60}?)\s+(\d{1,2}[:.,]\d{1,2}|\d{1,2})\s+(\d{1,2}[:.,]\d{1,2}|\d{1,2})\s*$/,
    extract: (m) => {
      const sh = parseHour(m[2]);
      const eh = parseHour(m[3]);
      if (sh === null || eh === null || sh >= eh) return null;
      const n = cleanName(m[1]);
      if (!isLikelyName(n)) return null;
      return { name: n, startHour: sh, endHour: eh };
    },
  },
  {
    // "HH:MM-HH:MM Name" — saat önce
    name: "HH:MM-HH:MM + name",
    re: /^(\d{1,2}[:.,]\d{1,2})\s*[-–—]\s*(\d{1,2}[:.,]\d{1,2})\s+(.+?)\s*$/,
    extract: (m) => {
      const sh = parseHour(m[1]);
      const eh = parseHour(m[2]);
      if (sh === null || eh === null || sh >= eh) return null;
      return { name: cleanName(m[3]), startHour: sh, endHour: eh };
    },
  },
];

/**
 * Bir satırdaki TÜM `HH:MM-HH:MM` aralıklarını sırayla çıkar.
 *
 * Orquest PDF'inde her isim satırının yapısı:
 *   "İsim Soyadı  HH:MM-HH:MM  HH:MM-HH:MM  ...  Nh"
 *                  └─shift─┘    └─break(s)─┘
 *
 * İlk aralık = shift, sonraki aralıklar = mola (1 veya 2 mola olabilir).
 * Aralık `<hours>h` veya satır sonuna kadar taranır.
 *
 * Yarım saat mola: 11:00-11:30 → float aralık (11.0, 11.5).
 */
type HourRange = { start: number; end: number; startFloat: number; endFloat: number };

function extractAllHourRanges(line: string): HourRange[] {
  const ranges: HourRange[] = [];
  // HH:MM-HH:MM, HH-HH, HH:MM-HH, HH-HH:MM (ayraç: - – —)
  const re = /(\d{1,2})(?:[:.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const sh = parseInt(m[1], 10);
    const sm = m[2] ? parseInt(m[2], 10) : 0;
    const eh = parseInt(m[3], 10);
    const em = m[4] ? parseInt(m[4], 10) : 0;
    if (sh < 0 || sh > 24 || eh < 0 || eh > 24) continue;
    if (sm > 59 || em > 59) continue;
    const startF = sh + sm / 60;
    const endF = eh + em / 60;
    if (endF <= startF) continue;
    ranges.push({
      start: sh,
      end: eh,
      startFloat: startF,
      endFloat: endF,
    });
  }
  return ranges;
}

function tryParseLine(rawLine: string): ParsedShift | null {
  // Pre-process: tek satıra, tab/multi-space → tek boşluk, gün adı önekini at
  const line = cleanName(rawLine);
  if (line.length < 4) return null;

  // ── ORQUEST STRUCTURED PATTERN ──
  // Satırda en az 1 HH:MM-HH:MM aralığı + isim önek ara.
  // 2+ aralık varsa: 1.si shift, geri kalan break(s).
  const ranges = extractAllHourRanges(line);
  if (ranges.length >= 1) {
    // İlk aralığın konumu — öncesindeki kısım isim adayı
    const firstRangeText = `${String(ranges[0].start).padStart(2, "0")}:${String(Math.round((ranges[0].startFloat % 1) * 60)).padStart(2, "0")}`;
    const firstIdx = line.search(/\d{1,2}[:.]\d{2}\s*[-–—]/);
    if (firstIdx > 0) {
      const before = line.slice(0, firstIdx).trim();
      const n = cleanName(before);
      if (isLikelyName(n)) {
        const shift = ranges[0];
        // Sonraki aralıklar = breaks (shift aralığının İÇİNDE olanlar)
        const breaks: Array<[number, number]> = [];
        for (let i = 1; i < ranges.length; i++) {
          const r = ranges[i];
          // Mola, shift aralığının içinde olmalı; aksi halde başka satırın aralığı
          if (r.startFloat >= shift.startFloat && r.endFloat <= shift.endFloat) {
            breaks.push([r.startFloat, r.endFloat]);
          }
        }
        // Ek olarak loose extractor (B/MOLA keyword) çıkarsın, dedupe et
        const bt = extractBreaksAndTasks(rawLine, shift.start, shift.end);
        for (const b of bt.breaks) {
          if (!breaks.some(([s]) => Math.abs(s - b[0]) < 0.01)) breaks.push(b);
        }
        // Suppress: firstRangeText sadece debug
        void firstRangeText;
        return {
          name: n,
          // startFloat/endFloat: integer start/end (13:30→13) buçuğu kaybediyordu.
          startHour: shift.startFloat,
          endHour: shift.endFloat,
          breaks: mergeBreaks(breaks),
          tasks: bt.tasks,
          soft_tasks: bt.soft_tasks,
          source: rawLine,
        };
      }
    }
  }

  // ── Eski PATTERN'ler (geriye dönük uyum) ──
  for (const p of PATTERNS) {
    const m = line.match(p.re);
    if (m) {
      const r = p.extract(m);
      if (r && isLikelyName(r.name)) {
        const bt = extractBreaksAndTasks(rawLine, r.startHour, r.endHour);
        return { ...r, breaks: bt.breaks, tasks: bt.tasks, soft_tasks: bt.soft_tasks, source: rawLine };
      }
    }
  }

  // Fallback: 2 saat numarası bul + öncesindeki uzun kelime grubu
  const hoursMatch = line.match(
    /(?<!\d)(\d{1,2}[:.,]?\d{0,2})\s*[-–—\s]+(\d{1,2}[:.,]?\d{0,2})(?!\d)/,
  );
  if (hoursMatch && hoursMatch.index !== undefined) {
    const sh = parseHour(hoursMatch[1]);
    const eh = parseHour(hoursMatch[2]);
    if (sh !== null && eh !== null && sh < eh) {
      const before = line.slice(0, hoursMatch.index).trim();
      const after = line.slice(hoursMatch.index + hoursMatch[0].length).trim();
      const candidate = before.length >= after.length ? before : after;
      const n = cleanName(candidate);
      if (isLikelyName(n)) {
        const bt = extractBreaksAndTasks(rawLine, sh, eh);
        return { name: n, startHour: sh, endHour: eh, breaks: bt.breaks, tasks: bt.tasks, soft_tasks: bt.soft_tasks, source: rawLine };
      }
    }
  }

  return null;
}

// ─── Public API ───

export function parseShiftsFromText(text: string): ParsedShift[] {
  return parseShiftsFromTextWithReport(text).shifts;
}

// Orquest PDF'inde sadece BASIC bölümü ele alınır; diğer bölümler atlanır.
// Section başlığı tespiti: tek kelime, all-caps, ≤12 karakter, sayı/saat içermez.
const SECTION_NAMES = [
  "BASIC", "FR", "PROBADOR", "WOMAN", "WOMEN", "MAN", "MEN", "KIDS", "KID", "CHILD",
  "TRF", "BABY", "ACCESSORIES", "ACCESORIES", "SHOES", "BEAUTY",
];
const KNOWN_SECTIONS = new Set(SECTION_NAMES.map((s) => s.toUpperCase()));

function detectSection(line: string): string | null {
  // Satır section adı içeriyor mu? (multi-column extract bazen "BASIC" ile başka şeyleri birleştirir)
  const cleaned = line.trim().toUpperCase();
  // Tam eşleşme
  if (KNOWN_SECTIONS.has(cleaned)) return cleaned;
  // Satır başında section adı (örn "BASIC Ada Ozasci 07:00...")
  const firstWord = cleaned.split(/\s+/)[0];
  if (firstWord && KNOWN_SECTIONS.has(firstWord)) return firstWord;
  return null;
}

// Güvenlik üst sınırı. 2026-05-30: 30 → 80. FR/PROBADOR de okunduğundan
// BASIC (~20) + FR (~10+) toplamı 30'u aşıp en SONDAKİ kişileri (çoğu zaman
// en yeni personel) kesiyordu ("en yeni personeli okumuyor" bug'ı).
const MAX_MATCHES = 80;

export function parseShiftsFromTextWithReport(text: string): ParseReport {
  const lines = text.split(/[\r\n]+/);
  const seen = new Map<string, ParsedShift>();
  const skipped: string[] = [];
  let matched = 0;
  let inBasic = false;
  let sawAnySection = false;
  let basicBlockEnded = false; // İlk BASIC bloğu bittikten sonra ikinci BASIC görülürse iterasyonu kes.

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trim();
    if (!line || line.length < 4) continue;

    const section = detectSection(line);
    if (section) {
      if (section === "BASIC") {
        if (basicBlockEnded) break; // ikinci BASIC bloğu — iterasyonu durdur
        sawAnySection = true;
        inBasic = true;
      } else if (section === "FR" || section === "PROBADOR") {
        // Kabin (fitting room) personeli — KABİN rolünün adayları, her zaman oku.
        sawAnySection = true;
        inBasic = true;
      } else {
        sawAnySection = true;
        if (inBasic) basicBlockEnded = true; // BASIC bloğundan çıktık
        inBasic = false;
      }
      continue;
    }

    // BASIC dışındaysa atla (header-less PDF fallback'i de ele alıyor)
    if (sawAnySection && !inBasic) continue;

    const p = tryParseLine(line);
    if (p) {
      // Orquest PDF'lerinde mola/task notasyonu bazen aynı satırda değil,
      // KİŞİ SATIRININ ARDINDAKİ 1-2 ALT SATIRDA olur. Bu satırları da tara
      // ve bulunan ek mola/task'ları p'ye merge et.
      const followLines = lines
        .slice(idx + 1, idx + 4)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        // Sonraki bir isimli satıra rastladıysak dur (yeni kişiye geçtik)
        .filter((l) => !tryParseLine(l));
      if (followLines.length > 0) {
        const combined = followLines.join(" ");
        // 1) Loose B/MOLA keyword extractor
        const extra = extractBreaksAndTasksLoose(combined, p.startHour, p.endHour);
        for (const b of extra.breaks) {
          if (!p.breaks.some(([s]) => Math.abs(s - b[0]) < 0.01)) p.breaks.push(b);
        }
        for (const t of extra.tasks) {
          if (!p.tasks.some((x) => x.hour === t.hour && x.type === t.type)) {
            p.tasks.push(t);
          }
        }
        for (const st of extra.soft_tasks) {
          if (!p.soft_tasks.some((x) => x.label === st.label)) {
            p.soft_tasks.push(st);
          }
        }
        // 2) Structured HH:MM-HH:MM aralıkları (multi-line break hücresi)
        //    Fadime/Kıymet gibi 2 molalı kişilerde Orquest PDF break
        //    hücresini iki satıra böler. Bu alt satırlardaki aralıkları da
        //    shift içinde olanlar için break'e ekle.
        for (const range of extractAllHourRanges(combined)) {
          // Shift aralığının içinde olmalı
          if (range.startFloat < p.startHour || range.endFloat > p.endHour) continue;
          // Tüm shift aralığını kapsıyorsa (yani aslında shift'in kendisi
          // başka şekilde yazılmış) atla
          if (
            range.startFloat === p.startHour &&
            range.endFloat === p.endHour
          ) continue;
          if (!p.breaks.some(([s]) => Math.abs(s - range.startFloat) < 0.01)) {
            p.breaks.push([range.startFloat, range.endFloat]);
          }
        }
      }
      // Çakışan molaları birleştir
      p.breaks = mergeBreaks(p.breaks);
      const key = p.name.toLowerCase();
      seen.set(key, p);
      matched++;
      if (seen.size >= MAX_MATCHES) break; // güvenlik üst sınırı
    } else if (line.match(/\d/) && skipped.length < 5) {
      skipped.push(line.slice(0, 80));
    }
  }

  return {
    shifts: Array.from(seen.values()),
    totalLines: lines.filter((l) => l.trim().length >= 4).length,
    matchedLines: matched,
    skippedSamples: skipped,
  };
}

/**
 * `extractBreaksAndTasks`'in sadece mola/task çıkartan, kişi adı geçmeyen
 * "loose" versiyonu — kişi satırının altındaki satırlarda mola/task arama
 * için kullanılır. Saat aralığı [startHour, endHour) ile sınırlı.
 */
function extractBreaksAndTasksLoose(
  rawLine: string,
  startHour: number,
  endHour: number,
): { breaks: Array<[number, number]>; tasks: ParsedShift["tasks"]; soft_tasks: SoftTask[] } {
  return extractBreaksAndTasks(rawLine, startHour, endHour);
}

export async function parseShiftsFromPdf(file: File): Promise<ParsedShift[]> {
  return (await parseShiftsFromPdfWithReport(file)).shifts;
}

/**
 * STRUCTURED PARSER — y-epsilon grouping + x-coord sütun farkındalığı.
 *
 * Sorun (2026-05-22 user raporu): Eski Math.round(transform[5]) y-coord'u
 * tam sayıya yuvarlıyordu → yakın baseline'lar (örn 600.5 ve 599.7 ikisi de
 * 600) aynı satıra düşüyordu → komşu kişinin break'i mevcut satıra karışıyordu
 * (Saliha "10, 10.5" — 10.5 aslında Gamze'nin molası). Ayrıca x-coord
 * körlüğü yüzünden Hours sütunundaki "5h 30min" gibi değerler break
 * sütunundakilerle karışabiliyordu.
 *
 * Yeni yaklaşım:
 *   1. Y-coord float kalır; ardışık item'lar fark <3 ise aynı satır
 *   2. Header satırını bul: "Name | Shift | Break | Hours"
 *   3. Header'dan her sütunun x-aralığını ölç
 *   4. Her satır için item'ları x-aralığına göre sütunlara ayır
 *   5. SADECE break sütununun text'inden HH:MM-HH:MM aralıkları çıkar
 *      → komşu satır/sütun karışması imkansız
 *   6. Multi-line break (Fadime/Kıymet 2 molalı): isimsiz devam satırlarında
 *      sadece break sütununda text varsa son kişinin break'lerine eklenir.
 */
export async function parseShiftsFromPdfWithReport(file: File): Promise<ParseReport> {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  type Item = { y: number; x: number; str: string };

  const shifts: ParsedShift[] = [];
  let inBasic = false;
  let sawBasic = false;

  // Orquest PDF'i çok sayfalı (BASIC/CABALLERO/KASA/MÜDÜR/NIÑO/OPERASYON/WOMAN).
  // Sadece BASIC bölümünü tarayacağız. Tüm sayfaları gez ama BASIC dışındaysa atla.
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items: Item[] = (content.items as Array<{ str: string; transform: number[] }>)
      .map((it) => ({ y: it.transform[5], x: it.transform[4], str: it.str }))
      .filter((it) => it.str.trim().length > 0);

    if (items.length === 0) continue;

    // 1) Y-coord epsilon grouping (fark <5 → aynı satır)
    // 2026-05-23: epsilon 3 → 5. Orquest PDF font rendering baseline farkı
    // 4-5pt olabilir → 3 dar gelince kelime fragment'leri ayrı satıra düşüyor,
    // nameStr boş kalıyor. 5 daha güvenli, ama yine de farklı satırları ayırır.
    items.sort((a, b) => b.y - a.y); // yukarıdan aşağı
    const rows: Item[][] = [];
    let currentRow: Item[] = [];
    let rowY = Number.POSITIVE_INFINITY;
    for (const it of items) {
      if (currentRow.length === 0 || Math.abs(it.y - rowY) < 5) {
        currentRow.push(it);
        if (currentRow.length === 1) rowY = it.y;
      } else {
        rows.push(currentRow);
        currentRow = [it];
        rowY = it.y;
      }
    }
    if (currentRow.length) rows.push(currentRow);

    // 2) Header satırı: "Name", "Shift", "Break", "Hours" başlıklarını içerir.
    //    Sayfa 1'de ilk header'ı bul; sonraki sayfalarda da aynı x-koordinatlar
    //    olduğu için ilk sayfadaki header'ı yeniden kullanmak da mümkün, ama
    //    safety için her sayfada arıyoruz.
    const HEADER_KEYWORDS: Record<string, string[]> = {
      name: ["name", "nombre", "isim", "personel", "empleado", "personnel", "employee"],
      shift: ["shift", "turno", "vardiya", "time", "horario", "schedule"],
      break: ["break", "descanso", "pausa", "mola", "rest", "pause"],
      hours: ["hours", "horas", "saat", "total", "süre", "sure", "duration"],
    };
    const findHeaderCol = (row: Item[], keywords: string[]): Item | undefined =>
      row.find((it) => {
        const s = it.str.trim().toLowerCase().replace(/[:;]+$/g, "");
        return keywords.some((kw) => s === kw || s.includes(kw));
      });
    // Header gate'i GEVŞETİLDİ (2026-05-30): eskiden 4 başlık da (name+shift+
    // break+hours) zorunluydu → FR/PROBADOR gibi basit layout'lu sayfalarda
    // (sadece Name+Shift) header bulunamayıp TÜM sayfa atlanıyordu ("FR
    // okunmuyor"). Artık name+shift yeterli; break/hours opsiyonel.
    const headerRow = rows.find((r) => {
      return (
        findHeaderCol(r, HEADER_KEYWORDS.name) &&
        findHeaderCol(r, HEADER_KEYWORDS.shift)
      );
    });
    if (!headerRow) {
      console.warn(`[PDF Parser] Page ${i}: no header row found, ${rows.length} rows total`);
      continue;
    }
    const headerIdx = rows.indexOf(headerRow);
    console.warn(
      `[PDF Parser] Page ${i}: header row found (rows=${rows.length}, headerRow at index ${headerIdx})`,
    );

    // 3) Sütun atama — VORONOI yaklaşımı
    //
    // KÖKEN BUG (2026-05-23): Eski "cols=[header[i].x-5, header[i+1].x-5)"
    // aralık tabanlı kontrol Orquest PDF'inde başarısız. Çünkü header item'lar
    // SOL-hizalı (örn "Shift" x=200), data değerleri SAĞ-hizalı veya ORTA-hizalı
    // (örn "07:00-13:00" x=130) → data Shift sütununa DEĞİL Name sütununa düştü.
    //
    // Çözüm: Her data item kendi x'ine EN YAKIN header item'ın sütununa
    // düşsün (Voronoi-style). Hizalama farkından bağımsız doğru atama.
    const nameH = findHeaderCol(headerRow, HEADER_KEYWORDS.name)!;
    const shiftH = findHeaderCol(headerRow, HEADER_KEYWORDS.shift)!;
    const breakH = findHeaderCol(headerRow, HEADER_KEYWORDS.break);
    const hoursH = findHeaderCol(headerRow, HEADER_KEYWORDS.hours);
    // break/hours opsiyonel — yoksa o sütun voronoi'ye dahil edilmez (FR gibi
    // basit layout). Sıralı (x'e göre) header listesi + paralel isim listesi.
    const headerCols: Array<{ item: Item; name: "name" | "shift" | "break" | "hours" }> = [
      { item: nameH, name: "name" },
      { item: shiftH, name: "shift" },
    ];
    if (breakH) headerCols.push({ item: breakH, name: "break" });
    if (hoursH) headerCols.push({ item: hoursH, name: "hours" });
    headerCols.sort((a, b) => a.item.x - b.item.x);
    const headerByX = headerCols.map((c) => c.item);
    type ColName = "name" | "shift" | "break" | "hours";
    const whichCol = (itemX: number): ColName => {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < headerCols.length; i++) {
        const d = Math.abs(itemX - headerCols[i].item.x);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return headerCols[bestIdx].name;
    };

    console.warn(
      `[PDF Parser] Page ${i} headerX:`,
      headerByX.map((h) => `${h.str.trim()}@${h.x.toFixed(1)}`).join(", "),
    );

    // 4) Her data satırını sütunlara göre işle
    //
    // KÖKEN BUG (2026-05-23): Orquest PDF'inde BASIC bir ANA kategori;
    // içinde alt-bölümler var (WOMAN, MAN, KIDS gibi mağaza departmanları).
    // Eskiden WOMAN/MAN/KIDS de SECTION_KEYWORDS'te idi → BASIC görüldükten
    // sonra hemen WOMAN görüldüğünde inBasic=false oluyor ve tüm kişi
    // satırları atlandı (0 shift bug).
    //
    // Düzeltme: 2 set —
    //   MAIN_SECTION_KEYWORDS: BASIC'in dışına çıkış sinyali (CABALLERO,
    //   KASA, MUDUR, OPERASYON, NIÑO). Birini görünce inBasic=false.
    //   SUB_SECTION_KEYWORDS: BASIC içindeki alt başlıklar (WOMAN, MAN,
    //   KIDS, ACCESSORIES, ...). Sadece grup ayırıcı; inBasic'i değiştirmez.
    const MAIN_SECTION_KEYWORDS = new Set([
      "BASIC", "CABALLERO", "KASA", "MÜDUR", "MUDUR",
      "OPERASYON", "NIÑO", "NINO", "FR", "PROBADOR",
    ]);
    const SUB_SECTION_KEYWORDS = new Set([
      "WOMAN", "WOMEN", "MAN", "MEN", "KIDS", "KID", "TRF", "BABY",
      "ACCESSORIES", "ACCESORIES", "SHOES", "BEAUTY",
    ]);
    // Kişileri OKUDUĞUMUZ ana bölümler. BASIC = mağaza zemini; FR/PROBADOR =
    // kabin (fitting room) → KABİN rolünün adayları, chart'a dahil edilmeli.
    const READABLE_MAIN_SECTIONS = new Set(["BASIC", "FR", "PROBADOR"]);

    let lastPerson: ParsedShift | null = null;

    for (const row of rows) {
      if (row === headerRow) continue;
      // Section header check
      const rowStr = row.map((it) => it.str.trim()).join(" ").trim().toUpperCase();
      const tokens = rowStr.split(/\s+/).filter(Boolean);
      const firstTok = tokens[0];
      const wordCount = tokens.length;
      // Section header genellikle 1-3 kelime. Eğer row 4+ kelime içeriyorsa,
      // kişi data row'u olabilir (y-epsilon nedeniyle section label data ile
      // birleşmiş olabilir). 4+ kelime varsa section olarak değil data olarak
      // işle — isLikelyName + REJECT_TOKENS zaten yanlış kabul yapmaz.
      if (MAIN_SECTION_KEYWORDS.has(firstTok) && wordCount <= 3) {
        const wasInBasic = inBasic;
        // FR/PROBADOR (kabin/fitting-room) personeli de chart'a girmeli —
        // bunlar tam da KABİN rolünün adayları. Eskiden FR ana-section
        // görülünce inBasic=false oluyor ve FR kişileri atlanıyordu
        // ("FR kısmını okumuyor" bug'ı). BASIC gibi okunabilir kabul et.
        inBasic = READABLE_MAIN_SECTIONS.has(firstTok);
        if (inBasic) {
          sawBasic = true;
          console.warn(`[PDF Parser] MAIN section ${firstTok} entered (readable)`);
        } else if (wasInBasic) {
          console.warn(`[PDF Parser] MAIN section ${firstTok} → exiting readable section`);
        }
        lastPerson = null;
        continue;
      }
      if (SUB_SECTION_KEYWORDS.has(firstTok) && wordCount <= 3) {
        // Alt başlık — sadece grup ayırıcı; inBasic değişmez.
        console.warn(`[PDF Parser] Sub-section ${firstTok} (inBasic=${inBasic})`);
        lastPerson = null;
        continue;
      }
      if (!inBasic && sawBasic) continue;
      if (!inBasic && !sawBasic) {
        // Henüz explicit BASIC section görmedik. Satır kişi satırına
        // benziyorsa otomatik BASIC moduna geç.
        const previewName = row
          .filter((it) => whichCol(it.x) === "name")
          .sort((a, b) => a.x - b.x)
          .map((it) => it.str)
          .join(" ")
          .trim();
        const previewShift = row
          .filter((it) => whichCol(it.x) === "shift")
          .sort((a, b) => a.x - b.x)
          .map((it) => it.str)
          .join(" ")
          .trim();
        if (
          previewName &&
          isLikelyName(previewName) &&
          extractAllHourRanges(previewShift).length > 0
        ) {
          inBasic = true;
          sawBasic = true;
          console.warn("[PDF Parser] Auto-entering BASIC mode (no section header found)");
        } else {
          continue;
        }
      }

      const nameItems = row.filter((it) => whichCol(it.x) === "name");
      const shiftItems = row.filter((it) => whichCol(it.x) === "shift");
      const breakItems = row.filter((it) => whichCol(it.x) === "break");

      const nameStr = nameItems
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ")
        .trim();
      const shiftStr = shiftItems
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ")
        .trim();
      const breakStr = breakItems
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ")
        .trim();

      // Per-row diagnostic: hangi satırın hangi sütun değerleriyle düştüğünü göster.
      // console.warn ile çıkar → Chrome DevTools default level'da görünür (debug ayrı kanal).
      if (nameStr || shiftStr || breakStr) {
        const likely = nameStr ? isLikelyName(nameStr) : false;
        const ranges = shiftStr ? extractAllHourRanges(shiftStr).length : 0;
        console.warn(
          `[PDF Parser] row name="${nameStr}" shift="${shiftStr}" break="${breakStr}" likelyName=${likely} ranges=${ranges}`,
        );
      }

      // 5) Kişi satırı: name sütununda gerçek isim var
      if (nameStr && isLikelyName(nameStr)) {
        const shiftRanges = extractAllHourRanges(shiftStr);
        if (shiftRanges.length === 0) {
          // shift sütunu "-" veya "Free" → atla, ama "lastPerson"'ı sıfırla
          lastPerson = null;
          continue;
        }
        const shift = shiftRanges[0];
        // SADECE break sütunundan break çıkar — komşu sütun karışması yok.
        // startFloat/endFloat kullan: shift.start/end integer (13:30→13) buçuğu
        // kaybediyordu → "buçukları okumuyor" bug'ı.
        const breaks: Array<[number, number]> = extractAllHourRanges(breakStr)
          .filter((r) => r.startFloat >= shift.startFloat && r.endFloat <= shift.endFloat)
          .map((r) => [r.startFloat, r.endFloat] as [number, number]);

        const newPerson: ParsedShift = {
          name: cleanName(nameStr),
          startHour: shift.startFloat,
          endHour: shift.endFloat,
          breaks: mergeBreaks(breaks),
          tasks: [],
          soft_tasks: [],
          source: `${nameStr} | ${shiftStr} | ${breakStr}`,
        };
        shifts.push(newPerson);
        lastPerson = newPerson;
        if (shifts.length >= MAX_MATCHES) break;
      } else if (lastPerson && breakItems.length > 0 && nameItems.length === 0) {
        // 6) Multi-line break devam satırı: name sütunu boş, sadece break sütunda
        //     yeni HH:MM-HH:MM aralığı var → son kişinin break'lerine ekle
        const extraBreaks = extractAllHourRanges(breakStr)
          .filter((r) =>
            r.startFloat >= lastPerson!.startHour &&
            r.endFloat <= lastPerson!.endHour
          )
          .map((r) => [r.startFloat, r.endFloat] as [number, number]);
        for (const b of extraBreaks) {
          if (!lastPerson.breaks.some(([s]) => Math.abs(s - b[0]) < 0.01)) {
            lastPerson.breaks.push(b);
          }
        }
        lastPerson.breaks = mergeBreaks(lastPerson.breaks);
      }
    }

    if (shifts.length >= MAX_MATCHES) break;
  }

  // Aynı kişi birden çok sayfada görünürse (BASIC tek sayfada olduğundan
  // gerçekte olmaz ama defansif): dedupe.
  const seen = new Map<string, ParsedShift>();
  for (const s of shifts) seen.set(s.name.toLowerCase(), s);
  let resultShifts = Array.from(seen.values());

  // Fallback: yapısal parser 0 shift bulduysa, tüm metni çıkarıp
  // text tabanlı parser'a ver (eski, daha toleranslı parser).
  if (resultShifts.length === 0) {
    console.warn("[PDF Parser] Structured parser found 0 shifts, falling back to text parser");
    try {
      const allLines: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = (content.items as Array<{ str: string; transform: number[] }>)
          .map((it) => ({ y: it.transform[5], x: it.transform[4], str: it.str }))
          .filter((it) => it.str.trim().length > 0);
        items.sort((a, b) => b.y - a.y || a.x - b.x);
        const lines: string[] = [];
        let currentLine = "";
        let lastY = Number.POSITIVE_INFINITY;
        for (const it of items) {
          if (currentLine === "" || Math.abs(it.y - lastY) < 3) {
            currentLine += (currentLine ? " " : "") + it.str;
            lastY = it.y;
          } else {
            lines.push(currentLine.trim());
            currentLine = it.str;
            lastY = it.y;
          }
        }
        if (currentLine) lines.push(currentLine.trim());
        allLines.push(...lines);
      }
      const textReport = parseShiftsFromTextWithReport(allLines.join("\n"));
      resultShifts = textReport.shifts;
      console.warn(`[PDF Parser] Text fallback found ${resultShifts.length} shifts`);
    } catch (e) {
      console.warn("[PDF Parser] Text fallback failed:", e);
    }
  }

  // Diagnostic: her kişinin start/end/breaks'i — DevTools console'da görünür
  for (const p of resultShifts) {
    console.debug(
      `[PDF Parser] ${p.name}: ${p.startHour}-${p.endHour} breaks=${JSON.stringify(p.breaks)} tasks=${JSON.stringify(p.tasks)}`,
    );
  }

  // Blank/eksik shift uyarı: start=end veya start tanımsız
  const warnings: string[] = [];
  const blanks = resultShifts.filter(
    (p) => !Number.isFinite(p.startHour) || p.startHour === p.endHour,
  );
  if (blanks.length > 0) {
    warnings.push(
      `${blanks.length} kişide vardiya başlangıç/bitiş saatleri tespit edilemedi: ${blanks.map((b) => b.name).join(", ")}`,
    );
  }

  return {
    shifts: resultShifts,
    totalLines: resultShifts.length,
    matchedLines: resultShifts.length,
    skippedSamples: [],
    warnings,
  };
}
