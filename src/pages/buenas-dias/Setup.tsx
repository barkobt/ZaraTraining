import { useEffect, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";

/**
 * Buenas Dias Setup ekranı (spec §4.3).
 *
 * Üç panel:
 *   1. Mağaza ayarları (compran/gap/productivity hedefleri, stretch, hava katsayıları)
 *   2. Aylık challenge (tier1, tarih aralığı, avgBasket)
 *   3. Özel günler (CRUD listesi)
 *
 * Yönetici ekranı — Faz 5'in temel girişi. UI sade, formlar dağınık olmasın diye
 * her panel kendi başına submit eder.
 */
export default function BuenasDiasSetup() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link to="/buenas-dias" className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Buenas Dias
          </Link>
          <div className="text-xs text-neutral-500">Setup</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <SettingsPanel />
        <ChallengePanel />
        <SpecialDaysPanel />
      </main>
    </div>
  );
}

// ─── 1. Settings ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const settingsQuery = trpc.buenasDias.settings.get.useQuery();
  const update = trpc.buenasDias.settings.update.useMutation();

  const [compran, setCompran] = useState("");
  const [gap, setGap] = useState("");
  const [prod, setProd] = useState("");
  const [stretch, setStretch] = useState("");
  const [weekendWeight, setWeekendWeight] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!settingsQuery.data) return;
    setCompran(String(settingsQuery.data.compranTarget));
    setGap(String(settingsQuery.data.gapTarget));
    setProd(String(settingsQuery.data.productivityTarget));
    setStretch(String(settingsQuery.data.defaultStretch));
    setWeekendWeight(String(settingsQuery.data.weekendWeight));
    setCity(settingsQuery.data.city);
  }, [settingsQuery.data]);

  function submit() {
    update.mutate(
      {
        compranTarget: parseFloat(compran),
        gapTarget: parseFloat(gap),
        productivityTarget: parseFloat(prod),
        defaultStretch: parseFloat(stretch),
        weekendWeight: parseFloat(weekendWeight),
        city,
      },
      { onSuccess: () => settingsQuery.refetch() },
    );
  }

  return (
    <Card title="Mağaza Ayarları">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Compran Hedef (oran 0–1)" value={compran} onChange={setCompran} />
        <Field label="Gap Hedef" value={gap} onChange={setGap} />
        <Field label="Productivity Hedef" value={prod} onChange={setProd} />
        <Field label="Stretch (örn. 0.03 = %3)" value={stretch} onChange={setStretch} />
        <Field label="Haftasonu Ağırlığı" value={weekendWeight} onChange={setWeekendWeight} />
        <Field label="Şehir (hava durumu için)" value={city} onChange={setCity} text />
      </div>
      <SaveButton onClick={submit} pending={update.isPending} />
    </Card>
  );
}

// ─── 2. Challenge ────────────────────────────────────────────────────────────

function ChallengePanel() {
  const list = trpc.buenasDias.challenges.list.useQuery();
  const upsert = trpc.buenasDias.challenges.upsert.useMutation();

  const todayMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(todayMonth);
  const [tier1, setTier1] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [avgBasket, setAvgBasket] = useState("");

  // Seçili ay için mevcut challenge'ı doldur.
  useEffect(() => {
    const c = list.data?.find((x) => x.month === month);
    if (c) {
      setTier1(String(c.tier1TargetTl));
      setStartDate(c.startDate);
      setEndDate(c.endDate);
      setAvgBasket(c.avgBasketTl != null ? String(c.avgBasketTl) : "");
    } else {
      // Default: ayın ilk ve son günü.
      const [y, m] = month.split("-").map(Number);
      const firstDay = `${month}-01`;
      const lastDay = new Date(y, m, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
      setTier1("");
      setAvgBasket("");
    }
  }, [month, list.data]);

  function submit() {
    upsert.mutate(
      {
        month,
        tier1TargetTl: parseFloat(tier1),
        startDate,
        endDate,
        avgBasketTl: avgBasket ? parseFloat(avgBasket) : null,
      },
      { onSuccess: () => list.refetch() },
    );
  }

  return (
    <Card title="Aylık Challenge">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ay (YYYY-MM)" value={month} onChange={setMonth} text />
        <Field label="Tier 1 TL hedefi" value={tier1} onChange={setTier1} />
        <Field label="Başlangıç tarihi" value={startDate} onChange={setStartDate} text />
        <Field label="Bitiş tarihi" value={endDate} onChange={setEndDate} text />
        <Field label="Ortalama Sepet TL (ops.)" value={avgBasket} onChange={setAvgBasket} />
      </div>
      <p className="text-xs text-neutral-500 mt-1">
        Tier 2 otomatik = Tier 1 × 1.15. Bu kayıt aynı aya yazılırsa üzerine yazılır.
      </p>
      <SaveButton onClick={submit} pending={upsert.isPending} />

      {list.data && list.data.length > 0 && (
        <div className="mt-3 text-xs">
          <div className="text-neutral-500 mb-1">Mevcut challenge'lar:</div>
          <ul className="space-y-0.5 tabular-nums">
            {list.data.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span className="font-medium">{c.month}</span>
                <span>
                  Tier 1: {fmtTl(c.tier1TargetTl)} · Tier 2: {fmtTl(c.tier2TargetTl)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

// ─── 3. SpecialDays ─────────────────────────────────────────────────────────

function SpecialDaysPanel() {
  const list = trpc.buenasDias.specialDays.list.useQuery();
  const upsert = trpc.buenasDias.specialDays.upsert.useMutation();
  const del = trpc.buenasDias.specialDays.delete.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coefficient, setCoefficient] = useState("1.45");

  function startEdit(c: { id: number; name: string; startDate: string; endDate: string; coefficient: number }) {
    setEditingId(c.id);
    setName(c.name);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setCoefficient(String(c.coefficient));
  }

  function reset() {
    setEditingId(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setCoefficient("1.45");
  }

  function submit() {
    upsert.mutate(
      {
        id: editingId ?? undefined,
        name,
        startDate,
        endDate,
        coefficient: parseFloat(coefficient),
      },
      {
        onSuccess: () => {
          list.refetch();
          reset();
        },
      },
    );
  }

  return (
    <Card title="Özel Günler">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ad" value={name} onChange={setName} text />
        <Field label="Katsayı (örn. 1.45)" value={coefficient} onChange={setCoefficient} />
        <Field label="Başlangıç (YYYY-MM-DD)" value={startDate} onChange={setStartDate} text />
        <Field label="Bitiş (YYYY-MM-DD)" value={endDate} onChange={setEndDate} text />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={submit}
          disabled={upsert.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? "Güncelle" : "Ekle"}
        </button>
        {editingId && (
          <button onClick={reset} className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900">
            İptal
          </button>
        )}
      </div>

      <div className="mt-4 border-t pt-3">
        {list.data && list.data.length > 0 ? (
          <ul className="text-sm space-y-1 tabular-nums">
            {list.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-1 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-xs text-neutral-500">
                    {c.startDate}{c.endDate !== c.startDate ? ` → ${c.endDate}` : ""} · ×{c.coefficient.toFixed(2)}
                  </span>
                </div>
                <button onClick={() => startEdit(c)} className="text-xs text-neutral-600 hover:text-neutral-900">
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    if (confirm(`'${c.name}' silinsin mi?`))
                      del.mutate({ id: c.id }, { onSuccess: () => list.refetch() });
                  }}
                  className="text-rose-600 hover:text-rose-700"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-neutral-500 italic">Henüz özel gün yok.</div>
        )}
      </div>
    </Card>
  );
}

// ─── Yardımcı UI ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-semibold tracking-wider text-neutral-700 uppercase">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  text,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  text?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <input
        type="text"
        inputMode={text ? "text" : "numeric"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-neutral-500"
      />
    </label>
  );
}

function SaveButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <div className="flex justify-end mt-2">
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}

function fmtTl(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} M TL`;
  return `${n.toLocaleString("tr-TR")} TL`;
}
