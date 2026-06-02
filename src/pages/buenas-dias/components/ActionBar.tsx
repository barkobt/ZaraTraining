import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Check, Lock, Unlock, ChevronUp, AlertCircle, FileDown } from "lucide-react";
import { exportBuenasDiasPdf, type PdfPayload } from "@/lib/buenas-dias/pdf";

/**
 * Durum zinciri aksiyon barı + akşam setActuals bloğu (spec §3.5 + §4.2).
 *
 * Status'a göre uygun aksiyon görünür:
 *   TASLAK       → Onayla
 *   ONAYLANDI    → Onayı Geri Al · (setActuals dolduysa) Günü Kapat
 *   GERCEKLESTI  → Yeniden Aç
 *
 * Akşam setActuals formu yalnızca ONAYLANDI'da açılır.
 */
export type ActionBarProps = {
  status: "TASLAK" | "ONAYLANDI" | "GERCEKLESTI";
  date: string;
  hasActuals: boolean;
  onChanged: () => void;
  /** PDF export payload — ONAYLANDI/GERCEKLESTI'de buton göstermek için */
  pdfPayload?: PdfPayload | null;
};

export function ActionBar({ status, date, hasActuals, onChanged, pdfPayload }: ActionBarProps) {
  const approve = trpc.buenasDias.daysMutations.approve.useMutation();
  const unapprove = trpc.buenasDias.daysMutations.unapprove.useMutation();
  const close = trpc.buenasDias.daysMutations.close.useMutation();
  const reopen = trpc.buenasDias.daysMutations.reopen.useMutation();

  const pending = approve.isPending || unapprove.isPending || close.isPending || reopen.isPending;

  // tRPC mutation tipleri her hook için spesifik; helper'ı `unknown` tutup
  // shape'i çağrıda doğrula — bu, dört farklı mutation arasında ortak yardımcı sağlar.
  function run(mut: { mutate: (i: { date: string }, opts: { onSuccess: () => void; onError: (err: { message: string }) => void }) => void }) {
    mut.mutate(
      { date },
      {
        onSuccess: () => onChanged(),
        onError: (e) => alert(e.message),
      },
    );
  }

  return (
    <div className="panel p-3 flex flex-wrap items-center gap-2 sticky top-0 z-10">
      <div className="mr-2" style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--zara-ink-50)" }}>Durum:</div>

      {status === "TASLAK" && (
        <button
          onClick={() => run(approve)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Onayla
        </button>
      )}

      {status === "ONAYLANDI" && (
        <>
          <button
            onClick={() => run(unapprove)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded hover:bg-paper-warm disabled:opacity-50"
          >
            <Unlock className="h-4 w-4" />
            Onayı Geri Al
          </button>
          <button
            onClick={() => run(close)}
            disabled={pending || !hasActuals}
            title={!hasActuals ? "Önce akşam verilerini gir" : "Günü kapat"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white rounded hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--zara-ink)" }}
          >
            <Lock className="h-4 w-4" />
            Günü Kapat
          </button>
        </>
      )}

      {status === "GERCEKLESTI" && (
        <button
          onClick={() => run(reopen)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded hover:bg-paper-warm disabled:opacity-50"
        >
          <ChevronUp className="h-4 w-4" />
          Yeniden Aç
        </button>
      )}

      {/* PDF buton — ONAYLANDI veya GERCEKLESTI iken görünür (spec §6.3). */}
      {(status === "ONAYLANDI" || status === "GERCEKLESTI") && pdfPayload && (
        <button
          onClick={() => exportBuenasDiasPdf(pdfPayload)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded hover:bg-paper-warm"
        >
          <FileDown className="h-4 w-4" />
          PDF İndir
        </button>
      )}

      <div className="ml-auto text-xs text-neutral-400">
        {status === "TASLAK" && "Form düzenlenebilir · hücreler tıklanıp değiştirilir"}
        {status === "ONAYLANDI" && "Form kilitli · akşam aktüellerini gir, sonra kapat"}
        {status === "GERCEKLESTI" && "Gün kapalı · kümülatife yansıyor"}
      </div>
    </div>
  );
}

/**
 * Akşam aktüel veri girişi (spec §4.2).
 * Yalnızca ONAYLANDI durumda görünür; close yapılmadan önce zorunlu alanların
 * dolu olmasını sağlar (totalTl, totalAdet, visit, fis).
 */
export function ActualsForm({
  date,
  initial,
  onChanged,
}: {
  date: string;
  initial: {
    actualTotalAdet: number | null;
    actualTotalTl: number | null;
    actualVisit: number | null;
    actualFis: number | null;
    actualSint: number | null;
    actualGap: number | null;
  };
  onChanged: () => void;
}) {
  const setActuals = trpc.buenasDias.daysMutations.setActuals.useMutation();

  const [totalAdet, setTotalAdet] = useState(initial.actualTotalAdet?.toString() ?? "");
  const [totalTl, setTotalTl] = useState(initial.actualTotalTl?.toString() ?? "");
  const [visit, setVisit] = useState(initial.actualVisit?.toString() ?? "");
  const [fis, setFis] = useState(initial.actualFis?.toString() ?? "");
  const [sint, setSint] = useState(initial.actualSint?.toString() ?? "");
  const [gap, setGap] = useState(initial.actualGap?.toString() ?? "");

  function num(s: string): number | null {
    if (s.trim() === "") return null;
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  function submit() {
    setActuals.mutate(
      {
        date,
        actualTotalAdet: num(totalAdet),
        actualTotalTl: num(totalTl),
        actualVisit: num(visit),
        actualFis: num(fis),
        actualSint: num(sint),
        actualGap: num(gap),
      },
      {
        onSuccess: () => onChanged(),
        onError: (e) => alert(e.message),
      },
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        Akşam — Gerçekleşen Veriler
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Adet *" value={totalAdet} onChange={setTotalAdet} />
        <Field label="TL *" value={totalTl} onChange={setTotalTl} />
        <Field label="Visit *" value={visit} onChange={setVisit} />
        <Field label="Fiş *" value={fis} onChange={setFis} />
        <Field label="Sint (saat)" value={sint} onChange={setSint} />
        <Field label="Gap" value={gap} onChange={setGap} negative />
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>* zorunlu — Günü Kapat butonu için dolu olmalı</span>
        <button
          onClick={submit}
          disabled={setActuals.isPending}
          className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
        >
          {setActuals.isPending ? "Kaydediliyor…" : "Aktüelleri Kaydet"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  negative,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  negative?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <input
        type="text"
        inputMode={negative ? "text" : "numeric"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-neutral-500"
        placeholder="—"
      />
    </label>
  );
}
