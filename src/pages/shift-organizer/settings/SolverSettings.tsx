import { useEffect, useState } from "react";
import {
  Loader2, RotateCcw, Sparkles, Shield, Heart, Lock, Save, Trash2, Info, Check,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

// ─────────────────────────────────────────────────────────────────────────────
// GERÇEKTEN ÇALIŞAN AYARLAR
// Solver'a ulaşan (api/_lib/router.ts solverConfigPayload) yalnızca bu 3 ayar +
// time_limit. Diğer eski slider'lar (managerPenalty, dualPenalty, sprinterDual,
// buddy) solver'a HİÇ gönderilmiyordu ve backend onları okumuyor (hardcoded) —
// bu yüzden kaldırıldılar. Yapısal cezalar aşağıda "kilitli" bölümde gerçek
// değerleriyle açıklanır (bilgi amaçlı; chart'ı bozmamak için düzenlenemez).
// ─────────────────────────────────────────────────────────────────────────────

type ConfigKey = "competencyWeight" | "fairnessWeight" | "maxConsecutiveHours";

const FIELDS: Array<{
  key: ConfigKey;
  label: string;
  what: string;
  why: string;
  min: number;
  max: number;
  step: number;
  fmt?: (v: number) => string;
}> = [
  {
    key: "competencyWeight",
    label: "Yetkinlik Ağırlığı",
    what: "Atamada yıldız (yetkinlik) seviyesinin ne kadar önemli olduğu.",
    why: "Yüksek (4-6): solver bir rolü o role en yetkin (⭐⭐⭐+) kişiyle doldurmaya çok daha güçlü çalışır. Düşük (1-2): kapasiteyi doldurmak öncelik, yetkinlik ikincil — yeni personele daha çok şans. Not: kapasite tablosunu doldurmak HER ZAMAN bundan önce gelir; bu ayar yalnızca 'kim' sorusunu etkiler.",
    min: 0,
    max: 6,
    step: 0.5,
  },
  {
    key: "fairnessWeight",
    label: "Adalet (İş Yükü) Ağırlığı",
    what: "İş yükünün gün boyunca herkese ne kadar eşit dağıtılacağı.",
    why: "Yüksek (0.5-1): kimse sürekli aynı yükte kalmaz, yük dengelenir. Düşük (0-0.2): solver en yetkin kişiyi gerektikçe daha sık kullanır, denge ikincil. Çok yükseltmek yetkinliği geri plana atabilir; 0.3 çoğu mağaza için ideal.",
    min: 0,
    max: 1,
    step: 0.1,
  },
  {
    key: "maxConsecutiveHours",
    label: "Maks. Ardışık Saat (Rotasyon)",
    what: "Bir kişi aynı rolde en fazla kaç saat ÜST ÜSTE kalabilir.",
    why: "2: her 2 saatte rol değişir (yorgunluğu azaltır, deneyim çeşitlendirir — önerilen). 3-4: daha az değişim, istikrar artar ama aynı kişi uzun süre aynı zonda kalır. Kabin ailesi (Kabin+KW) ayrıca 4 saat sınırına tabidir.",
    min: 1,
    max: 6,
    step: 1,
  },
];

// Solver'ın SABİT (yapısal) kuralları — gerçek değerler. Bilgi amaçlı, kilitli.
// Bunlar mağaza tercihi değil, çözücünün doğru çalışması için kalibre edilmiş
// mantık kurallarıdır; yanlış değer chart'ı bozar, bu yüzden düzenlenmez.
const LOCKED_RULES: Array<{ label: string; value: string; why: string }> = [
  {
    label: "Kapsama Önceliği",
    value: "1.000.000 – 2.000.000",
    why: "Kapasite tablosundaki bir hücreyi boş bırakmak diğer TÜM cezaların toplamından ağırdır → tablo fiilen zorunlu. Kritik roller (Kabin/Welcome/Sprinter) en yüksek.",
  },
  {
    label: "Sprinter Tek Rol",
    value: "60.000",
    why: "Sprinter joker; aynı kişiyi Sprinter + bir Zone'a yazmak çok pahalı → Sprinter tek kalır, Zone 2'nin eşi Welcome olur (Sprinter değil).",
  },
  {
    label: "Yönetici Kullanımı",
    value: "sabah 50.000 / gündüz 150.000",
    why: "Yöneticiler yalnız başka çare yokken sahaya yazılır; sabah erken saatlerde biraz daha kabul edilebilir.",
  },
  {
    label: "Gereksiz Çift Atama",
    value: "800",
    why: "Kapasite ayrı kişiyle dolabiliyorken aynı kişiye 2 rol verilmesi hafifçe caydırılır (gerekli paslaşmalar — Welcome+Z2, Z3+Z4, Kabin+KW — serbest).",
  },
  {
    label: "Çok Yeni Tek Bırakılmaz",
    value: "2.000",
    why: "0-1 ay personel yalnız bırakılırsa ceza; solver yanına deneyimli birini koymaya çalışır.",
  },
  {
    label: "Welcome ↔ Yarım Mola",
    value: "Kesin kural",
    why: "Yarım saat molası olan kişi o saat Welcome'a (mağaza girişi) atanmaz — giriş 30 dk boş kalmasın diye.",
  },
];

const PRESETS: Record<
  string,
  { label: string; icon: typeof Sparkles; desc: string; values: Record<ConfigKey, number> }
> = {
  dengeli: {
    label: "Dengeli",
    icon: Sparkles,
    desc: "Yetkinlik ve adalet dengeli, 2 saatte rotasyon. Çoğu mağaza için ideal.",
    values: { competencyWeight: 3.0, fairnessWeight: 0.3, maxConsecutiveHours: 2 },
  },
  siki: {
    label: "Kalite Odaklı",
    icon: Shield,
    desc: "Yetkinlik ön planda — her rol mümkün olan en yetkin kişiyle dolar.",
    values: { competencyWeight: 5.0, fairnessWeight: 0.3, maxConsecutiveHours: 3 },
  },
  esnek: {
    label: "Gelişim / Esnek",
    icon: Heart,
    desc: "Yeni personele daha çok şans, yük dengeli. Az kişili günlerde rahat.",
    values: { competencyWeight: 1.5, fairnessWeight: 0.5, maxConsecutiveHours: 2 },
  },
};

// ─── Kaydedilebilir şablonlar (localStorage — tarayıcıda kalıcı) ───
type Template = { id: string; name: string; savedAt: string; values: Record<ConfigKey, number> };
const TPL_KEY = "zt_solver_templates";

function loadTemplates(): Template[] {
  try {
    return JSON.parse(localStorage.getItem(TPL_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveTemplates(t: Template[]) {
  localStorage.setItem(TPL_KEY, JSON.stringify(t));
}

export function SolverSettings() {
  const utils = trpc.useUtils();
  const cfgQuery = trpc.solverConfig.get.useQuery();
  const [local, setLocal] = useState<Record<ConfigKey, number> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplName, setTplName] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => setTemplates(loadTemplates()), []);

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

  function applyPreset(values: Record<ConfigKey, number>) {
    setLocal({ ...values });
    setDirty(true);
    setAppliedId(null);
  }

  function reset() {
    if (cfgQuery.data) {
      const cfg = cfgQuery.data as unknown as Record<ConfigKey, number>;
      const init = {} as Record<ConfigKey, number>;
      for (const f of FIELDS) init[f.key] = Number(cfg[f.key] ?? 0);
      setLocal(init);
      setDirty(false);
      setAppliedId(null);
    }
  }

  function saveAsTemplate() {
    if (!local || !tplName.trim()) return;
    const t: Template = {
      id: crypto.randomUUID(),
      name: tplName.trim(),
      savedAt: new Date().toISOString(),
      values: { ...local },
    };
    const next = [t, ...templates];
    setTemplates(next);
    saveTemplates(next);
    setTplName("");
  }

  function applyTemplate(t: Template) {
    setLocal({ ...t.values });
    setDirty(true);
    setAppliedId(t.id);
  }

  function deleteTemplate(id: string) {
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    saveTemplates(next);
    if (appliedId === id) setAppliedId(null);
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
      {/* Açıklama */}
      <div className="flex gap-2 text-[11px] text-stone-500 bg-stone-50 border border-stone-200 p-3 leading-relaxed">
        <Info size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
        <span>
          Bu ekrandaki 3 ayar çözücüye doğrudan iletilir ve chart'ı etkiler. Aşağıdaki
          "Sistem Kuralları" çözücünün sabit (kalibre edilmiş) mantığıdır — gerçek değerleriyle
          gösterilir, bozulmaması için düzenlenemez. İstediğin ayar setini <b>şablon</b> olarak
          kaydedip sonra geri dönebilirsin.
        </span>
      </div>

      {/* Hazır profiller */}
      <section>
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">Hazır Profiller</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(PRESETS).map(([key, p]) => {
            const Icon = p.icon;
            return (
              <button
                key={key}
                onClick={() => applyPreset(p.values)}
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

      {/* Düzenlenebilir ayarlar */}
      <section>
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Ayarlar <span className="text-stone-400 normal-case tracking-normal">(çözücüye iletilir)</span>
        </h4>
        <div className="space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key} className="border-b border-stone-200 pb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] tracking-[0.15em] uppercase text-stone-700 font-medium">
                  {f.label}
                </label>
                <input
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={local[f.key]}
                  onChange={(e) => {
                    setLocal({ ...local, [f.key]: Number(e.target.value) });
                    setDirty(true);
                    setAppliedId(null);
                  }}
                  className="w-20 border-b border-stone-300 py-1 outline-none focus:border-black tabular-nums text-right text-sm"
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
                  setAppliedId(null);
                }}
                className="w-full accent-black h-1 mb-2"
              />
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <b className="text-stone-800">Ne:</b> {f.what}
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                <b className="text-stone-700">Neden:</b> {f.why}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Kaydet / Sıfırla */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-200">
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
            onClick={() =>
              update.mutate({
                competencyWeight: local.competencyWeight,
                fairnessWeight: local.fairnessWeight,
                maxConsecutiveHours: local.maxConsecutiveHours,
              })
            }
            className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300"
          >
            {update.isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Şablonlar */}
      <section className="border-t border-stone-200 pt-6">
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">
          Şablonlarım
        </h4>
        <div className="flex gap-2 mb-3">
          <input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Şablon adı (örn. 'Hafta sonu kalabalık')"
            className="flex-1 border border-stone-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            disabled={!tplName.trim()}
            onClick={saveAsTemplate}
            className="border border-stone-300 px-4 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100 disabled:opacity-50"
          >
            <Save size={11} strokeWidth={1.5} /> Mevcut ayarı kaydet
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-[11px] text-stone-400">
            Henüz şablon yok. Mevcut ayarlarını isimlendirip kaydet — sonra tek tıkla geri dön.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 border border-stone-200">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm text-stone-800 truncate">{t.name}</div>
                  <div className="text-[10px] text-stone-400 tabular-nums">
                    yetk {t.values.competencyWeight} · adalet {t.values.fairnessWeight} · rotasyon{" "}
                    {t.values.maxConsecutiveHours}h · {new Date(t.savedAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => applyTemplate(t)}
                    className={`border px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase flex items-center gap-1 transition-colors ${
                      appliedId === t.id
                        ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                        : "border-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    {appliedId === t.id ? <Check size={11} strokeWidth={2} /> : null}
                    {appliedId === t.id ? "Uygulandı" : "Uygula"}
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="border border-stone-300 px-2 py-1.5 text-stone-400 hover:text-red-600 hover:border-red-300"
                    title="Sil"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {appliedId && dirty && (
          <p className="text-[11px] text-emerald-700 mt-2">
            Şablon forma uygulandı — kalıcı olması için yukarıdan <b>Kaydet</b>'e bas.
          </p>
        )}
      </section>

      {/* Kilitli sistem kuralları */}
      <section className="border-t border-stone-200 pt-6">
        <h4 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1 flex items-center gap-1.5">
          <Lock size={11} strokeWidth={1.5} /> Sistem Kuralları (kilitli)
        </h4>
        <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
          Çözücünün kalibre edilmiş mantığı. Mağaza tercihi değil; doğru chart için bu değerler
          sabittir. Neyin neden böyle olduğunu anlamak için aşağıda.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
          {LOCKED_RULES.map((r) => (
            <div key={r.label} className="bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] tracking-[0.1em] uppercase text-stone-600 font-medium">
                  {r.label}
                </span>
                <span className="text-[11px] tabular-nums text-stone-800 font-medium shrink-0">
                  {r.value}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">{r.why}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
