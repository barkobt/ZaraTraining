import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Sparkles, Shield, Heart } from "lucide-react";
import { trpc } from "@/providers/trpc";

type ConfigKey =
  | "competencyWeight"
  | "fairnessWeight"
  | "managerMorningPenalty"
  | "managerNormalPenalty"
  | "dualPenalty"
  | "sprinterDualPenalty"
  | "buddyViolationPenalty"
  | "maxConsecutiveHours";

const FIELDS: Array<{
  key: ConfigKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}> = [
  {
    key: "competencyWeight",
    label: "Yetkinlik Ağırlığı",
    hint: "Yüksek = yetkin kişi tercih edilir. Düşük = yetkinliğe daha az önem.",
    min: 0,
    max: 10,
    step: 0.1,
  },
  {
    key: "fairnessWeight",
    label: "Adalet Ağırlığı",
    hint: "Yüksek = iş yükü herkese eşit dağılır. Düşük = en yetkinli kişi sürekli aynı role atanabilir.",
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    key: "managerMorningPenalty",
    label: "Yönetici Sabah Cezası",
    hint: "Yöneticileri sabah (10-12) atamaya direnme şiddeti. Yüksek = sadece kriz anında.",
    min: 0,
    max: 5000,
    step: 50,
  },
  {
    key: "managerNormalPenalty",
    label: "Yönetici Normal Cezası",
    hint: "Yöneticileri gündüz atamaya direnme şiddeti. Sabahtan çok daha yüksek olmalı.",
    min: 0,
    max: 20000,
    step: 100,
  },
  {
    key: "dualPenalty",
    label: "Çift Atama Cezası",
    hint: "Bir kişiyi aynı saatte 2 role atamaktan kaçınma. Yüksek = solver dual rolleri minimize eder.",
    min: 0,
    max: 5000,
    step: 50,
  },
  {
    key: "sprinterDualPenalty",
    label: "Sprinter Çift Cezası",
    hint: "Sprinter'a atanan kişiyi başka role koymaktan kaçınma. Sprinter mobil olduğu için yüksek tut.",
    min: 0,
    max: 10000,
    step: 100,
  },
  {
    key: "buddyViolationPenalty",
    label: "Buddy İhlali Cezası",
    hint: "Çok yeni (0-1 ay) personeli tek bırakma cezası. Yüksek = solver yanında deneyimli ekler.",
    min: 0,
    max: 10000,
    step: 100,
  },
  {
    key: "maxConsecutiveHours",
    label: "Maks. Ardışık Saat",
    hint: "Bir kişi aynı role en fazla kaç saat ardışık. 2 = her 2 saatte rol değişir, 5 = nadiren değişir.",
    min: 1,
    max: 12,
    step: 1,
  },
];

const PRESETS: Record<string, { label: string; icon: typeof Sparkles; desc: string; values: Record<ConfigKey, number> }> = {
  dengeli: {
    label: "Dengeli",
    icon: Sparkles,
    desc: "Yetkinlik ve adalet eşit ağırlıkta. Çoğu mağaza için ideal.",
    values: {
      competencyWeight: 3.0,
      fairnessWeight: 0.5,
      managerMorningPenalty: 500,
      managerNormalPenalty: 5000,
      dualPenalty: 800,
      sprinterDualPenalty: 3000,
      buddyViolationPenalty: 2000,
      maxConsecutiveHours: 2,
    },
  },
  siki: {
    label: "Sıkı",
    icon: Shield,
    desc: "Yetkinlik ön planda. Yeni personel daha az rol değişir. Kalite garantisi yüksek.",
    values: {
      competencyWeight: 5.0,
      fairnessWeight: 0.3,
      managerMorningPenalty: 1000,
      managerNormalPenalty: 8000,
      dualPenalty: 1500,
      sprinterDualPenalty: 5000,
      buddyViolationPenalty: 4000,
      maxConsecutiveHours: 4,
    },
  },
  esnek: {
    label: "Esnek",
    icon: Heart,
    desc: "Adalet ve gelişim ön planda. Herkes farklı role girer, öğrenme hızlanır.",
    values: {
      competencyWeight: 2.0,
      fairnessWeight: 1.5,
      managerMorningPenalty: 300,
      managerNormalPenalty: 3000,
      dualPenalty: 400,
      sprinterDualPenalty: 2000,
      buddyViolationPenalty: 1500,
      maxConsecutiveHours: 2,
    },
  },
};

export function SolverSettings() {
  const utils = trpc.useUtils();
  const cfgQuery = trpc.solverConfig.get.useQuery();
  const [local, setLocal] = useState<Record<ConfigKey, number> | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (cfgQuery.data && !local) {
      const cfg = cfgQuery.data as unknown as Record<ConfigKey, number>;
      const init = {} as Record<ConfigKey, number>;
      for (const f of FIELDS) init[f.key] = Number(cfg[f.key] ?? 0);
      setLocal(init);
    }
  }, [cfgQuery.data, local]);

  const update = trpc.solverConfig.update.useMutation({
    onSuccess: () => {
      utils.solverConfig.get.invalidate();
      setDirty(false);
    },
  });

  function applyPreset(key: keyof typeof PRESETS) {
    setLocal(PRESETS[key].values);
    setDirty(true);
  }

  function reset() {
    if (cfgQuery.data) {
      const cfg = cfgQuery.data as unknown as Record<ConfigKey, number>;
      const init = {} as Record<ConfigKey, number>;
      for (const f of FIELDS) init[f.key] = Number(cfg[f.key] ?? 0);
      setLocal(init);
      setDirty(false);
    }
  }

  if (cfgQuery.isLoading || !local) {
    return (
      <div className="text-stone-400 text-sm">
        <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Hazır Profiller
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(PRESETS).map(([key, p]) => {
            const Icon = p.icon;
            return (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
                className="text-left border border-stone-300 p-4 hover:border-black hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                  <span className="font-serif text-base">{p.label}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Ağırlıklar ve Cezalar
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
          {FIELDS.map((f) => (
            <div key={f.key} className="border-b border-stone-200 pb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] tracking-[0.15em] uppercase text-stone-700 font-medium">
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
                  className="w-24 border-b border-stone-300 py-1 outline-none focus:border-black tabular-nums text-right text-sm"
                />
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={local[f.key]}
                onChange={(e) => {
                  setLocal({ ...local, [f.key]: Number(e.target.value) });
                  setDirty(true);
                }}
                className="w-full accent-black h-1 mb-1"
              />
              <p className="text-[10px] text-stone-400 leading-relaxed">{f.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200">
        <div className="text-xs text-stone-500">
          {dirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
        </div>
        <div className="flex gap-2">
          <button
            disabled={!dirty}
            onClick={reset}
            className="border border-stone-300 px-4 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100 disabled:opacity-50"
          >
            <RotateCcw size={11} strokeWidth={1.5} /> Sıfırla
          </button>
          <button
            disabled={!dirty || update.isPending}
            onClick={() => update.mutate(local)}
            className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300"
          >
            {update.isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
