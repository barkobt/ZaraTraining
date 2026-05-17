import * as XLSX from "xlsx";
import type { GenerateResult } from "./ChartResult";

export function exportChartToExcel(result: GenerateResult, shiftDate: string) {
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = [...new Set(result.chart.map((c) => c.role))];

  const byKey = new Map<string, string>();
  for (const c of result.chart) {
    byKey.set(`${c.hour}|${c.role}`, c.persons.join("·"));
  }

  const header = ["Rol", ...hours.map((h) => `${String(h).padStart(2, "0")}:00`)];
  const rows = roles.map((r) => [r, ...hours.map((h) => byKey.get(`${h}|${r}`) ?? "—")]);

  const data = [header, ...rows];

  // Meta sheet
  const meta = [
    ["Tarih", shiftDate],
    ["Durum", result.status],
    ["Skor", result.qualityScore ?? "-"],
    ["Süre (s)", result.elapsedSeconds.toFixed(2)],
    ["Chart ID", result.chartId ?? "-"],
    [],
    ["Uyarılar"],
    ...result.warnings.map((w) => [w]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, ...hours.map(() => ({ wch: 14 }))];
  XLSX.utils.book_append_sheet(wb, ws, "Chart");
  const wsMeta = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, "Bilgi");

  const filename = `shift-${shiftDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
