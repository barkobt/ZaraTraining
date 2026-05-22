import { useMemo } from "react";
import { Download, FileDown } from "lucide-react";
import { ResponsibilitiesPanel, type Responsibilities } from "./ResponsibilitiesPanel";
import type { StaffRow } from "./constants";

export type GenerateResult = {
  chartId: number | null;
  status: string;
  qualityScore: number | null;
  warnings: string[];
  errors: string[];
  elapsedSeconds: number;
  chart: Array<{ role: string; hour: number; persons: string[] }>;
  responsibilities?: Responsibilities | null;
};

/**
 * Operasyonel kolon sırası — user spec'i:
 * Kabin → Kabin Welcomer → Sprinter → Welcome → Zone 2/3/4/5 → Mola.
 * Solver "KABİN" gibi Türkçe büyük-harf döner; biz hem sırala hem label map'le
 * gösteririz. (Önceden "KAB0N" gibi font render problemine düşülmüştü.)
 */
const ROLE_ORDER: string[] = [
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
  "KABİN": "Kabin",
  "KABİN WELCOMER": "Kabin Welcomer",
  "SPRINTER": "Sprinter",
  "WELCOME": "Welcome",
  "ZONE 2": "Zone 2",
  "ZONE 3": "Zone 3",
  "ZONE 4": "Zone 4",
  "ZONE 5": "Zone 5",
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

/** Hard roller — bu hücreler boş kalmamalı. Boşsa kırmızı uyarı. */
const HARD_ROLES = new Set([
  "KABİN", "KABİN WELCOMER", "WELCOME", "ZONE 3", "ZONE 4", "ZONE 5",
]);

/**
 * GenerateTab veya ArchiveTab'tan gelen shift girdileri (mola hesabı için).
 * Mola kolonu opsiyonel: yoksa gösterilmez.
 */
export type ShiftInputForChart = {
  short_name: string;
  start_hour: number;
  end_hour: number;
  breaks: Array<[number, number]>;
  /** Blocking task'lar: [(saat, 'HR'|'TR'|'ISG')]. Bu saatte chart'ta görünmez. */
  tasks?: Array<[number, string]>;
};

export function ChartResult({
  result,
  staff,
  shifts,
  shiftDate: _shiftDate,
  onExportExcel,
  onExportPdf,
}: {
  result: GenerateResult;
  staff?: StaffRow[];
  shifts?: ShiftInputForChart[];
  shiftDate?: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
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

  /** Sıralı roller — user spec'ine göre (Kabin önce, Zone'lar sonra). */
  const roles = useMemo(() => {
    const set = new Set<string>();
    for (const c of result.chart) set.add(c.role);
    return sortRoles([...set]);
  }, [result.chart]);

  /**
   * Yarım mola (≤30dk) tespiti — kişi adı + saat eşleşmesi.
   * Map<hour, Set<short_name>> — o saatte kişinin yarım molası var mı?
   * Chart'ta hem MOLA satırında hem normal rol hücrelerinde "X 1/2" suffix
   * için kullanılır (user kuralı 2026-05-22: paslaşma vurgusu).
   */
  const halfBreakNamesByHour = useMemo(() => {
    const m = new Map<number, Set<string>>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [bStart, bEnd] of s.breaks ?? []) {
        const dur = bEnd - bStart;
        if (dur <= 0.5 + 1e-6) {
          const h = Math.floor(bStart);
          const set = m.get(h) ?? new Set<string>();
          set.add(s.short_name);
          m.set(h, set);
        }
      }
    }
    return m;
  }, [shifts]);

  /** İsmi o saate göre "1/2" suffix'iyle göstersin yarım molada ise. */
  const displayName = (name: string, hour: number): string =>
    halfBreakNamesByHour.get(hour)?.has(name) ? `${name} 1/2` : name;

  /** Mola kolonu: shifts.breaks'ten her saat için molada olan kişiler.
   *  Yarım molada ise "X 1/2" suffix'iyle. */
  const breaksByHour = useMemo(() => {
    const m = new Map<number, string[]>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [bStart, bEnd] of s.breaks ?? []) {
        const dur = bEnd - bStart;
        const isHalf = dur <= 0.5 + 1e-6;
        for (let h = Math.floor(bStart); h < Math.ceil(bEnd); h++) {
          const arr = m.get(h) ?? [];
          const label = isHalf ? `${s.short_name} 1/2` : s.short_name;
          if (!arr.includes(label)) arr.push(label);
          m.set(h, arr);
        }
      }
    }
    return m;
  }, [shifts]);

  const hasBreaks = breaksByHour.size > 0;

  /** Task kolonu: HR/TR/ISG gibi blocking task'lar. */
  const tasksByHour = useMemo(() => {
    const m = new Map<number, Array<{ name: string; type: string }>>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [hour, type] of s.tasks ?? []) {
        const arr = m.get(hour) ?? [];
        arr.push({ name: s.short_name, type });
        m.set(hour, arr);
      }
    }
    return m;
  }, [shifts]);
  const hasTasks = tasksByHour.size > 0;

  /** Aktif İş Gücü: o saatte sahada + mola/task hariç.
   *  Yarım molada olan kişi 0.5 olarak sayılır (tam dışlanmaz). */
  const activeWorkforceByHour = useMemo(() => {
    const m = new Map<number, number>();
    if (!shifts) return m;
    for (const h of hours) {
      let count = 0;
      for (const s of shifts) {
        if (h < s.start_hour || h >= s.end_hour) continue;
        // Tam saat mola?
        const fullBreak = (s.breaks ?? []).some(
          ([bs, be]) => bs <= h && be >= h + 1,
        );
        if (fullBreak) continue;
        // Blocking task?
        const onTask = (s.tasks ?? []).some(([th]) => th === h);
        if (onTask) continue;
        // Yarım mola? (0.5 saat eksik)
        const halfBreak = (s.breaks ?? []).some(
          ([bs, be]) => {
            const dur = be - bs;
            return dur <= 0.5 + 1e-6 && Math.floor(bs) === h;
          },
        );
        count += halfBreak ? 0.5 : 1;
      }
      m.set(h, count);
    }
    return m;
  }, [shifts, hours]);
  const showActiveRow = activeWorkforceByHour.size > 0;

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
        {result.chart.length > 0 && (
          <div className="ml-auto flex gap-2">
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <FileDown size={11} strokeWidth={1.5} /> PDF
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <Download size={11} strokeWidth={1.5} /> Numbers / Excel
              </button>
            )}
          </div>
        )}
      </div>

      {result.chart.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-sm">
          {result.status === "INFEASIBLE"
            ? "Çözüm bulunamadı — vardiya tanımı çok kısıtlı olabilir."
            : "Sonuç boş."}
        </div>
      ) : (
        /* DİKEY layout: satırlar = saatler (çok), sütunlar = roller (az).
           Az roller, çok saatler senaryosunda daha okunaklı. */
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-white" style={{ boxShadow: "inset 0 -2px 0 #000" }}>
                <th className="sticky top-0 bg-white text-left p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal w-16">
                  Saat
                </th>
                {roles.map((r) => (
                  <th
                    key={r}
                    className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                  >
                    {roleLabel(r)}
                  </th>
                ))}
                {hasBreaks && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-amber-700 font-normal">
                    Mola
                  </th>
                )}
                {hasTasks && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-rose-700 font-normal">
                    Task
                  </th>
                )}
                {showActiveRow && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-500 font-normal">
                    Aktif
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h} className="border-b border-stone-200">
                  <td className="p-2 text-[10px] font-mono tabular-nums text-stone-700 bg-stone-50">
                    {String(h).padStart(2, "0")}:00
                  </td>
                  {roles.map((r) => {
                    const persons = cellsByHourRole.get(`${h}|${r}`) ?? [];
                    // Yarım molalı kişi normal rolde de görünüyorsa "X 1/2"
                    // (paslaşma vurgusu — iki yarım molalı kişi aynı zone'u tutar).
                    const labeled = persons.map((p) => displayName(p, h));
                    const isEmpty = labeled.length === 0;
                    const isHardEmpty = isEmpty && HARD_ROLES.has(r);
                    return (
                      <td
                        key={r}
                        className={`p-2 text-center ${isHardEmpty ? "bg-red-50" : ""}`}
                        style={isHardEmpty ? { border: "1px solid #ef4444" } : undefined}
                      >
                        {isEmpty ? (
                          isHardEmpty ? (
                            <span className="text-red-400 text-[9px]">BOŞ</span>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )
                        ) : (
                          <span className="leading-tight">{labeled.join(" · ")}</span>
                        )}
                      </td>
                    );
                  })}
                  {hasBreaks && (
                    <td className="p-2 text-center bg-amber-50/50">
                      {(breaksByHour.get(h) ?? []).length === 0 ? (
                        <span className="text-stone-300">—</span>
                      ) : (
                        <span className="leading-tight text-amber-800">
                          {(breaksByHour.get(h) ?? []).join(" · ")}
                        </span>
                      )}
                    </td>
                  )}
                  {hasTasks && (
                    <td className="p-2 text-center bg-rose-50/50">
                      {(tasksByHour.get(h) ?? []).length === 0 ? (
                        <span className="text-stone-300">—</span>
                      ) : (
                        <span className="leading-tight text-rose-800">
                          {(tasksByHour.get(h) ?? [])
                            .map((t) => `${t.name} (${t.type})`)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                  )}
                  {showActiveRow && (
                    <td className="p-2 text-center font-mono tabular-nums text-stone-600 bg-stone-50/40">
                      {activeWorkforceByHour.get(h) ?? 0}
                    </td>
                  )}
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

      {staff && result.chart.length > 0 && (
        <div className="px-4 pb-4">
          <ResponsibilitiesPanel
            chartId={result.chartId}
            staff={staff}
            initial={result.responsibilities ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
