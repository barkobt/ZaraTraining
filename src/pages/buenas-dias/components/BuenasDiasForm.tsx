import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../api/_lib/router";
import {
  REYON,
  URUN_GRUBU,
  type Reyon,
  type UrunGrubu,
  type ReyonGrid,
} from "@contracts/buenas-dias";
import type { RefShape } from "../Today";

/**
 * Buenas Dias formu — spec §6.1'in 7 bloku.
 *
 * Faz 4a: salt-okunur render. Mevcut basılı forma layout olarak yaklaşır
 * (BUENOS DIAS MEETING başlığı + MAĞAZA HEDEF + REYON HEDEF + CHALLENGE +
 * SORUMLULAR + DEAR TEAM / GÜNÜN SÖZÜ).
 *
 * Spec §6.2: her hedef hücresi 3 şey gösterir — hedef (büyük) + kıyas (gri)
 * + renk (hedef > ref yeşil, < kırmızı, = nötr). UI renkleri Tailwind ile.
 *
 * Faz 4b: inline-edit alanları (TASLAK iken). Faz 4c: PDF export.
 */

// tRPC çıktı tipleri — router'a sıkı bağlı, refactor güvenli.
type RouterOutput = inferRouterOutputs<AppRouter>;
type Day = NonNullable<RouterOutput["buenasDias"]["days"]["getByDate"]>;
type ChallengeStatus = RouterOutput["buenasDias"]["challenge"]["status"];
type Derived = RouterOutput["buenasDias"]["days"]["derived"];
type WeatherData = RouterOutput["buenasDias"]["weather"]["today"];
type Settings = RouterOutput["buenasDias"]["settings"]["get"];

export type BuenasDiasFormProps = {
  day: Day;
  challenge: ChallengeStatus | undefined;
  derived: Derived | undefined;
  weather: WeatherData | undefined;
  settings: Settings | undefined;
  today: string;
  // Faz 4b: TASLAK durumda inline-edit.
  editable: boolean;
  draftRef: RefShape | null;
  draftPlannedSint: number | null;
  onReyonRefChange: (r: Reyon, u: UrunGrubu, value: number) => void;
  onPlannedSintChange: (value: number | null) => void;
};

export function BuenasDiasForm({
  day,
  challenge,
  derived,
  weather,
  settings,
  today,
  editable,
  draftRef,
  draftPlannedSint,
  onReyonRefChange,
  onPlannedSintChange,
}: BuenasDiasFormProps) {
  const status = day.status as "TASLAK" | "ONAYLANDI" | "GERCEKLESTI";

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* 1. Başlık */}
      <div className="bg-neutral-900 text-white py-3 text-center text-sm font-semibold tracking-widest">
        BUENOS DIAS MEETING · {formatTrDate(today)}
      </div>

      {/* Status badge */}
      <div className="px-4 py-2 border-b flex items-center justify-between text-xs">
        <StatusBadge status={status} />
        <div className="text-neutral-500">storeId={day.storeId} · {day.dayType}</div>
      </div>

      {/* 2. Bağlam şeridi */}
      <ContextStrip day={day} weather={weather} settings={settings} />

      {/* 3. Mağaza hedefi */}
      <SectionHeader title="MAĞAZA HEDEF" />
      <StoreTargetsBlock
        derived={derived}
        day={day}
        settings={settings}
        editable={editable}
        draftPlannedSint={draftPlannedSint}
        onPlannedSintChange={onPlannedSintChange}
      />

      {/* 4. Reyon hedefi + IPOD */}
      <SectionHeader
        title={editable ? "REYON HEDEF · ref hücrelerini tıkla düzenle" : "REYON HEDEF"}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-neutral-100">
        <div className="md:col-span-2 bg-white p-3">
          <ReyonTable
            target={(day.targetReyon as ReyonGrid | null) ?? null}
            refGrid={
              // Editable modda lokal draftRef öncelikli; DB değerinin gecikmesini bekleme.
              editable && draftRef ? draftRef.reyon : ((day.refReyon as ReyonGrid | null) ?? null)
            }
            targetTotalAdet={day.targetTotalAdet}
            editable={editable}
            onReyonRefChange={onReyonRefChange}
          />
        </div>
        <div className="bg-white p-3">
          <IpodTable target={day.targetIpod as IpodGrid | null} />
        </div>
      </div>

      {/* 5. Challenge paneli */}
      <SectionHeader title="CHALLENGE" />
      <ChallengePanel challenge={challenge} />

      {/* 6. Sorumlular */}
      <SectionHeader title="SORUMLULAR" />
      <ResponsibilitiesBlock />

      {/* 7. Dear Team + Günün Sözü */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-100 border-t">
        <FreeTextBlock title="DEAR TEAM KONUSU" content={day.dearTeamKonusu} />
        <FreeTextBlock title="GÜNÜN SÖZÜ" content={day.gununSozu} italic />
      </div>
    </div>
  );
}

// ─── Alt bileşenler ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "TASLAK" | "ONAYLANDI" | "GERCEKLESTI" }) {
  const map = {
    TASLAK: { label: "TASLAK", color: "bg-amber-100 text-amber-800 border-amber-200" },
    ONAYLANDI: {
      label: "ONAYLANDI",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    GERCEKLESTI: {
      label: "GERÇEKLEŞTİ",
      color: "bg-neutral-200 text-neutral-700 border-neutral-300",
    },
  };
  const cfg = map[status];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ContextStrip({
  day,
  weather,
  settings,
}: {
  day: NonNullable<Day>;
  weather: WeatherData | undefined;
  settings: Settings | undefined;
}) {
  const dayName = new Date(day.date + "T00:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
  });
  const weatherIcon = day.weather === "sunny" ? "☀️" : day.weather === "bad" ? "🌧️" : "⛅";
  const weatherLabel =
    day.weather === "sunny" ? "Açık (×1.15)" : day.weather === "bad" ? "Kötü (×0.85)" : "Normal (×1.00)";
  const stretch = settings ? `+%${Math.round(settings.defaultStretch * 100)}` : "+%3";

  return (
    <div className="px-4 py-2 border-b bg-neutral-50 text-xs text-neutral-700 flex flex-wrap gap-x-4 gap-y-1">
      <span>📅 {capitalize(dayName)}</span>
      <span>
        {weatherIcon} {weatherLabel}
        {weather?.temperatureC != null ? ` · ${weather.temperatureC.toFixed(1)}°C` : ""}
      </span>
      <span>{day.isSpecialDay ? "🎉 Özel gün" : "Özel gün yok"}</span>
      <span>stretch {stretch}</span>
      {weather?.source === "fallback" && (
        <span className="text-amber-700">⚠ hava fallback</span>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-t border-b bg-neutral-100 px-4 py-1.5 text-xs font-semibold tracking-widest text-neutral-700">
      {title}
    </div>
  );
}

function StoreTargetsBlock({
  derived,
  day,
  settings,
  editable,
  draftPlannedSint,
  onPlannedSintChange,
}: {
  derived: Derived | undefined;
  day: NonNullable<Day>;
  settings: Settings | undefined;
  editable: boolean;
  draftPlannedSint: number | null;
  onPlannedSintChange: (v: number | null) => void;
}) {
  // Beklenen prod — taslak plannedSint geldiyse onu kullan (kaydedilmemiş değişimi yansıt).
  const effectivePlanned = editable ? draftPlannedSint : day.plannedSint;
  const productivityBeklenen =
    day.targetTotalAdet != null && effectivePlanned != null && effectivePlanned > 0
      ? day.targetTotalAdet / effectivePlanned
      : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-100">
      <KPI
        label="Compran Hedef"
        value={settings ? pct(settings.compranTarget) : "—"}
      />
      <KPI
        label="Compran Oranı"
        value={derived?.compran.actual != null ? pct(derived.compran.actual) : "—"}
        status={derived?.compran.status}
      />
      <KPI label="Gap (Adet)" value={day.actualGap != null ? day.actualGap.toFixed(1) : "—"} status={derived?.gap.status} />
      <KPI label="Productivity Hedef" value={settings ? settings.productivityTarget.toFixed(2) : "—"} />
      <KPI
        label="Gerçekleşen Prod."
        value={derived?.productivity.actual != null ? derived.productivity.actual.toFixed(2) : "—"}
        status={derived?.productivity.status}
      />
      <KPI
        label="Beklenen Prod."
        value={productivityBeklenen != null ? productivityBeklenen.toFixed(2) : "—"}
      />
      <KPI
        label="Planlanan Sint"
        value={effectivePlanned != null ? effectivePlanned.toFixed(0) : "—"}
        editable={editable}
        editValue={effectivePlanned ?? 0}
        onEdit={(v) => onPlannedSintChange(v > 0 ? v : null)}
      />
      <KPI label="Gerçekleşen Sint" value={day.actualSint != null ? day.actualSint.toFixed(0) : "—"} />
    </div>
  );
}

function KPI({
  label,
  value,
  status,
  editable,
  editValue,
  onEdit,
}: {
  label: string;
  value: string;
  status?: "tutuyor" | "altinda" | "yok";
  editable?: boolean;
  editValue?: number;
  onEdit?: (v: number) => void;
}) {
  const bg =
    status === "tutuyor"
      ? "bg-emerald-50"
      : status === "altinda"
      ? "bg-rose-50"
      : "bg-white";
  return (
    <div className={`p-3 ${bg}`}>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      {editable && onEdit ? (
        <EditableLargeNumber value={editValue ?? 0} onCommit={onEdit} />
      ) : (
        <div className="text-lg font-medium text-neutral-900 tabular-nums">{value}</div>
      )}
    </div>
  );
}

function EditableLargeNumber({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const n = Number(draft.replace(",", ".").replace(/[^\d.\-]/g, ""));
    const v = Number.isFinite(n) && n >= 0 ? n : 0;
    onCommit(v);
    setDraft(String(v));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-full text-lg font-medium text-neutral-900 tabular-nums bg-transparent outline-none focus:bg-amber-50 px-0.5 rounded"
    />
  );
}

function ReyonTable({
  target,
  refGrid,
  targetTotalAdet,
  editable,
  onReyonRefChange,
}: {
  target: ReyonGrid | null;
  refGrid: ReyonGrid | null;
  targetTotalAdet: number | null;
  editable: boolean;
  onReyonRefChange: (r: Reyon, u: UrunGrubu, value: number) => void;
}) {
  const reyonNames: Record<(typeof REYON)[number], string> = {
    kadin: "KADIN",
    erkek: "ERKEK",
    cocuk: "ÇOCUK",
  };
  const urunNames: Record<(typeof URUN_GRUBU)[number], string> = {
    tekstil: "TEKSTİL",
    tempe: "TEMPE",
    parfum: "PARFÜM",
  };

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">HEDEF (UDS)</div>
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-neutral-500 border-b">
            <th className="text-left font-normal py-1"> </th>
            {URUN_GRUBU.map((u) => (
              <th key={u} className="text-right font-normal py-1">
                {urunNames[u]}
              </th>
            ))}
            <th className="text-right font-normal py-1">TOPLAM</th>
          </tr>
        </thead>
        <tbody>
          {REYON.map((r) => {
            const rowSum = target ? URUN_GRUBU.reduce((s, u) => s + (target[r]?.[u] ?? 0), 0) : null;
            return (
              <tr key={r} className="border-b last:border-0">
                <td className="py-1 text-xs font-semibold text-neutral-700">{reyonNames[r]}</td>
                {URUN_GRUBU.map((u) => (
                  <td key={u} className="text-right py-1">
                    <Cell
                      value={target?.[r]?.[u] ?? null}
                      refValue={refGrid?.[r]?.[u] ?? null}
                      editable={editable}
                      onRefCommit={(v) => onReyonRefChange(r, u, v)}
                    />
                  </td>
                ))}
                <td className="text-right py-1 font-medium">{rowSum != null ? fmt(rowSum) : "—"}</td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-neutral-300">
            <td className="py-1 text-xs font-semibold">TOPLAM</td>
            {URUN_GRUBU.map((u) => {
              const colSum = target ? REYON.reduce((s, r) => s + (target[r]?.[u] ?? 0), 0) : null;
              return (
                <td key={u} className="text-right py-1 font-medium">
                  {colSum != null ? fmt(colSum) : "—"}
                </td>
              );
            })}
            <td className="text-right py-1 font-semibold">
              {targetTotalAdet != null ? fmt(targetTotalAdet) : "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  refValue,
  editable,
  onRefCommit,
}: {
  value: number | null;
  refValue: number | null;
  editable: boolean;
  onRefCommit?: (v: number) => void;
}) {
  // Renk: hedef geçen haftadan yüksekse yeşil, düşükse kırmızı.
  let color = "text-neutral-900";
  if (value != null && refValue != null && refValue > 0) {
    if (value > refValue) color = "text-emerald-700";
    else if (value < refValue) color = "text-rose-700";
  }

  return (
    <span className="inline-block">
      <span className={`font-medium ${color}`}>
        {value != null ? fmt(value) : "—"}
      </span>
      {editable && onRefCommit ? (
        <span className="block text-[10px]">
          geçen{" "}
          <EditableNumber
            value={refValue ?? 0}
            onCommit={onRefCommit}
            className="text-neutral-700 underline decoration-dotted underline-offset-2 hover:bg-neutral-100"
          />
        </span>
      ) : refValue != null ? (
        <span className="block text-[10px] text-neutral-400">geçen {fmt(refValue)}</span>
      ) : null}
    </span>
  );
}

/**
 * Inline-edit küçük sayısal input. Tıklayınca odaklı, blur/Enter ile commit.
 * Boş bırakılırsa 0 kabul edilir.
 */
function EditableNumber({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const n = Number(draft.replace(",", ".").replace(/[^\d.\-]/g, ""));
    const v = Number.isFinite(n) && n >= 0 ? n : 0;
    onCommit(v);
    setDraft(String(v));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          setDraft(String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`w-14 text-right text-[10px] tabular-nums bg-transparent outline-none focus:bg-amber-50 px-0.5 ${className ?? ""}`}
    />
  );
}

type IpodGrid = { kadin: number; erkek: number; cocuk: number; kasa: number };

function IpodTable({ target }: { target: IpodGrid | null }) {
  const labels: Array<{ key: keyof IpodGrid; name: string }> = [
    { key: "kadin", name: "KADIN" },
    { key: "erkek", name: "ERKEK" },
    { key: "cocuk", name: "ÇOCUK" },
    { key: "kasa", name: "KASA" },
  ];
  const total = target ? labels.reduce((s, l) => s + (target[l.key] ?? 0), 0) : null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">IPOD HEDEF</div>
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {labels.map((l) => (
            <tr key={l.key} className="border-b last:border-0">
              <td className="py-1 text-xs font-semibold text-neutral-700">{l.name}</td>
              <td className="text-right py-1 font-medium">
                {target ? fmt(target[l.key]) : "—"}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-neutral-300">
            <td className="py-1 text-xs font-semibold">TOPLAM</td>
            <td className="text-right py-1 font-semibold">{total != null ? fmt(total) : "—"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ChallengePanel({ challenge }: { challenge: ChallengeStatus | undefined }) {
  if (!challenge || !challenge.active) {
    return (
      <div className="p-4 text-sm text-neutral-500 italic">
        Bu ay için aktif challenge yok. Setup ekranından bir Challenge tanımla.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-neutral-500">
        {challenge.challenge.month} · Tier 1: {fmtMillion(challenge.challenge.tier1TargetTl)} ·
        Tier 2: {fmtMillion(challenge.challenge.tier2TargetTl)} · Kümülatif:{" "}
        {fmtMillion(challenge.cumulativeTl)}
      </div>
      <TierBar label="CHALLENGE 1 (taban)" tier={challenge.tier1} />
      <TierBar label="CHALLENGE 2 (+%15)" tier={challenge.tier2} />
    </div>
  );
}

type TierData = {
  statusPct: number;
  todayRequiredTl: number;
  todayRequiredAdet: number | null;
  alreadyMet: boolean;
  compare: { status: "tutuyor" | "acik" | "yok"; diff: number | null };
};

function TierBar({ label, tier }: { label: string; tier: TierData }) {
  const t = tier;
  const pctNum = Math.max(0, Math.min(1, t.statusPct));
  const barPct = Math.round(pctNum * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-neutral-700">{label}</span>
        <span className="tabular-nums text-neutral-500">%{barPct}</span>
      </div>
      <div className="h-2 w-full bg-neutral-200 rounded overflow-hidden mb-1">
        <div
          className={`h-full ${t.alreadyMet ? "bg-emerald-500" : "bg-neutral-700"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 tabular-nums">
        <span>Bugün gereken: {fmtMillion(t.todayRequiredTl)}</span>
        {t.todayRequiredAdet != null && (
          <span className="text-neutral-400">≈ {fmt(Math.round(t.todayRequiredAdet))} adet</span>
        )}
        <CompareBadge compare={t.compare} />
      </div>
    </div>
  );
}

function CompareBadge({
  compare,
}: {
  compare: { status: "tutuyor" | "acik" | "yok"; diff: number | null };
}) {
  if (compare.status === "yok")
    return (
      <span className="inline-flex items-center gap-1 text-neutral-400">
        <MinusCircle className="h-3 w-3" /> hedef yok
      </span>
    );
  if (compare.status === "tutuyor")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> tutuyor (+{fmtMillion(compare.diff ?? 0)})
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-amber-700">
      <AlertTriangle className="h-3 w-3" /> açık {fmtMillion(compare.diff ?? 0)}
    </span>
  );
}

function ResponsibilitiesBlock() {
  // Faz 5'te kullanıcılara bağlanacak — şu an statik placeholder.
  const rows = [
    { label: "Adet / Anons", value: "—" },
    { label: "Parfüm", value: "—" },
    { label: "Tempe", value: "—" },
  ];
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="border rounded px-3 py-2 bg-neutral-50">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">{r.label}</div>
          <div className="text-neutral-700">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function FreeTextBlock({
  title,
  content,
  italic,
}: {
  title: string;
  content: string | null;
  italic?: boolean;
}) {
  return (
    <div className="bg-white p-4">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{title}</div>
      <div className={`text-sm text-neutral-800 min-h-[3rem] ${italic ? "italic" : ""}`}>
        {content || <span className="text-neutral-400">—</span>}
      </div>
    </div>
  );
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

function fmtMillion(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M TL`;
  if (Math.abs(n) >= 1_000)
    return `${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}K TL`;
  return `${fmt(n)} TL`;
}

function pct(n: number): string {
  return `%${(n * 100).toFixed(1)}`;
}

function formatTrDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}
