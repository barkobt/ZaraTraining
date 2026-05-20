import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

export function StoreSettings() {
  const utils = trpc.useUtils();
  const q = trpc.store.get.useQuery();
  const [local, setLocal] = useState<{ code: string; name: string; section: string } | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (q.data && !local) {
      setLocal({ code: q.data.code, name: q.data.name, section: q.data.section });
    }
  }, [q.data, local]);

  const update = trpc.store.update.useMutation({
    onSuccess: () => {
      utils.store.get.invalidate();
      setDirty(false);
    },
  });

  if (q.isLoading || !local) {
    return (
      <div className="text-stone-400 text-sm">
        <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600 leading-relaxed">
        Mağaza kayıt bilgileri. Code, raporlamada ve PDF üst bilgilerinde görünür.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-2">
            Mağaza Kodu
          </label>
          <input
            value={local.code}
            onChange={(e) => {
              setLocal({ ...local, code: e.target.value });
              setDirty(true);
            }}
            className="w-full border-b border-stone-300 py-2 outline-none focus:border-black font-mono"
          />
          <p className="text-[10px] text-stone-400 mt-1">Örn: 3643</p>
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-2">
            Mağaza Adı
          </label>
          <input
            value={local.name}
            onChange={(e) => {
              setLocal({ ...local, name: e.target.value });
              setDirty(true);
            }}
            className="w-full border-b border-stone-300 py-2 outline-none focus:border-black"
          />
          <p className="text-[10px] text-stone-400 mt-1">Örn: Zara 3643</p>
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-2">
            Bölüm
          </label>
          <select
            value={local.section}
            onChange={(e) => {
              setLocal({ ...local, section: e.target.value });
              setDirty(true);
            }}
            className="w-full border-b border-stone-300 py-2 outline-none focus:border-black bg-transparent"
          >
            <option value="BASIC">BASIC</option>
            <option value="WOMAN">WOMAN</option>
            <option value="MAN">MAN</option>
            <option value="KIDS">KIDS</option>
            <option value="TRF">TRF</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200">
        <div className="text-xs text-stone-500">
          {dirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
        </div>
        <button
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate(local)}
          className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300"
        >
          {update.isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
