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

export type ParsedShift = {
  name: string;
  startHour: number;
  endHour: number;
  source: string; // hangi satırdan çıkarıldı (debug için)
};

export type ParseReport = {
  shifts: ParsedShift[];
  totalLines: number;
  matchedLines: number;
  skippedSamples: string[]; // ilk 5 atlanmış satır (debug için)
};

// ─── Yardımcılar ───

function parseHour(s: string): number | null {
  // "10:00", "10.00", "10", "1000" → 10
  const m = s.trim().match(/^(\d{1,2})(?:[:.,](\d{1,2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  return Number.isFinite(h) && h >= 0 && h <= 24 ? h : null;
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

function tryParseLine(rawLine: string): ParsedShift | null {
  // Pre-process: tek satıra, tab/multi-space → tek boşluk, gün adı önekini at
  const line = cleanName(rawLine);
  if (line.length < 4) return null;

  for (const p of PATTERNS) {
    const m = line.match(p.re);
    if (m) {
      const r = p.extract(m);
      if (r && isLikelyName(r.name)) {
        return { ...r, source: rawLine };
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
        return { name: n, startHour: sh, endHour: eh, source: rawLine };
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
  "BASIC", "WOMAN", "WOMEN", "MAN", "MEN", "KIDS", "KID", "CHILD",
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

// Güvenlik üst sınırı — BASIC bölümünde gerçek ortalama ≤20 personel.
const MAX_MATCHES = 30;

export function parseShiftsFromTextWithReport(text: string): ParseReport {
  const lines = text.split(/[\r\n]+/);
  const seen = new Map<string, ParsedShift>();
  const skipped: string[] = [];
  let matched = 0;
  let inBasic = false;
  let sawAnySection = false;
  let basicBlockEnded = false; // İlk BASIC bloğu bittikten sonra ikinci BASIC görülürse iterasyonu kes.

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;

    const section = detectSection(line);
    if (section) {
      if (section === "BASIC") {
        if (basicBlockEnded) break; // ikinci BASIC bloğu — iterasyonu durdur
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

export async function parseShiftsFromPdf(file: File): Promise<ParsedShift[]> {
  return (await parseShiftsFromPdfWithReport(file)).shifts;
}

export async function parseShiftsFromPdfWithReport(file: File): Promise<ParseReport> {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allLines: string[] = [];

  // Sadece sayfa 1 — Orquest BASIC raporu ilk sayfaya sığar. Sonraki sayfalar
  // WOMAN/MAN/KIDS bölümleri olur, BASIC parser'ı için gürültü.
  const pagesToScan = Math.min(1, pdf.numPages);
  for (let i = 1; i <= pagesToScan; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // y-koordinatına göre grupla, x'e göre sırala
    const items = (content.items as Array<{ str: string; transform: number[] }>)
      .map((it) => ({ y: Math.round(it.transform[5]), x: it.transform[4], str: it.str }))
      .filter((it) => it.str.trim());
    const byY = new Map<number, typeof items>();
    for (const it of items) {
      const arr = byY.get(it.y) ?? [];
      arr.push(it);
      byY.set(it.y, arr);
    }
    const ys = [...byY.keys()].sort((a, b) => b - a); // yukarıdan aşağı
    for (const y of ys) {
      const row = byY
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ");
      allLines.push(row);
    }
  }

  return parseShiftsFromTextWithReport(allLines.join("\n"));
}
