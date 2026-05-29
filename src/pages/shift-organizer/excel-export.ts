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

export function exportChartToExcel(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
) {
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = sortRoles([...new Set(result.chart.map((c) => c.role))]);

  const byKey = new Map<string, string>();
  for (const c of result.chart) {
    const labeled = c.persons.map((name) => {
      const shift = shifts?.find((s) => s.short_name === name);
      if (shift) {
        for (const [bs, be] of shift.breaks ?? []) {
          const dur = be - bs;
          if (dur <= 0.5 + 1e-6 && Math.floor(bs) === c.hour) {
            return `${name} 1/2`;
          }
        }
        // Yarım saat giriş/çıkış: sınır slotu yarım → "1/2" (ChartResult ile aynı).
        if (shift.start_hour % 1 === 0.5 && Math.floor(shift.start_hour) === c.hour) return `${name} 1/2`;
        if (shift.end_hour % 1 === 0.5 && Math.floor(shift.end_hour) === c.hour) return `${name} 1/2`;
      }
      return name;
    });
    byKey.set(`${c.hour}|${c.role}`, labeled.join(" · "));
  }

  // Saat → Mola / Task / Aktif iş gücü hesaplaması
  const breaksByHour = new Map<number, string[]>();
  const tasksByHour = new Map<number, string[]>();
  // Aktif iş gücü = o saatte bir role ATANMIŞ distinct kişi (chart ile birebir).
  // Ekrandaki ChartResult ile aynı semantik (eski "sahada bulunan" sayımı kapasite
  // aşımında grid'den fazla görünüyordu).
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
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        const isHalf = be - bs <= 0.5 + 1e-6;
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const arr = breaksByHour.get(h) ?? [];
          const label = isHalf ? `${s.short_name} 1/2` : s.short_name;
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
  const hasBreaks = breaksByHour.size > 0;
  const hasTasks = tasksByHour.size > 0;
  const hasActive = activeByHour.size > 0;

  // DİKEY pivot (2026-05-30): satırlar = SAATLER (yukarıdan aşağı), sütunlar =
  // roller + ek kolonlar. Eskiden yataydı (saatler sütun) → Numbers'da geniş/
  // yatay görünüyordu. PDF gibi portrait/dikey okunsun diye transpoze edildi.
  const extraCols: { label: string; bg: string; kind: "break" | "task" | "active" }[] = [];
  if (hasBreaks) extraCols.push({ label: "MOLA", bg: "FFE0B2", kind: "break" });
  if (hasTasks) extraCols.push({ label: "TASK (HR/TR/ISG)", bg: "F8BBD0", kind: "task" });
  if (hasActive) extraCols.push({ label: "AKTİF", bg: "C8E6C9", kind: "active" });

  const header = ["Saat", ...roles.map(roleLabel), ...extraCols.map((c) => c.label)];
  const nCols = header.length;
  const roleColCount = roles.length;

  const hourRows: (string | number)[][] = hours.map((h) => [
    `${String(h).padStart(2, "0")}:00`,
    ...roles.map((r) => byKey.get(`${h}|${r}`) ?? "—"),
    ...extraCols.map((c) =>
      c.kind === "break"
        ? (breaksByHour.get(h) ?? []).join(" · ") || "—"
        : c.kind === "task"
          ? (tasksByHour.get(h) ?? []).join(" · ") || "—"
          : (activeByHour.get(h) ?? 0),
    ),
  ]);

  // A1'de başlık, blank row, header satırı, sonra her saat bir satır.
  const titleRow: (string | number)[] = [`Günlük Chart — ${shiftDate}`];
  for (let i = 1; i < nCols; i++) titleRow.push("");
  const data: (string | number)[][] = [titleRow, [], header, ...hourRows];

  // Meta sheet
  const meta: (string | number)[][] = [
    ["Tarih", shiftDate],
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

  meta.push(["Uyarılar"]);
  for (const w of result.warnings) meta.push([w]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Dikey layout: col0 = Saat (dar), rol sütunları orta, ek sütunlar (MOLA/TASK/
  // AKTİF) biraz geniş. Saat sütunu sabit kısa, geri kalan içerik wrap'lenir.
  ws["!cols"] = [
    { wch: 8 },
    ...roles.map(() => ({ wch: 18 })),
    ...extraCols.map((c) => ({ wch: c.kind === "active" ? 9 : 22 })),
  ];

  // chart1 görsel paritesi: sarı header, başlık merge'li büyük, saat satırları
  // beyaz/gri striped, ek sütunlar renkli (MOLA turuncu/TASK pembe/AKTİF yeşil).
  // Freeze: ilk 3 satır (başlık+blank+header) + ilk sütun (Saat) sabit kalır.
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: nCols - 1 } }];
  ws["!freeze"] = { ySplit: 3, xSplit: 1 };

  const border = {
    top: { style: "thin", color: { rgb: "DDDDDD" } },
    bottom: { style: "thin", color: { rgb: "DDDDDD" } },
    left: { style: "thin", color: { rgb: "DDDDDD" } },
    right: { style: "thin", color: { rgb: "DDDDDD" } },
  } as const;

  // A1 başlık
  const a1 = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[a1]) {
    ws[a1].s = {
      font: { bold: true, sz: 16, color: { rgb: "1A1A1A" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "FAFAF7" } },
    };
  }

  // Row 3 (r=2): header (sarı bg + bold)
  for (let c = 0; c < nCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 2, c });
    if (!ws[ref]) ws[ref] = { t: "s", v: "" };
    ws[ref].s = {
      font: { bold: true, sz: 11, color: { rgb: "1A1A1A" } },
      fill: { patternType: "solid", fgColor: { rgb: "FFD400" } },
      alignment: { horizontal: "center", vertical: "center" },
      border,
    };
  }

  // Saat satırları (r=3+): col0 = saat etiketi (koyu/sol), rol sütunları striped,
  // ek sütunlar kendi rengiyle boyanır (extraCols[c - roleColCount - 1].bg).
  for (let i = 0; i < hours.length; i++) {
    const r = 3 + i;
    const stripe = i % 2 === 0 ? "FFFFFF" : "F7F7F4";
    for (let c = 0; c < nCols; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      let bg = stripe;
      if (c > roleColCount) bg = extraCols[c - roleColCount - 1].bg;
      ws[ref].s = {
        font: { sz: 10, color: { rgb: "1A1A1A" }, bold: c === 0 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        border,
      };
    }
  }

  // Row heights: başlık + header biraz uzun, saat satırları içerik wrap'i için 24pt.
  const rows: { hpt: number }[] = [{ hpt: 22 }, { hpt: 6 }, { hpt: 20 }];
  for (let i = 0; i < hours.length; i++) rows.push({ hpt: 24 });
  ws["!rows"] = rows;

  XLSX.utils.book_append_sheet(wb, ws, "Chart");
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  wsMeta["!cols"] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, "Bilgi");

  const filename = `shift-${shiftDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
