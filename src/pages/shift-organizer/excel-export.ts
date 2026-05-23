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
      }
      return name;
    });
    byKey.set(`${c.hour}|${c.role}`, labeled.join(" · "));
  }

  // Saat → Mola / Task / Aktif iş gücü hesaplaması
  const breaksByHour = new Map<number, string[]>();
  const tasksByHour = new Map<number, string[]>();
  const activeByHour = new Map<number, number>();
  if (shifts) {
    for (const h of hours) {
      let count = 0;
      for (const s of shifts) {
        if (h < s.start_hour || h >= s.end_hour) continue;
        const onBreak = (s.breaks ?? []).some(([bs, be]) => bs <= h && be >= h + 1);
        const onTask = (s.tasks ?? []).some(([th]) => th === h);
        if (!onBreak && !onTask) count++;
      }
      activeByHour.set(h, count);
    }
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        if (be - bs <= 0.5 + 1e-6) continue;
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const arr = breaksByHour.get(h) ?? [];
          if (!arr.includes(s.short_name)) arr.push(s.short_name);
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

  // Pivot: satırlar = roller, sütunlar = saatler
  const header = ["Rol", ...hours.map((h) => `${String(h).padStart(2, "0")}:00`)];
  const roleRows = roles.map((r) => [
    roleLabel(r),
    ...hours.map((h) => byKey.get(`${h}|${r}`) ?? "—"),
  ]);

  const extraRows: (string | number)[][] = [];
  if (hasBreaks) {
    extraRows.push([
      "MOLA",
      ...hours.map((h) => (breaksByHour.get(h) ?? []).join(" · ") || "—"),
    ]);
  }
  if (hasTasks) {
    extraRows.push([
      "TASK (HR/TR/ISG)",
      ...hours.map((h) => (tasksByHour.get(h) ?? []).join(" · ") || "—"),
    ]);
  }
  if (hasActive) {
    extraRows.push(["AKTİF İŞ GÜCÜ", ...hours.map((h) => activeByHour.get(h) ?? 0)]);
  }

  // chart1 stili: A1'de başlık, blank row, sonra pivot + ek satırlar
  const titleRow: (string | number)[] = [`Günlük Chart — ${shiftDate}`];
  for (let i = 0; i < hours.length; i++) titleRow.push("");
  const data: (string | number)[][] = [titleRow, [], header, ...roleRows, ...extraRows];

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
  ws["!cols"] = [{ wch: 22 }, ...hours.map(() => ({ wch: 16 }))];

  // chart1 görsel paritesi: sarı header, MOLA turuncu, TASK pembe, AKTİF yeşil,
  // başlık merge'lenmiş büyük, rol satırları beyaz/gri striped, freeze panes.
  const nCols = hours.length + 1; // Rol + saatler
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

  // Row 3: header (sarı bg + bold)
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

  // Role rows: alt-row alternation + center align + border
  for (let i = 0; i < roleRows.length; i++) {
    const r = 3 + i;
    const stripe = i % 2 === 0 ? "FFFFFF" : "F7F7F4";
    for (let c = 0; c < nCols; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      ws[ref].s = {
        font: { sz: 10, color: { rgb: "1A1A1A" } },
        alignment: { horizontal: c === 0 ? "left" : "center", vertical: "center", wrapText: true },
        fill: { patternType: "solid", fgColor: { rgb: stripe } },
        border,
      };
      if (c === 0) ws[ref].s.font = { ...ws[ref].s.font, bold: true };
    }
  }

  // Extra rows (MOLA / TASK / AKTİF): renkli backgrounds
  const extraColors: Record<string, string> = {
    MOLA: "FFE0B2", // turuncu
    "TASK (HR/TR/ISG)": "F8BBD0", // pembe
    "AKTİF İŞ GÜCÜ": "C8E6C9", // yeşil
  };
  for (let i = 0; i < extraRows.length; i++) {
    const r = 3 + roleRows.length + i;
    const label = String(extraRows[i][0] ?? "");
    const bg = extraColors[label] ?? "EEEEEE";
    for (let c = 0; c < nCols; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      ws[ref].s = {
        font: { sz: 10, color: { rgb: "1A1A1A" }, bold: c === 0 },
        alignment: { horizontal: c === 0 ? "left" : "center", vertical: "center", wrapText: true },
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        border,
      };
    }
  }

  // Row heights: header + MOLA-tarzı satırlar biraz daha uzun
  const rows: { hpt: number }[] = [{ hpt: 22 }, { hpt: 6 }, { hpt: 20 }];
  for (let i = 0; i < roleRows.length; i++) rows.push({ hpt: 22 });
  for (let i = 0; i < extraRows.length; i++) rows.push({ hpt: 24 });
  ws["!rows"] = rows;

  XLSX.utils.book_append_sheet(wb, ws, "Chart");
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  wsMeta["!cols"] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, "Bilgi");

  const filename = `shift-${shiftDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
