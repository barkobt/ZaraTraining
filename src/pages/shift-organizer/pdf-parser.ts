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

export type ParsedShift = {
  name: string;
  startHour: number;
  endHour: number;
  /** Mola aralıkları (tam saat veya yarım). 11:00-12:00 → [[11, 12]] */
  breaks: Array<[number, number]>;
  /** Blocking task'lar (HR/TR/ISG). Bu saatlerde kişi chart'ta yer almaz. */
  tasks: Array<{ hour: number; type: BlockingTaskType; label: string }>;
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
  // "10:00"→10, "10.00"→10, "10"→10, "13:30"→13.5, "10.30"→10.5
  const m = s.trim().match(/^(\d{1,2})(?:[:.,](\d{1,2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (!Number.isFinite(h) || h < 0 || h > 24) return null;
  if (min > 59) return null;
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
function parseHourFloat(s: string): number {
  // "13" → 13, "13:30" → 13.5, "14:00" → 14
  const m = s.trim().match(/^(\d{1,2})(?:[:.,](\d{1,2}))?$/);
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  return h + min / 60;
}

function extractBreaksAndTasks(
  rawLine: string,
  startHour: number,
  endHour: number,
): { breaks: Array<[number, number]>; tasks: ParsedShift["tasks"] } {
  const breaks: Array<[number, number]> = [];
  const tasks: ParsedShift["tasks"] = [];

  const BLOCKING_TASKS = new Set<BlockingTaskType>(["HR", "TR", "ISG"]);

  const inRange = (h: number) =>
    Number.isFinite(h) && h >= startHour && h < endHour;

  const pushBreak = (h1: number, h2?: number) => {
    if (!inRange(h1)) return;
    // Yarım saat mola: 13.5 → dur=0.5, Tam saat: 13 → dur=1
    const dur = Number.isFinite(h2) && (h2 as number) > h1
      ? Math.min(h2! - h1, endHour - h1)
      : (h1 % 1 >= 0.4 ? 0.5 : 1);
    const e = h1 + dur;
    // dedupe — aynı başlangıç saati varsa ekleme
    if (!breaks.some(([s]) => Math.abs(s - h1) < 0.01)) breaks.push([h1, e]);
  };

  // Parser 1 — "B"/"MOLA"/"BREAK" keyword + saat (HH veya HH:MM, opsiyonel aralık)
  // Yakaladığı: "b 13", "B13:00", "mola 14", "Mola 14:30-15:00", "Break 15"
  {
    const re = /\b(?:b|bb|mola|break)\s*[:.\s]*(\d{1,2}(?:[:.,]\d{1,2})?)(?:\s*[-–—]\s*(\d{1,2}(?:[:.,]\d{1,2})?))?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h1 = parseHourFloat(m[1]);
      const h2 = m[2] ? parseHourFloat(m[2]) : NaN;
      pushBreak(h1, h2);
    }
  }

  // Parser 2 — saat + "B"/"MOLA"/"BREAK" (ters sıralama)
  // Yakaladığı: "13 b", "13:00 B", "13:00-14:00 B", "14 Mola", "13B"
  {
    const re = /(\d{1,2}(?:[:.,]\d{1,2})?)(?:\s*[-–—]\s*(\d{1,2}(?:[:.,]\d{1,2})?))?\s*\b(?:b|bb|mola|break)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const h1 = parseHourFloat(m[1]);
      const h2 = m[2] ? parseHourFloat(m[2]) : NaN;
      pushBreak(h1, h2);
    }
  }

  // Parser 3 — bitişik "B13" / "B13:30" / "13B" (no space)
  {
    const re = /(?:^|[\s\t])(?:[Bb])(\d{1,2}(?:[:.,]\d{1,2})?)(?=[\s\t]|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) pushBreak(parseHourFloat(m[1]));
  }
  {
    const re = /(?:^|[\s\t])(\d{1,2}(?:[:.,]\d{1,2})?)[Bb](?=[\s\t]|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) pushBreak(parseHourFloat(m[1]));
  }

  // Task: "HR 18", "TR 15:00", "ISG 17"
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

  return { breaks, tasks };
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
  // HH:MM-HH:MM (HH 1-2 digit, MM 2 digit; ayraç: - – —)
  const re = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const sh = parseInt(m[1], 10);
    const sm = parseInt(m[2], 10);
    const eh = parseInt(m[3], 10);
    const em = parseInt(m[4], 10);
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
          startHour: shift.start,
          endHour: shift.end,
          breaks,
          tasks: bt.tasks,
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
        return { ...r, breaks: bt.breaks, tasks: bt.tasks, source: rawLine };
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
        return { name: n, startHour: sh, endHour: eh, breaks: bt.breaks, tasks: bt.tasks, source: rawLine };
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
): { breaks: Array<[number, number]>; tasks: ParsedShift["tasks"] } {
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

    // 1) Y-coord epsilon grouping (fark <3 → aynı satır)
    items.sort((a, b) => b.y - a.y); // yukarıdan aşağı
    const rows: Item[][] = [];
    let currentRow: Item[] = [];
    let rowY = Number.POSITIVE_INFINITY;
    for (const it of items) {
      if (currentRow.length === 0 || Math.abs(it.y - rowY) < 3) {
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
    const headerRow = rows.find((r) => {
      const lower = r.map((it) => it.str.trim().toLowerCase());
      return (
        lower.includes("name") &&
        lower.includes("shift") &&
        lower.includes("break") &&
        lower.includes("hours")
      );
    });
    if (!headerRow) {
      // Bu sayfada tablo header yok → atla
      continue;
    }

    // 3) Sütun x-aralıkları
    const findCol = (label: string) =>
      headerRow.find((it) => it.str.trim().toLowerCase() === label);
    const nameH = findCol("name")!;
    const shiftH = findCol("shift")!;
    const breakH = findCol("break")!;
    const hoursH = findCol("hours")!;
    // Her sütun: [x_start, x_end). Header item'ının x-pozisyonu sütunun sol
    // kenarına yakın; sağ kenarı bir sonraki header'ın x'ine kadar uzanır.
    // Header'lar x sırasına göre yeniden sıralanır.
    const headerByX = [nameH, shiftH, breakH, hoursH].sort((a, b) => a.x - b.x);
    const cols = {
      name: [headerByX[0].x - 5, headerByX[1].x - 5],
      shift: [headerByX[1].x - 5, headerByX[2].x - 5],
      break: [headerByX[2].x - 5, headerByX[3].x - 5],
      hours: [headerByX[3].x - 5, headerByX[3].x + 40],
    };

    const inCol = (it: Item, col: [number, number]) =>
      it.x >= col[0] && it.x < col[1];

    // 4) Her data satırını sütunlara göre işle
    // Bölüm header satırlarını ("BASIC", "CABALLERO", "KASA", "MÜDUR", "NIÑO",
    // "OPERASYON", "WOMAN") tespit edip BASIC içi/dışı durumu takip et.
    const SECTION_KEYWORDS = new Set([
      "BASIC", "CABALLERO", "KASA", "MÜDUR", "MÜDÜR", "NIÑO", "NINO",
      "OPERASYON", "WOMAN", "WOMEN", "MAN", "MEN", "KIDS",
    ]);

    let lastPerson: ParsedShift | null = null;

    for (const row of rows) {
      if (row === headerRow) continue;
      // Section header check
      const rowStr = row.map((it) => it.str.trim()).join(" ").trim().toUpperCase();
      const firstTok = rowStr.split(/\s+/)[0];
      if (SECTION_KEYWORDS.has(firstTok)) {
        if (firstTok === "BASIC") {
          inBasic = true;
          sawBasic = true;
        } else {
          inBasic = false;
        }
        lastPerson = null; // section değişiminde "lastPerson" track'ini sıfırla
        continue;
      }
      if (!inBasic && sawBasic) continue;
      // BASIC görmediğimiz sayfalarda da deneyebiliriz; ama tipik olarak ilk
      // sayfada BASIC header vardır.
      if (!inBasic && !sawBasic) {
        // Henüz BASIC başlamamış (sayfa üstü/header) → atla
        continue;
      }

      const nameItems = row.filter((it) => inCol(it, cols.name as [number, number]));
      const shiftItems = row.filter((it) => inCol(it, cols.shift as [number, number]));
      const breakItems = row.filter((it) => inCol(it, cols.break as [number, number]));

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

      // 5) Kişi satırı: name sütununda gerçek isim var
      if (nameStr && isLikelyName(nameStr)) {
        const shiftRanges = extractAllHourRanges(shiftStr);
        if (shiftRanges.length === 0) {
          // shift sütunu "-" veya "Free" → atla, ama "lastPerson"'ı sıfırla
          lastPerson = null;
          continue;
        }
        const shift = shiftRanges[0];
        // SADECE break sütunundan break çıkar — komşu sütun karışması yok
        const breaks: Array<[number, number]> = extractAllHourRanges(breakStr)
          .filter((r) => r.startFloat >= shift.start && r.endFloat <= shift.end)
          .map((r) => [r.startFloat, r.endFloat] as [number, number]);

        const newPerson: ParsedShift = {
          name: cleanName(nameStr),
          startHour: shift.start,
          endHour: shift.end,
          breaks,
          tasks: [],
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
      }
    }

    if (shifts.length >= MAX_MATCHES) break;
  }

  // Aynı kişi birden çok sayfada görünürse (BASIC tek sayfada olduğundan
  // gerçekte olmaz ama defansif): dedupe.
  const seen = new Map<string, ParsedShift>();
  for (const s of shifts) seen.set(s.name.toLowerCase(), s);

  const finalShifts = Array.from(seen.values());

  // Dev-only debug log — production'da console.debug sessizdir.
  if (typeof console !== "undefined" && console.debug) {
    console.debug(
      "[pdf-parser] Structured parse result:",
      finalShifts.map((s) => ({
        name: s.name,
        shift: `${s.startHour}:00–${s.endHour}:00`,
        breaks: s.breaks.map(([bs, be]) => {
          const fmtH = (f: number) => `${Math.floor(f)}:${String(Math.round((f % 1) * 60)).padStart(2, "0")}`;
          return `${fmtH(bs)}–${fmtH(be)}`;
        }),
        tasks: s.tasks,
        source: s.source,
      })),
    );
  }

  return {
    shifts: finalShifts,
    totalLines: shifts.length,
    matchedLines: shifts.length,
    skippedSamples: [],
  };
}
