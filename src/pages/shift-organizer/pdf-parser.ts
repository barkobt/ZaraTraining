/**
 * PDF / metin'den vardiya çıkarma.
 *
 * Orquest PDF formatı sabit bir spec'e oturmadığı için pragmatik bir yaklaşım:
 * önce metni çıkar, sonra "isim HH:MM-HH:MM" benzeri satırları regex ile yakala.
 * Eğer eşleşme olmazsa kullanıcı manuel düzeltebilir.
 */
import * as pdfjsLib from "pdfjs-dist";
// Vite worker import (worker bundled at build time)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ParsedShift = {
  name: string;
  startHour: number;
  endHour: number;
};

const SHIFT_PATTERNS = [
  // "Baran 10:00-19:00" / "Baran 10:00 - 19:00"
  /^\s*([A-Za-zÇĞİÖŞÜçğıöşü.][\wÇĞİÖŞÜçğıöşü\s.-]{1,40}?)\s+(\d{1,2}):?(\d{2})?\s*[-–—]\s*(\d{1,2}):?(\d{2})?\s*$/,
  // "Baran 10-19" (saat numaraları, dakika yok)
  /^\s*([A-Za-zÇĞİÖŞÜçğıöşü.][\wÇĞİÖŞÜçğıöşü\s.-]{1,40}?)\s+(\d{1,2})\s+(\d{1,2})\s*$/,
  // "Baran 10 19" same as above
];

function tryParseLine(line: string): ParsedShift | null {
  // Pattern 1: HH:MM-HH:MM
  const m1 = line.match(SHIFT_PATTERNS[0]);
  if (m1) {
    const name = m1[1].trim().replace(/[.,]$/, "");
    const sh = parseInt(m1[2], 10);
    const eh = parseInt(m1[4], 10);
    if (Number.isFinite(sh) && Number.isFinite(eh) && sh < eh && eh <= 24) {
      return { name, startHour: sh, endHour: eh };
    }
  }
  // Pattern 2: numeric only
  const m2 = line.match(SHIFT_PATTERNS[1]);
  if (m2) {
    const name = m2[1].trim().replace(/[.,]$/, "");
    const sh = parseInt(m2[2], 10);
    const eh = parseInt(m2[3], 10);
    if (Number.isFinite(sh) && Number.isFinite(eh) && sh < eh && eh <= 24) {
      return { name, startHour: sh, endHour: eh };
    }
  }
  return null;
}

export function parseShiftsFromText(text: string): ParsedShift[] {
  const out: ParsedShift[] = [];
  const lines = text.split(/[\r\n]+/);
  const seen = new Set<string>();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;
    const p = tryParseLine(line);
    if (p && !seen.has(p.name.toLowerCase())) {
      seen.add(p.name.toLowerCase());
      out.push(p);
    }
  }
  return out;
}

export async function parseShiftsFromPdf(file: File): Promise<ParsedShift[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // PDF text items don't have reliable line breaks; group by y-coord.
    const items = (content.items as Array<{ str: string; transform: number[] }>)
      .map((it) => ({ y: Math.round(it.transform[5]), x: it.transform[4], str: it.str }))
      .filter((it) => it.str.trim());
    const byY = new Map<number, typeof items>();
    for (const it of items) {
      const arr = byY.get(it.y) ?? [];
      arr.push(it);
      byY.set(it.y, arr);
    }
    const ys = [...byY.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const row = byY
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join(" ");
      allLines.push(row);
    }
  }

  return parseShiftsFromText(allLines.join("\n"));
}
