import { useState } from "react";
import { Loader2, Activity, Database, Shield, Cpu } from "lucide-react";
import { trpc } from "@/providers/trpc";

export function SystemSettings() {
  const sysQuery = trpc.system.info.useQuery();
  const utils = trpc.useUtils();
  const pingMut = trpc.chart.ping.useQuery(undefined, {
    enabled: false,
    staleTime: Infinity,
  });
  const [pingResult, setPingResult] = useState<string | null>(null);

  async function ping() {
    setPingResult(null);
    const result = await utils.chart.ping.fetch();
    setPingResult(`${result.ok ? "✓" : "✗"} ${result.url} → ${result.status ?? "N/A"}`);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-stone-600 leading-relaxed">
        Veritabanı durumu, solver bağlantısı ve sistem yapılandırması.
      </p>

      {sysQuery.isLoading ? (
        <div className="text-stone-400 text-sm">
          <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
        </div>
      ) : (
        <>
          <section>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3 flex items-center gap-2">
              <Database size={11} strokeWidth={1.5} /> Veritabanı
            </h4>
            <div className="grid grid-cols-3 gap-px bg-stone-300 border border-stone-300">
              {[
                { label: "Personel", value: sysQuery.data?.staff ?? 0 },
                { label: "Yetkinlik", value: sysQuery.data?.competencies ?? 0 },
                { label: "Chart", value: sysQuery.data?.charts ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white p-5">
                  <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
                    {s.label}
                  </div>
                  <div className="text-3xl font-light tabular-nums">
                    {String(s.value).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3 flex items-center gap-2">
              <Cpu size={11} strokeWidth={1.5} /> Solver Bağlantısı
            </h4>
            <div className="border border-stone-300 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sysQuery.data?.solverUrl === "configured"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm">
                  SHIFT_SOLVER_URL: <strong>{sysQuery.data?.solverUrl}</strong>
                </span>
              </div>
              <button
                onClick={ping}
                disabled={pingMut.isFetching}
                className="border border-black px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100 disabled:opacity-50"
              >
                <Activity size={11} strokeWidth={1.5} /> Ping
              </button>
            </div>
            {pingResult && (
              <div className="mt-2 text-xs font-mono text-stone-600 border-l-2 border-stone-300 pl-3">
                {pingResult}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3 flex items-center gap-2">
              <Shield size={11} strokeWidth={1.5} /> Güvenlik
            </h4>
            <div className="border border-stone-300 p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Sayfa parola koruması</span>
                <span
                  className={
                    sysQuery.data?.authRequired
                      ? "text-emerald-700 font-medium"
                      : "text-stone-400"
                  }
                >
                  {sysQuery.data?.authRequired ? "AKTİF" : "PASİF"}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Parola koruması Vercel'deki <code className="bg-stone-100 px-1 rounded">SHIFT_ORGANIZER_PASSWORD</code> env
                değişkeni ile yönetilir. Aktif edilirse /shift-organizer'a erişmek için
                parola gerekir.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
