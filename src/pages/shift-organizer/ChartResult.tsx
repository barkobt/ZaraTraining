import { useEffect, useMemo, useState } from "react";
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
  onExportExcel?: (resp: Responsibilities) => void;
  onExportPdf?: (resp: Responsibilities) => void;
}) {
  // Panelde seçilen sorumlular canlı tutulur; export bunu kullanır (DB'ye yazılan
  // ama generate.data'ya yansımayan seçimler bayat kalmasın → FAZ 8 bind).
  const [liveResp, setLiveResp] = useState<Responsibilities>(result.responsibilities ?? {});
  useEffect(() => {
    setLiveResp(result.responsibilities ?? {});
  }, [result.chartId, result.responsibilities]);

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

  /**
   * Yarım saat giriş/çıkış tespiti — kişi o saatte sadece yarım çalışıyor.
   * start=10.5 → 10:00 slotu yarım (floor(10.5)=10).
   * end=21.5 → 21:00 slotu yarım (floor(21.5)=21, end exclusive olduğundan 21:00-21:30).
   * Backend bu kişiyi tam slota yazar; chart'ta "1/2" ile paslaşma vurgusu yapılır.
   */
  const halfBoundaryNamesByHour = useMemo(() => {
    const m = new Map<number, Set<string>>();
    if (!shifts) return m;
    const mark = (h: number, name: string) => {
      const set = m.get(h) ?? new Set<string>();
      set.add(name);
      m.set(h, set);
    };
    for (const s of shifts) {
      if (s.start_hour % 1 === 0.5) mark(Math.floor(s.start_hour), s.short_name);
      if (s.end_hour % 1 === 0.5) mark(Math.floor(s.end_hour), s.short_name);
    }
    return m;
  }, [shifts]);

  /** İsmi o saate göre "1/2" suffix'iyle göstersin: yarım mola VEYA yarım giriş/çıkış. */
  const displayName = (name: string, hour: number): string =>
    halfBreakNamesByHour.get(hour)?.has(name) || halfBoundaryNamesByHour.get(hour)?.has(name)
      ? `${name} 1/2`
      : name;

  /** Mola kolonu: tam + yarım mola. Yarım mola "X 1/2" suffix'le yazılır
   *  (özetlenebilir hat). Aynı kişi rol hücresinde de "X 1/2" görünür. */
  const breaksByHour = useMemo(() => {
    const m = new Map<number, string[]>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [bStart, bEnd] of s.breaks ?? []) {
        const isHalf = bEnd - bStart <= 0.5 + 1e-6;
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

  /** Aktif İş Gücü: o saatte sahada + mola/task hariç. */
  const activeWorkforceByHour = useMemo(() => {
    const m = new Map<number, number>();
    if (!shifts) return m;
    for (const h of hours) {
      let count = 0;
      for (const s of shifts) {
        // Overlap semantiği (backend is_working_at ile birebir): [h, h+1) slotu
        // shift aralığıyla kesişiyorsa sahada. Yarım saat (16.5) başlangıcı yakalar.
        if (s.start_hour >= h + 1 || s.end_hour <= h) continue;
        // Tam saat mola?
        const onBreak = (s.breaks ?? []).some(
          ([bs, be]) => bs <= h && be >= h + 1,
        );
        if (onBreak) continue;
        // Blocking task?
        const onTask = (s.tasks ?? []).some(([th]) => th === h);
        if (onTask) continue;
        count++;
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
                onClick={() => onExportPdf(liveResp)}
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <FileDown size={11} strokeWidth={1.5} /> PDF
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={() => onExportExcel(liveResp)}
                title="Düzenlenebilir .xlsx — Excel ve Apple Numbers'da açılır"
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <Download size={11} strokeWidth={1.5} /> Excel / Numbers
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
                    return (
                      <td key={r} className="p-2 text-center">
                        {labeled.length === 0 ? (
                          <span className="text-stone-300">—</span>
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
            onChange={setLiveResp}
          />
        </div>
      )}
    </div>
  );
}
