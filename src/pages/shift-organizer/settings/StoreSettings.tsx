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
    <div>
      <p style={{ fontSize: 13, color: "var(--zara-ink-65)", lineHeight: 1.6, margin: "0 0 18px" }}>
        Mağaza kayıt bilgileri. Kod, raporlamada ve PDF üst bilgilerinde görünür.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, maxWidth: 720 }}>
        <div className="field" style={{ border: "none", padding: 0 }}>
          <label>Mağaza Kodu</label>
          <input
            className="inp num"
            value={local.code}
            onChange={(e) => { setLocal({ ...local, code: e.target.value }); setDirty(true); }}
          />
          <span className="hint">Örn: 3643</span>
        </div>
        <div className="field" style={{ border: "none", padding: 0 }}>
          <label>Mağaza Adı</label>
          <input
            className="inp"
            value={local.name}
            onChange={(e) => { setLocal({ ...local, name: e.target.value }); setDirty(true); }}
          />
          <span className="hint">Örn: Zara 3643</span>
        </div>
        <div className="field" style={{ border: "none", padding: 0 }}>
          <label>Bölüm</label>
          <select
            className="inp"
            value={local.section}
            onChange={(e) => { setLocal({ ...local, section: e.target.value }); setDirty(true); }}
          >
            <option value="BASIC">BASIC</option>
            <option value="WOMAN">WOMAN</option>
            <option value="MAN">MAN</option>
            <option value="KIDS">KIDS</option>
            <option value="TRF">TRF</option>
          </select>
        </div>
      </div>

      <div className="set-foot" style={{ marginTop: 22, marginLeft: -26, marginRight: -26, marginBottom: -24 }}>
        <span className="caption" style={{ marginRight: "auto", fontFamily: "var(--ff-sans)", fontSize: 12, color: "var(--zara-ink-50)" }}>
          {dirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
        </span>
        <button className="btn" disabled={!dirty || update.isPending} onClick={() => update.mutate(local)}>
          {update.isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
