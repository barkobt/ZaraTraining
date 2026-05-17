import { useMemo } from "react";
import { Download } from "lucide-react";

export type GenerateResult = {
  chartId: number | null;
  status: string;
  qualityScore: number | null;
  warnings: string[];
  errors: string[];
  elapsedSeconds: number;
  chart: Array<{ role: string; hour: number; persons: string[] }>;
};

export function ChartResult({
  result,
  onExportExcel,
}: {
  result: GenerateResult;
  onExportExcel?: () => void;
}) {
  const cellsByHourRole = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of result.chart) m.set(`${c.hour}|${c.role}`, c.persons);
    return m;
  }, [result.chart]);

  const hours = useMemo(() => {
    const set = new Set<number>();
    for (const c of result.chart) set.add(c.hour);
    return [...set].sort((a, b) => a - b);
  }, [result.chart]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    for (const c of result.chart) set.add(c.role);
    return [...set];
  }, [result.chart]);

  return (
    <div className="border border-stone-300">
      <div className="px-4 py-3 border-b border-stone-300 flex items-center gap-4 text-[11px]">
        <span className="tracking-[0.25em] uppercase text-stone-500">Sonuç</span>
        <span
          className={`px-2 py-0.5 ${
            result.status === "OPTIMAL"
              ? "bg-emerald-100 text-emerald-700"
              : result.status === "FEASIBLE"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {result.status}
        </span>
        {result.qualityScore != null && (
          <span className="text-stone-600">Skor: {result.qualityScore.toFixed(1)}</span>
        )}
        <span className="text-stone-400">{result.elapsedSeconds.toFixed(2)}s</span>
        {result.chartId && <span className="text-stone-400">#{result.chartId}</span>}
        {onExportExcel && result.chart.length > 0 && (
          <button
            onClick={onExportExcel}
            className="ml-auto border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
          >
            <Download size={11} strokeWidth={1.5} /> Excel
          </button>
        )}
      </div>

      {result.chart.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-sm">
          {result.status === "INFEASIBLE"
            ? "Çözüm bulunamadı — vardiya tanımı çok kısıtlı olabilir."
            : "Sonuç boş."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal">
                  Rol
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    className="text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                  >
                    {String(h).padStart(2, "0")}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r} className="border-b border-stone-200">
                  <td className="p-2 text-[10px] tracking-wider uppercase">{r}</td>
                  {hours.map((h) => {
                    const persons = cellsByHourRole.get(`${h}|${r}`) ?? [];
                    return (
                      <td key={h} className="p-2 text-center">
                        {persons.length === 0 ? (
                          <span className="text-stone-300">—</span>
                        ) : (
                          persons.join("·")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="px-4 py-3 border-t border-stone-300 text-xs">
          <div className="text-[9px] tracking-[0.25em] uppercase text-amber-700 mb-1">Uyarılar</div>
          <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
            {result.warnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
