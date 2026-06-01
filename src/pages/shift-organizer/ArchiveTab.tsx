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

  const statusTone = (s: string) => (s === "OPTIMAL" ? "ok" : s === "FEASIBLE" ? "draft" : "bad");

  return (
    <div>
      <div className="arch-head">
        <div>
          <h2 className="arch-title">Arşiv</h2>
          <p className="arch-sub">Geçmiş chart üretimlerini görüntüle, sil, Excel/PDF'e aktar.</p>
        </div>
        <span className="arch-count num">{q.data?.length ?? 0} kayıt</span>
      </div>

      {q.isLoading ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--zara-ink-40)", fontSize: 13 }}>
          <Loader2 className="inline-block animate-spin" size={14} style={{ verticalAlign: "-2px", marginRight: 8 }} /> Yükleniyor…
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="panel" style={{ padding: 48, textAlign: "center", color: "var(--zara-ink-40)" }}>
          <ArchiveIcon size={32} strokeWidth={1} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Henüz chart üretilmedi.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Shift &amp; Chart sekmesinden ilk chart'ını üret.</p>
        </div>
      ) : (
        <div className="arch-grid">
          {(q.data as ChartRow[]).map((c) => (
            <div className="arch-card" key={c.id}>
              <div className="arch-card-top">
                <span className="ac-no num">#{c.id}</span>
                <span className={`badge ${statusTone(c.status)}`}><span className="dot" />{c.status}</span>
              </div>
              <div className="ac-date">{c.shiftDate}</div>
              <div className="ac-stamp num">
                {new Date(c.generatedAt).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="ac-score">
                Skor <b className="num">{c.qualityScore !== null ? c.qualityScore.toFixed(1) : "—"}</b>
                {c.responsibilities && Object.keys(c.responsibilities).length > 0 && (
                  <span style={{ marginLeft: 10, color: "var(--zara-ink-40)", fontSize: 10 }}>
                    · {Object.keys(c.responsibilities).length} sorumlu
                  </span>
                )}
              </div>
              <div className="ac-actions">
                <button className="btn ghost sm" onClick={() => setOpenId(c.id)}>
                  <Eye size={12} strokeWidth={1.6} /> Aç
                </button>
                <button
                  className="ac-del"
                  onClick={() => {
                    if (confirm(`Chart #${c.id} silinsin mi?`)) delMut.mutate({ id: c.id });
                  }}
                  title="Sil"
                >
                  <Trash2 size={14} strokeWidth={1.6} />
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
