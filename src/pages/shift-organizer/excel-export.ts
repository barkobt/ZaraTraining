import * as XLSX from "xlsx";
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
        const dur = be - bs;
        const isHalf = dur <= 0.5 + 1e-6;
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
  ws["!cols"] = [{ wch: 18 }, ...hours.map(() => ({ wch: 14 }))];
  XLSX.utils.book_append_sheet(wb, ws, "Chart");
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, "Bilgi");

  const filename = `shift-${shiftDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
