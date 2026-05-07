import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { RefreshCw, LogOut, Eye, ArrowLeft, Activity } from "lucide-react";
import { PinGuard, clearAccess } from "@/components/PinGuard";

const cabinMeta: Record<string, { label: string; color: string; bg: string }> = {
  altin:     { label: "Altın",     color: "#B8935A", bg: "#FDF9F1" },
  gelisim:   { label: "Gelişim",   color: "#9B8F80", bg: "#F4F1EC" },
  baslangic: { label: "Başlangıç", color: "#8B6F47", bg: "#F4EFE6" },
};

function DonutRing({ percentage, color, count }: { percentage: number; color: string; count: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(percentage), 100);
    return () => clearTimeout(t);
  }, [percentage]);

  const offset = c - (animated / 100) * c;
  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(26,22,20,0.08)" strokeWidth="2" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22, 0.61, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-xl tabular-nums leading-none" style={{ color }}>{count}</span>
        <span className="text-[8px] font-mono tracking-[0.2em] text-ink/30 mt-0.5">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function AdminContent() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: participants, isLoading } = trpc.admin.list.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: stats } = trpc.admin.stats.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const total = stats?.total || 0;
  const distributions = [
    { key: "altin",     count: stats?.altin || 0,     pct: total ? ((stats?.altin || 0) / total) * 100 : 0 },
    { key: "gelisim",   count: stats?.gelisim || 0,   pct: total ? ((stats?.gelisim || 0) / total) * 100 : 0 },
    { key: "baslangic", count: stats?.baslangic || 0, pct: total ? ((stats?.baslangic || 0) / total) * 100 : 0 },
  ];

  return (
    <div className="min-h-screen bg-zara text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-zara/80 border-b border-zara animate-fade-down">
        <div className="px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40 hover:text-ink transition-colors"
            >
              <ArrowLeft size={12} />
              ZARA · ACADEMY
            </button>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
              <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">
                LIVE · ADMIN DASHBOARD
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/show")}
              className="flex items-center gap-2 px-4 py-2 border border-ink/20 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/50 hover:text-ink hover:border-ink/40 transition-colors"
            >
              <Eye size={11} />
              Show Mode
            </button>
            <button
              onClick={() => {
                utils.admin.list.invalidate();
                utils.admin.stats.invalidate();
              }}
              className="flex items-center gap-2 px-4 py-2 border border-ink/20 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/50 hover:text-ink hover:border-ink/40 transition-colors"
            >
              <RefreshCw size={11} />
              Yenile
            </button>
            <button
              onClick={() => { clearAccess(); window.location.reload(); }}
              className="text-ink/30 hover:text-red-500 transition-colors"
              title="Çıkış"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 md:px-12 py-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Title */}
          <div className="flex items-end justify-between border-b border-zara pb-6 animate-fade-up">
            <div>
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)] mb-2">
                · DASHBOARD
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-ink tracking-[-0.02em]">
                Eğitim <span className="italic font-light">Sonuçları</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
              <Activity size={12} className="text-emerald-600" />
              {total} / 40 KATILIMCI
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-100">
            {distributions.map((d) => {
              const meta = cabinMeta[d.key];
              return (
                <div
                  key={d.key}
                  className="bg-white p-6 lift relative overflow-hidden border-l-2"
                  style={{ borderLeftColor: meta.color }}
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"
                    style={{ background: meta.color, filter: "blur(40px)" }}
                  />
                  <div className="relative flex items-center gap-5">
                    <DonutRing percentage={d.pct} color={meta.color} count={d.count} />
                    <div>
                      <div className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: meta.color }}>
                        KABİN
                      </div>
                      <div className="font-serif text-2xl tracking-[-0.02em] mt-1 text-ink">
                        {meta.label}
                      </div>
                      <div className="text-xs text-ink/40 font-sans mt-0.5">
                        {d.count} kişi · %{Math.round(d.pct)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <section className="animate-fade-up delay-200">
            <div className="flex items-end justify-between mb-4 pb-3 border-b border-zara">
              <h3 className="text-[10px] tracking-[0.3em] text-ink/50 font-mono uppercase">
                · KATILIMCI LİSTESİ
              </h3>
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-ink/30">
                Sorted by recent
              </span>
            </div>
            <div className="bg-white border border-zara overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zara bg-zara/50">
                    <th className="text-left px-5 py-3 text-[10px] tracking-[0.25em] text-ink/40 font-mono uppercase">#</th>
                    <th className="text-left px-5 py-3 text-[10px] tracking-[0.25em] text-ink/40 font-mono uppercase">İsim</th>
                    <th className="text-left px-5 py-3 text-[10px] tracking-[0.25em] text-ink/40 font-mono uppercase">İlerleme</th>
                    <th className="text-left px-5 py-3 text-[10px] tracking-[0.25em] text-ink/40 font-mono uppercase">Puan</th>
                    <th className="text-left px-5 py-3 text-[10px] tracking-[0.25em] text-ink/40 font-mono uppercase">Kabin</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="inline-flex items-center gap-2 text-ink/30 text-[10px] font-mono tracking-[0.3em] uppercase">
                          <RefreshCw size={11} className="animate-spin" />
                          Yükleniyor
                        </div>
                      </td>
                    </tr>
                  ) : participants && participants.length > 0 ? (
                    participants.map((p, idx) => {
                      const meta = cabinMeta[p.cabin] || cabinMeta.gelisim;
                      const pct = Math.min((p.totalScore / 21) * 100, 100);
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-zara hover:bg-zara/40 transition-colors animate-fade-up"
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <td className="px-5 py-3 text-[10px] font-mono tabular-nums text-ink/30">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-5 py-3 font-serif text-base text-ink">{p.name}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 max-w-[200px]">
                              <div className="flex-1 h-1 bg-ink/5 overflow-hidden">
                                <div
                                  className="h-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background: meta.color,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono text-sm tabular-nums" style={{ color: meta.color }}>
                            {p.totalScore}<span className="text-ink/20">/21</span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className="inline-block px-2.5 py-1 text-[9px] tracking-[0.25em] font-mono uppercase"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-ink/30 text-[10px] font-mono tracking-[0.3em] uppercase">
                        · Henüz katılımcı yok ·
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PinGuard>
      <AdminContent />
    </PinGuard>
  );
}
