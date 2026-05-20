import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ROLES } from "./constants";

const CONFIG_FIELDS = [
  { key: "competencyWeight", label: "Yetkinlik Ağırlığı", hint: "Yüksek = yetkin kişi tercih edilir", step: 0.1 },
  { key: "fairnessWeight", label: "Adalet Ağırlığı", hint: "Yüksek = iş eşit dağılır", step: 0.1 },
  { key: "managerMorningPenalty", label: "Yönetici Sabah Cezası", step: 50 },
  { key: "managerNormalPenalty", label: "Yönetici Normal Cezası", step: 100 },
  { key: "dualPenalty", label: "Çift Atama Cezası", step: 50 },
  { key: "sprinterDualPenalty", label: "Sprinter Çift Cezası", step: 100 },
  { key: "buddyViolationPenalty", label: "Buddy İhlali Cezası", step: 100 },
  { key: "maxConsecutiveHours", label: "Maks. Ardışık Saat", step: 1 },
] as const;

type ConfigKey = (typeof CONFIG_FIELDS)[number]["key"];

export function SettingsTab() {
  const utils = trpc.useUtils();
  const cfgQuery = trpc.solverConfig.get.useQuery();
  const pairsQuery = trpc.solverConfig.forbiddenPairs.useQuery();

  const [local, setLocal] = useState<Record<ConfigKey, number> | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (cfgQuery.data && !local) {
      const cfg = cfgQuery.data as unknown as Record<ConfigKey, number>;
      const init = {} as Record<ConfigKey, number>;
      for (const f of CONFIG_FIELDS) init[f.key] = Number(cfg[f.key] ?? 0);
      setLocal(init);
    }
  }, [cfgQuery.data, local]);

  const updateMut = trpc.solverConfig.update.useMutation({
    onSuccess: () => {
      utils.solverConfig.get.invalidate();
      setDirty(false);
    },
  });

  const addPairMut = trpc.solverConfig.addForbiddenPair.useMutation({
    onSuccess: () => utils.solverConfig.forbiddenPairs.invalidate(),
  });
  const removePairMut = trpc.solverConfig.removeForbiddenPair.useMutation({
    onSuccess: () => utils.solverConfig.forbiddenPairs.invalidate(),
  });

  const [pairA, setPairA] = useState<string>(ROLES[0]);
  const [pairB, setPairB] = useState<string>(ROLES[1]);

  return (
    <div className="space-y-8">
      <section className="border border-stone-300 p-6">
        <h3 className="text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Solver Parametreleri
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          Çözüm sırasında uygulanan ağırlıklar ve cezalar. Değiştirip "Kaydet"e bas.
        </p>

        {cfgQuery.isLoading || !local ? (
          <div className="text-stone-400 text-sm">
            <Loader2 className="inline-block animate-spin mr-2" size={14} />
            Yükleniyor…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {CONFIG_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-1">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    step={f.step}
                    value={local[f.key]}
                    onChange={(e) => {
                      setLocal({ ...local, [f.key]: Number(e.target.value) });
                      setDirty(true);
                    }}
                    className="w-full border-b border-stone-300 py-2 outline-none focus:border-black tabular-nums"
                  />
                  {"hint" in f && f.hint && (
                    <p className="text-[10px] text-stone-400 mt-1">{f.hint}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
              <div className="text-xs text-stone-500">
                {dirty ? "Kaydedilmemiş değişiklikler var" : "Tüm değişiklikler kaydedildi"}
              </div>
              <button
                disabled={!dirty || updateMut.isPending}
                onClick={() => updateMut.mutate(local)}
                className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300"
              >
                {updateMut.isPending ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="border border-stone-300 p-6">
        <h3 className="text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Yasak Rol Çiftleri
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          Bu çiftler aynı kişiye aynı saatte verilemez (örn. Sprinter + Welcome).
        </p>

        <div className="flex items-center gap-3 mb-6">
          <select
            value={pairA}
            onChange={(e) => setPairA(e.target.value)}
            className="border border-stone-300 px-3 py-2 outline-none focus:border-black text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="text-stone-400">+</span>
          <select
            value={pairB}
            onChange={(e) => setPairB(e.target.value)}
            className="border border-stone-300 px-3 py-2 outline-none focus:border-black text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            disabled={pairA === pairB || addPairMut.isPending}
            onClick={() => addPairMut.mutate({ roleA: pairA, roleB: pairB })}
            className="bg-black text-white px-4 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-800 disabled:bg-stone-300"
          >
            <Plus size={12} strokeWidth={2} /> Ekle
          </button>
        </div>

        <div className="border-t border-stone-200 pt-4">
          {pairsQuery.isLoading ? (
            <div className="text-stone-400 text-sm">
              <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
            </div>
          ) : (pairsQuery.data ?? []).length === 0 ? (
            <div className="text-stone-400 text-sm">Henüz yasak çift yok.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(pairsQuery.data ?? []).map((p) => (
                <div
                  key={`${p.roleA}-${p.roleB}`}
                  className="flex items-center gap-2 border border-stone-300 px-3 py-1 text-xs"
                >
                  <span>{p.roleA}</span>
                  <span className="text-stone-400">+</span>
                  <span>{p.roleB}</span>
                  <button
                    onClick={() =>
                      removePairMut.mutate({ roleA: p.roleA, roleB: p.roleB })
                    }
                    className="text-stone-400 hover:text-red-600 ml-1"
                    title="Sil"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
