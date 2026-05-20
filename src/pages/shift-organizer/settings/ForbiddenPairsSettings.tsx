import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ROLES } from "../constants";

export function ForbiddenPairsSettings() {
  const utils = trpc.useUtils();
  const pairsQuery = trpc.solverConfig.forbiddenPairs.useQuery();
  const [pairA, setPairA] = useState<string>(ROLES[0]);
  const [pairB, setPairB] = useState<string>(ROLES[1]);

  const addMut = trpc.solverConfig.addForbiddenPair.useMutation({
    onSuccess: () => utils.solverConfig.forbiddenPairs.invalidate(),
  });
  const removeMut = trpc.solverConfig.removeForbiddenPair.useMutation({
    onSuccess: () => utils.solverConfig.forbiddenPairs.invalidate(),
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600 leading-relaxed">
        Bu rol çiftleri <strong>aynı kişiye aynı saatte</strong> verilemez. Solver bu kuralı
        hard constraint olarak uygular — yasak çift atanırsa çözüm INFEASIBLE döner. Örneğin
        "Sprinter" ve "Welcome" yasak çift olarak işaretlenirse, bir kişi aynı saatte ikisinde
        birden olamaz.
      </p>

      <section className="border border-stone-300 p-4">
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Yeni Yasak Çift Ekle
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={pairA}
            onChange={(e) => setPairA(e.target.value)}
            className="border border-stone-300 px-3 py-2 outline-none focus:border-black text-sm flex-1 min-w-[140px]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="text-stone-400 font-mono">+</span>
          <select
            value={pairB}
            onChange={(e) => setPairB(e.target.value)}
            className="border border-stone-300 px-3 py-2 outline-none focus:border-black text-sm flex-1 min-w-[140px]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            disabled={pairA === pairB || addMut.isPending}
            onClick={() => addMut.mutate({ roleA: pairA, roleB: pairB })}
            className="bg-black text-white px-4 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-800 disabled:bg-stone-300"
          >
            <Plus size={12} strokeWidth={2} /> Ekle
          </button>
        </div>
        {pairA === pairB && (
          <p className="mt-2 text-[10px] text-amber-600">Aynı rol seçemezsin.</p>
        )}
      </section>

      <section>
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Mevcut Yasak Çiftler ({pairsQuery.data?.length ?? 0})
        </h4>
        {pairsQuery.isLoading ? (
          <div className="text-stone-400 text-sm">
            <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
          </div>
        ) : (pairsQuery.data ?? []).length === 0 ? (
          <div className="border border-stone-200 p-6 text-stone-400 text-sm text-center">
            Henüz yasak çift yok. Solver tüm rol kombinasyonlarını esnek değerlendirir.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(pairsQuery.data ?? []).map((p) => (
              <div
                key={`${p.roleA}-${p.roleB}`}
                className="flex items-center gap-2 border border-stone-300 px-3 py-1.5 text-xs"
              >
                <span>{p.roleA}</span>
                <span className="text-stone-400 font-mono">+</span>
                <span>{p.roleB}</span>
                <button
                  onClick={() =>
                    removeMut.mutate({ roleA: p.roleA, roleB: p.roleB })
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
      </section>
    </div>
  );
}
