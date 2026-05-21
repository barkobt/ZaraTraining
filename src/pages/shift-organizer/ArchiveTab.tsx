import { useState } from "react";
import { Loader2, Trash2, Eye, X, Archive as ArchiveIcon } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ChartResult, type GenerateResult } from "./ChartResult";
import { exportChartToExcel } from "./excel-export";
import { exportChartToPdf } from "./pdf-export";
import type { StaffRow } from "./constants";

type ChartRow = {
  id: number;
  shiftDate: string;
  generatedAt: string | Date;
  status: string;
  qualityScore: number | null;
  chartData: unknown;
  shiftData: unknown;
  configSnapshot: unknown;
  responsibilities: Record<string, string> | null;
};

export function ArchiveTab({ staff }: { staff: StaffRow[] }) {
  const utils = trpc.useUtils();
  const q = trpc.chart.list.useQuery({ limit: 100 });
  const [openId, setOpenId] = useState<number | null>(null);

  const delMut = trpc.chart.delete.useMutation({
    onSuccess: () => utils.chart.list.invalidate(),
  });

  const open = (q.data as ChartRow[] | undefined)?.find((c) => c.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg" style={{ fontFamily: "Georgia, serif" }}>
            Arşiv
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Geçmiş chart üretimlerini görüntüle, sil, Excel'e aktar.
          </p>
        </div>
        <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500">
          {q.data?.length ?? 0} kayıt
        </div>
      </div>

      {q.isLoading ? (
        <div className="border border-stone-200 p-8 text-center text-stone-400 text-sm">
          <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="border border-stone-200 p-12 text-center text-stone-400">
          <ArchiveIcon size={32} strokeWidth={1} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Henüz chart üretilmedi.</p>
          <p className="text-xs mt-1">Shift & Chart sekmesinden ilk chart'ını üret.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(q.data as ChartRow[]).map((c) => (
            <div
              key={c.id}
              className="border border-stone-300 hover:border-black transition-colors p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-wider text-stone-400">
                    #{c.id}
                  </div>
                  <div className="font-serif text-xl mt-1">{c.shiftDate}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {new Date(c.generatedAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  className={`text-[9px] tracking-wider uppercase px-2 py-0.5 ${
                    c.status === "OPTIMAL"
                      ? "bg-emerald-100 text-emerald-700"
                      : c.status === "FEASIBLE"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>
                  Skor:{" "}
                  <strong className="tabular-nums">
                    {c.qualityScore !== null ? c.qualityScore.toFixed(1) : "—"}
                  </strong>
                </span>
                {c.responsibilities && Object.keys(c.responsibilities).length > 0 && (
                  <span className="text-[10px] text-stone-400">
                    {Object.keys(c.responsibilities).length} sorumlu
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => setOpenId(c.id)}
                  className="flex-1 border border-black px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-1 hover:bg-stone-100"
                >
                  <Eye size={11} strokeWidth={1.5} /> Aç
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Chart #${c.id} silinsin mi?`)) delMut.mutate({ id: c.id });
                  }}
                  className="border border-stone-300 px-3 py-1.5 text-stone-400 hover:text-red-600 hover:border-red-300"
                  title="Sil"
                >
                  <Trash2 size={11} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <ChartDetailModal
          chart={open}
          staff={staff}
          onClose={() => setOpenId(null)}
          onExportExcel={() => {
            const result = chartToResult(open);
            exportChartToExcel(result, open.shiftDate, shiftsFromArchive(open.shiftData));
          }}
          onExportPdf={() => {
            const result = chartToResult(open);
            exportChartToPdf(result, open.shiftDate, shiftsFromArchive(open.shiftData));
          }}
        />
      )}
    </div>
  );
}

/** Arşivdeki chart'ın shiftData JSON'undan ChartResult.shifts formatına dönüş. */
function shiftsFromArchive(data: unknown): Array<{ short_name: string; start_hour: number; end_hour: number; breaks: Array<[number, number]>; tasks: Array<[number, string]> }> {
  if (!data || typeof data !== "object") return [];
  const obj = data as { shifts?: Array<{ short_name: string; start_hour: number; end_hour: number; breaks?: Array<[number, number]>; tasks?: Array<[number, string]> }> };
  if (!Array.isArray(obj.shifts)) return [];
  return obj.shifts.map((s) => ({
    short_name: s.short_name,
    start_hour: s.start_hour,
    end_hour: s.end_hour,
    breaks: s.breaks ?? [],
    tasks: s.tasks ?? [],
  }));
}

function chartToResult(c: ChartRow): GenerateResult {
  const chart =
    Array.isArray(c.chartData)
      ? (c.chartData as Array<{ role: string; hour: number; persons: string[] }>)
      : [];
  return {
    chartId: c.id,
    status: c.status,
    qualityScore: c.qualityScore,
    warnings: [],
    errors: [],
    elapsedSeconds: 0,
    chart,
    responsibilities: c.responsibilities ?? null,
  };
}

function ChartDetailModal({
  chart,
  staff,
  onClose,
  onExportExcel,
  onExportPdf,
}: {
  chart: ChartRow;
  staff: StaffRow[];
  onClose: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}) {
  const result = chartToResult(chart);
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 p-4 sm:p-8 overflow-y-auto">
      <div className="bg-white border-2 border-black max-w-6xl mx-auto">
        <div className="px-4 sm:px-6 py-4 border-b-2 border-black flex items-center justify-between sticky top-0 bg-white">
          <div>
            <div className="font-mono text-[10px] tracking-wider text-stone-400">
              Chart #{chart.id}
            </div>
            <h3
              className="text-xl sm:text-2xl"
              style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
            >
              {chart.shiftDate}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-black">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <ChartResult
            result={result}
            staff={staff}
            shifts={shiftsFromArchive(chart.shiftData)}
            shiftDate={chart.shiftDate}
            onExportExcel={onExportExcel}
            onExportPdf={onExportPdf}
          />
        </div>
      </div>
    </div>
  );
}
