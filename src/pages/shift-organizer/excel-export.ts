import * as XLSX from "xlsx-js-style";
import type { GenerateResult, ShiftInputForChart } from "./ChartResult";

/**
 * chart1.xlsx referans formatı:
 *   A1: "Günlük Chart — {tarih}"
 *   Row 2: saat sütunları (10:00, 11:00, ..., 21:00)
 *   Row 3+: rol satırları (KABİN, KABİN WELCOMER, SPRİNTER, WELCOME, ZONE 2..5)
 *   Sonraki: MOLA, TASK, AKTİF İŞ GÜCÜ
 * Roller uppercase Türkçe (XLSX UTF-8'i destekler — asciify gereksiz).
 */
const ROLE_ORDER = [
  "KABİN",
  "KABİN WELCOMER",
  "SPRINTER",
  "WELCOME",
  "ZONE 2",
  "ZONE 3",
  "ZONE 4",
  "ZONE 5",
];
const ROLE_LABELS: Record<string, string> = {
  KABİN: "KABİN",
  "KABİN WELCOMER": "KABİN WELCOMER",
  SPRINTER: "SPRİNTER",
  WELCOME: "WELCOME",
  "ZONE 2": "ZONE 2",
  "ZONE 3": "ZONE 3",
  "ZONE 4": "ZONE 4",
  "ZONE 5": "ZONE 5",
};

function roleLabel(r: string): string {
  return ROLE_LABELS[r] ?? r;
}

function sortRoles(roles: string[]): string[] {
  return [...roles].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a);
    const bi = ROLE_ORDER.indexOf(b);
    if (ai < 0 && bi < 0) return a.localeCompare(b);
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}

/** chart1 saat formatı: "10:00:00" — PDF ile birebir. */
function fmtHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00:00`;
}
/** "2026-06-17" → "17.06.2026" — PDF ile birebir. */
function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function exportChartToExcel(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
) {
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = sortRoles([...new Set(result.chart.map((c) => c.role))]);

  // (hour|role) → kişiler (dizi). Hücrede kişiler ALT ALTA dizilir (PDF gibi).
  const byKey = new Map<string, string[]>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons);

  // ─── "1/2" işaretleme + MOLA satırı + TASK/AKTİF (PDF ile birebir kural) ───
  const halfSet = new Map<number, Set<string>>();
  const breaksByHour = new Map<number, string[]>();
  const tasksByHour = new Map<number, string[]>();
  const activeByHour = new Map<number, number>();
  {
    const byHour = new Map<number, Set<string>>();
    for (const c of result.chart) {
      const set = byHour.get(c.hour) ?? new Set<string>();
      for (const p of c.persons) set.add(p);
      byHour.set(c.hour, set);
    }
    for (const h of hours) activeByHour.set(h, byHour.get(h)?.size ?? 0);
  }
  if (shifts) {
    const mark = (h: number, name: string) => {
      const set = halfSet.get(h) ?? new Set<string>();
      set.add(name);
      halfSet.set(h, set);
    };
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov > 1e-6 && ov < 1 - 1e-6) mark(h, s.short_name);
        }
      }
      if (s.start_hour % 1 === 0.5) mark(Math.floor(s.start_hour), s.short_name);
      if (s.end_hour % 1 === 0.5) mark(Math.floor(s.end_hour), s.short_name);
    }
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov <= 1e-6) continue;
          const arr = breaksByHour.get(h) ?? [];
          const label = ov >= 1 - 1e-6 ? s.short_name : `${s.short_name} 1/2`;
          if (!arr.includes(label)) arr.push(label);
          breaksByHour.set(h, arr);
        }
      }
      for (const [h, t] of s.tasks ?? []) {
        const arr = tasksByHour.get(h) ?? [];
        arr.push(`${s.short_name} (${t})`);
        tasksByHour.set(h, arr);
      }
    }
  }
  const labelName = (name: string, hour: number): string =>
    halfSet.get(hour)?.has(name) ? `${name} 1/2` : name;

  // ─── PDF chart'ı ile AYNI YÖN: satır = rol (+MOLA), sütun = tarih + saatler ───
  // Hücrede birden çok kişi ALT ALTA (\n + wrapText). Boş hücre tamamen boş.
  const head: string[] = [fmtDate(shiftDate), ...hours.map(fmtHour)];
  const body: string[][] = roles.map((r) => [
    roleLabel(r),
    ...hours.map((h) =>
      (byKey.get(`${h}|${r}`) ?? []).map((p) => labelName(p, h)).join("\n"),
    ),
  ]);
  // MOLA satırı (PDF'te de tablo içinde, en altta)
  body.push(["MOLA", ...hours.map((h) => (breaksByHour.get(h) ?? []).join("\n"))]);

  const nCols = head.length; // 1 (rol) + saat sayısı
  const nRows = body.length + 1; // header + rol satırları + MOLA
  const data: string[][] = [head, ...body];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Genişlik: rol sütunu geniş, saat sütunları eşit. Yükseklik: ferah; isim
  // yığını için wrap. MOLA satırı genelde en kalabalık → en yüksek.
  ws["!cols"] = [{ wch: 16 }, ...hours.map(() => ({ wch: 12 }))];
  // Yükseklikleri satır sırasından TÜRET (data = [header, ...roller, MOLA]) —
  // elle 3-parçalı dizi rol sırası değişirse kayardı.
  ws["!rows"] = data.map((_, i) => ({
    hpt: i === 0 ? 22 : i === data.length - 1 ? 48 : 40,
  }));
  // İlk satır (saat başlıkları) + ilk sütun (rol etiketleri) sabit kalsın.
  ws["!freeze"] = { ySplit: 1, xSplit: 1 };

  // Şampanya-altın — PDF chart'ı ile BİREBİR (PDF CHAMPAGNE [233,216,181]).
  const CHAMPAGNE = "E9D8B5";
  const WARM_LINE = { style: "thin", color: { rgb: "C9C0B2" } } as const; // sıcak gri
  const border = { top: WARM_LINE, bottom: WARM_LINE, left: WARM_LINE, right: WARM_LINE } as const;
  const yellowCell = {
    font: { bold: true, sz: 11, color: { rgb: "1A1614" } },
    fill: { patternType: "solid", fgColor: { rgb: CHAMPAGNE } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border,
  } as const;
  const mkData = (bg: string) =>
    ({
      font: { sz: 10, color: { rgb: "141414" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      border,
    }) as const;
  const dataCell = mkData("FFFFFF");
  const creamCell = mkData("FAF8F3"); // PDF CREAM_ALT ile birebir

  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      // Şampanya: header satırı (r=0) VEYA ilk sütun (rol/tarih etiketi, c=0).
      // Data hücrelerinde dönüşümlü krem ton (PDF alt-satır tonuyla birebir).
      ws[ref].s = r === 0 || c === 0 ? yellowCell : r % 2 === 0 ? creamCell : dataCell;
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Chart");

  // ─── Bilgi sheet — chart dışı veri (PDF'in alt bilgisi + TASK/AKTİF) ───
  const meta: (string | number)[][] = [
    ["Tarih", fmtDate(shiftDate)],
    ["Durum", result.status],
    ["Skor", result.qualityScore ?? "-"],
    ["Süre (s)", result.elapsedSeconds.toFixed(2)],
    ["Chart ID", result.chartId ?? "-"],
    [],
  ];
  if (result.responsibilities && Object.keys(result.responsibilities).length > 0) {
    meta.push(["Günün Sorumluları"]);
    for (const [role, person] of Object.entries(result.responsibilities)) {
      if (person) meta.push([role, person]);
    }
    meta.push([]);
  }
  // TASK (HR/TR/ISG) — chart tablosunda yok; bilgisi burada korunur.
  if (tasksByHour.size > 0) {
    meta.push(["Task (HR/TR/ISG)"]);
    for (const h of hours) {
      const t = tasksByHour.get(h);
      if (t && t.length) meta.push([fmtHour(h), t.join(" · ")]);
    }
    meta.push([]);
  }
  // AKTİF iş gücü — saat başına atanmış distinct kişi.
  meta.push(["Aktif iş gücü (saat başına)"]);
  for (const h of hours) meta.push([fmtHour(h), activeByHour.get(h) ?? 0]);
  meta.push([]);
  meta.push(["Uyarılar"]);
  for (const w of result.warnings) meta.push([w]);

  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  wsMeta["!cols"] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, "Bilgi");

  XLSX.writeFile(wb, `shift-${shiftDate}.xlsx`);
}
