import { useMemo, useState, useRef } from "react";
import { Loader2, Upload, FileText } from "lucide-react";
import { staffLabel, type StaffRow } from "./constants";
import { ChartResult, type GenerateResult } from "./ChartResult";
import { exportChartToExcel } from "./excel-export";
import { exportChartToPdf } from "./pdf-export";
import {
  parseShiftsFromPdfWithReport,
  parseShiftsFromTextWithReport,
  type ParsedShift,
  type ParseReport,
} from "./pdf-parser";

export type ShiftInput = {
  short_name: string;
  start_hour: number;
  end_hour: number;
  breaks: Array<[number, number]>;
  /** Blocking task'lar: [(saat, 'HR'|'TR'|'ISG')]. Bu saatlerde kişi chart'ta görünmez. */
  tasks: Array<[number, string]>;
};

/** Float saati "HH:MM" stringine çevirir: 13.5 → "13:30". */
function formatHourLabel(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${mm === 30 ? "30" : "00"}`;
}

/** Mola label: tam ve yarım mola için range göster — "17:00–18:00", "17:30–18:00". */
function formatBreakLabel(start: number, end: number): string {
  return `${formatHourLabel(start)}–${formatHourLabel(end)}`;
}

/**
 * Mola chip picker — dikey 2 satır:
 *   üst: chip pill listesi (var olan molalar; × ile silinir)
 *   alt: saat + dakika + süre dropdown + "+ Ekle" buton
 * Chip format range — "17:00–17:30" — ½ symbol yok, format kendisi anlatır.
 */
function BreakChipPicker({
  breaks,
  onChange,
  disabled,
}: {
  breaks: Array<[number, number]>;
  onChange: (b: Array<[number, number]>) => void;
  disabled?: boolean;
}) {
  const [hour, setHour] = useState(13);
  const [minute, setMinute] = useState<0 | 30>(0);
  const [duration, setDuration] = useState<0.5 | 1>(1);
  const add = () => {
    const start = hour + minute / 60;
    const end = start + duration;
    if (breaks.some(([s]) => Math.abs(s - start) < 0.01)) return;
    const next = [...breaks, [start, end] as [number, number]].sort((a, b) => a[0] - b[0]);
    onChange(next);
  };
  const remove = (idx: number) => onChange(breaks.filter((_, i) => i !== idx));
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      {breaks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {breaks.map(([s, e], i) => {
            const half = e - s <= 0.5 + 1e-6;
            return (
              <span
                key={`${s}-${i}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums shadow-sm border ${
                  half
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-amber-50 border-amber-300 text-amber-800"
                }`}
                title={half ? "Yarım mola" : "Tam mola"}
              >
                {formatBreakLabel(s, e)}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={disabled}
                  className="text-amber-700 hover:text-rose-700 leading-none disabled:opacity-50"
                  aria-label="Mola sil"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      {!disabled && (
        <div className="flex items-center gap-1 text-[10px]">
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            disabled={disabled}
            className="text-[10px] bg-transparent border-b border-stone-300 outline-none focus:border-amber-600 px-0.5 font-mono"
            aria-label="Saat"
          >
            {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
            ))}
          </select>
          <span className="text-stone-400">:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value) as 0 | 30)}
            disabled={disabled}
            className="text-[10px] bg-transparent border-b border-stone-300 outline-none focus:border-amber-600 px-0.5 font-mono"
            aria-label="Dakika"
          >
            <option value={0}>00</option>
            <option value={30}>30</option>
          </select>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as 0.5 | 1)}
            disabled={disabled}
            className="text-[10px] bg-transparent border-b border-stone-300 outline-none focus:border-amber-600 px-0.5"
            aria-label="Süre"
          >
            <option value={1}>1 saat</option>
            <option value={0.5}>30dk</option>
          </select>
          <button
            type="button"
            onClick={add}
            disabled={disabled}
            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-50 disabled:opacity-50 transition-colors"
          >
            + Mola
          </button>
        </div>
      )}
    </div>
  );
}

type GenerateMutation = {
  mutate: (input: { shiftDate: string; hours: number[]; shifts: ShiftInput[] }) => void;
  isPending: boolean;
  data: GenerateResult | undefined;
  error: {
    message: string;
    data?: {
      zodError?: {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      } | null;
    };
  } | null;
};

/** TRPC ZodError'dan kullanıcı-dostu TR mesaj çıkartır. */
function formatGenerateError(err: GenerateMutation["error"]): string {
  if (!err) return "";
  const zod = err.data?.zodError?.fieldErrors;
  if (zod && Object.keys(zod).length > 0) {
    const lines: string[] = [];
    for (const [field, msgs] of Object.entries(zod)) {
      if (Array.isArray(msgs) && msgs.length > 0) lines.push(`${field}: ${msgs[0]}`);
    }
    if (lines.length > 0) return lines.join(" · ");
  }
  const formErrors = err.data?.zodError?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length > 0) {
    return formErrors.join(" · ");
  }
  // Safari WebKit JSON.parse plaintext (Vercel timeout response) →
  // "The string did not match the expected pattern." der.
  // Chrome'da JSON.parse hatası → "Unexpected token..." der.
  // Bu pattern'i tespit edip kullanıcıya zaman aşımı mesajı veriyoruz.
  const m = err.message ?? "";
  if (
    /did not match the expected pattern/i.test(m) ||
    /Unexpected token .* is not valid JSON/i.test(m) ||
    /FUNCTION_INVOCATION_TIMEOUT/i.test(m)
  ) {
    return "Çözüm zaman aşımına uğradı (60s+). Daha az personel ile dene veya tekrar dene.";
  }
  if (/Failed to fetch|NetworkError|aborted/i.test(m)) {
    return "Ağ hatası: bağlantı koptu. Sayfayı yenile ve tekrar dene.";
  }
  return m;
}

export function GenerateTab({
  staff,
  generate,
}: {
  staff: StaffRow[];
  generate: GenerateMutation;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(today);
  // Chart saatleri sabit: mağaza 10:00 açılır, 22:00 kapanır → chart 10-21 (11 slot).
  // 7-10 arası operasyonel hazırlık (kabin açılışı vb.) — chart'a girmez.
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(22);
  const [shiftsState, setShiftsState] = useState<
    Record<
      number,
      {
        start: number;
        end: number;
        included: boolean;
        breaks: Array<[number, number]>;
        tasks: Array<[number, string]>;
        soft_tasks: Array<{ hour: number | null; label: string }>;
      }
    >
  >(() => {
    const m: Record<
      number,
      {
        start: number;
        end: number;
        included: boolean;
        breaks: Array<[number, number]>;
        tasks: Array<[number, string]>;
        soft_tasks: Array<{ hour: number | null; label: string }>;
      }
    > = {};
    for (const s of staff) m[s.id] = { start: 10, end: 22, included: true, breaks: [], tasks: [], soft_tasks: [] };
    return m;
  });
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [parseReport, setParseReport] = useState<ParseReport | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Chart altına basılan opsiyonel günlük bilgiler — chart1.pdf paritesi.
  const [altInfo, setAltInfo] = useState({
    aksiyon: "",
    cxQr: "",
    ipod: "",
    tempe: "",
    istek: "",
  });

  // Re-sync when staff loads/changes
  useMemo(() => {
    setShiftsState((prev) => {
      const next = { ...prev };
      for (const s of staff) {
        if (!next[s.id])
          next[s.id] = { start: startHour, end: endHour, included: true, breaks: [], tasks: [], soft_tasks: [] };
      }
      return next;
    });
  }, [staff, startHour, endHour]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h++) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  function matchStaff(name: string) {
    const n = name.toLowerCase().trim();
    // 1) tam shortName eşleşmesi
    let target = staff.find((s) => s.shortName.toLowerCase() === n);
    if (target) return target;
    // 2) tam fullName eşleşmesi
    target = staff.find((s) => s.fullName.toLowerCase() === n);
    if (target) return target;
    // 3) fullName içinde geçiyor
    target = staff.find((s) => s.fullName.toLowerCase().includes(n));
    if (target) return target;
    // 4) name içinde shortName geçiyor (örn parser "Pelin Aydin" döndü, db'de "Pelin")
    target = staff.find((s) => n.includes(s.shortName.toLowerCase()));
    return target;
  }

  const applyParsed = (parsed: ParsedShift[]) => {
    const unmatched: string[] = [];
    if (parsed.length === 0) return unmatched;
    setShiftsState((prev) => {
      const next = { ...prev };
      // Reset all included → false; only matched ones become true
      for (const id of Object.keys(next)) {
        next[Number(id)].included = false;
      }
      for (const p of parsed) {
        const target = matchStaff(p.name);
        if (!target) {
          unmatched.push(p.name);
          continue;
        }
        next[target.id] = {
          start: p.startHour,
          end: p.endHour,
          included: true,
          breaks: p.breaks ?? [],
          tasks: (p.tasks ?? []).map((t) => [t.hour, t.type] as [number, string]),
          soft_tasks: p.soft_tasks ?? [],
        };
      }
      return next;
    });
    // NOT: Chart saatleri (startHour/endHour) sabit 10-22 — PDF'teki vardiya
    // saatleri kişi bazında kalır ama chart aralığı kullanıcı kontrolünde.
    return unmatched;
  };

  const onPdfUpload = async (file: File) => {
    setPdfError(null);
    setParseReport(null);
    try {
      const report = await parseShiftsFromPdfWithReport(file);
      // BASIC dışındaki / eşleşmeyen satırların raporunu kullanıcıya göstermiyoruz
      setParseReport({ ...report, skippedSamples: [] });
      if (report.shifts.length === 0) {
        setPdfError(
          `PDF'den vardiya çıkarılamadı. Muhtemel nedenler: (1) PDF'in sütun başlıkları İngilizce değil, (2) "BASIC" bölüm başlığı eksik, (3) saat formatı tanınmadı. Metin yapıştırma seçeneğini dene.`,
        );
        return;
      }
      applyParsed(report.shifts);
    } catch (err) {
      setPdfError(`PDF parse hatası: ${(err as Error).message}`);
    }
  };

  const onPasteParse = () => {
    setPdfError(null);
    setParseReport(null);
    const report = parseShiftsFromTextWithReport(pasteText);
    setParseReport({ ...report, skippedSamples: [] });
    if (report.shifts.length === 0) {
      setPdfError(`Metinden vardiya çıkarılamadı.`);
      return;
    }
    applyParsed(report.shifts);
    setShowPaste(false);
    setPasteText("");
  };

  const onSubmit = () => {
    // Client-side pre-validation — kullanıcıya Zod regex hatası göstermemek için.
    setPdfError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(shiftDate)) {
      setPdfError("Tarih boş veya geçersiz. Lütfen geçerli bir gün seç.");
      return;
    }
    if (hours.length === 0) {
      setPdfError("Açılış saati kapanıştan küçük olmalı.");
      return;
    }
    const shifts: ShiftInput[] = staff
      .filter((s) => shiftsState[s.id]?.included)
      .map((s) => ({
        short_name: s.shortName,
        start_hour: shiftsState[s.id].start,
        end_hour: shiftsState[s.id].end,
        breaks: shiftsState[s.id].breaks ?? [],
        tasks: shiftsState[s.id].tasks ?? [],
      }));
    if (shifts.length === 0) {
      setPdfError("Çözüme dahil en az 1 personel olmalı.");
      return;
    }
    // Personel başına geçersiz saat aralığı?
    const bad = shifts.find((s) => s.start_hour >= s.end_hour);
    if (bad) {
      setPdfError(`${bad.short_name}: başlangıç saati bitişten küçük olmalı.`);
      return;
    }
    generate.mutate({ shiftDate, hours, shifts });
  };

  const includedCount = staff.filter((s) => shiftsState[s.id]?.included).length;

  return (
    <div className="space-y-6">
      <div className="border border-stone-300 p-4 sm:p-6 md:p-8">
        <h3 className="text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Chart Üretimi
        </h3>
        <p className="text-sm text-stone-500 mb-6">
          Tarih, açılış-kapanış ve dahil olacak personel vardiyalarını gir. Çözüm CP-SAT
          ile bulunur.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full border-b border-stone-300 py-2 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-1">
              Açılış (saat)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full border-b border-stone-300 py-2 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-1">
              Kapanış (saat)
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full border-b border-stone-300 py-2 outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="border-t border-stone-200 pt-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500">
              Vardiyalar ({includedCount}/{staff.length})
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPdfUpload(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="border border-stone-300 px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <Upload size={11} strokeWidth={1.5} /> PDF Yükle
              </button>
              <button
                onClick={() => setShowPaste((v) => !v)}
                className="border border-stone-300 px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <FileText size={11} strokeWidth={1.5} /> Metin Yapıştır
              </button>
            </div>
          </div>

          {pdfError && (
            <div className="mb-3 border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
              {pdfError}
            </div>
          )}

          {parseReport && parseReport.shifts.length > 0 && (
            <div className="mb-3 border border-emerald-300 bg-emerald-50 p-2 text-[11px] text-emerald-900">
              BASIC bölümünden <strong>{parseReport.shifts.length}</strong> personel için
              vardiya çıkarıldı.
            </div>
          )}

          {parseReport && parseReport.warnings && parseReport.warnings.length > 0 && (
            <div className="mb-3 border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
              <strong>Parser uyarısı:</strong>
              <ul className="mt-1 list-disc list-inside">
                {parseReport.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {showPaste && (
            <div className="mb-3 border border-stone-300 p-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Her satıra bir vardiya. Desteklenen formatlar:
  Pelin Aydin 10:00-19:00
  Sevim 10:00 - 19:00
  Fatma 10-19
  Sude  10  19
  10:00-19:00 Asya`}
                rows={6}
                className="w-full text-xs border border-stone-200 p-2 outline-none focus:border-black font-mono"
              />
              <button
                onClick={onPasteParse}
                disabled={!pasteText.trim()}
                className="mt-2 bg-black text-white px-4 py-1 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300"
              >
                Parse Et
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {staff.map((p) => {
              const row = shiftsState[p.id] ?? { start: startHour, end: endHour, included: true, breaks: [], tasks: [], soft_tasks: [] };
              return (
                <div
                  key={p.id}
                  className={`flex items-center flex-wrap gap-2 border px-2 py-1.5 overflow-hidden ${
                    row.included ? "border-black bg-white" : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={row.included}
                    onChange={(e) =>
                      setShiftsState((prev) => ({
                        ...prev,
                        [p.id]: { ...row, included: e.target.checked },
                      }))
                    }
                    className="accent-black"
                  />
                  <span className="text-xs flex-1">{staffLabel(p, staff)}</span>
                  <input
                    type="number"
                    value={row.start}
                    onChange={(e) =>
                      setShiftsState((prev) => ({
                        ...prev,
                        [p.id]: { ...row, start: Number(e.target.value) },
                      }))
                    }
                    disabled={!row.included}
                    className="w-10 text-xs border-b border-stone-300 outline-none focus:border-black text-right"
                  />
                  <span className="text-stone-400 text-xs">–</span>
                  <input
                    type="number"
                    value={row.end}
                    onChange={(e) =>
                      setShiftsState((prev) => ({
                        ...prev,
                        [p.id]: { ...row, end: Number(e.target.value) },
                      }))
                    }
                    disabled={!row.included}
                    className="w-10 text-xs border-b border-stone-300 outline-none focus:border-black text-right"
                  />
                  {/* Mola saatleri — chip picker (saat:dakika + süre + Ekle) */}
                  <BreakChipPicker
                    breaks={row.breaks ?? []}
                    onChange={(breaks) =>
                      setShiftsState((prev) => ({
                        ...prev,
                        [p.id]: { ...row, breaks },
                      }))
                    }
                    disabled={!row.included}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Günün Bilgileri (opsiyonel — PDF altına yazılır) ─── */}
        <details className="mt-4 border border-stone-200 bg-stone-50 px-3 py-2">
          <summary className="text-[10px] tracking-[0.2em] uppercase text-stone-600 cursor-pointer select-none">
            Günün Bilgileri <span className="text-stone-400 normal-case tracking-normal">(opsiyonel · PDF altına eklenir)</span>
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">Haftanın aksiyon familyaları</span>
              <input
                type="text"
                placeholder="Pantolon, Bermuda, Elbise, Çanta, Ecobag"
                value={altInfo.aksiyon}
                onChange={(e) => setAltInfo((p) => ({ ...p, aksiyon: e.target.value }))}
                className="text-xs border-b border-stone-300 outline-none focus:border-black bg-transparent py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">CX QR hedefi</span>
              <input
                type="text"
                placeholder="45"
                value={altInfo.cxQr}
                onChange={(e) => setAltInfo((p) => ({ ...p, cxQr: e.target.value }))}
                className="text-xs border-b border-stone-300 outline-none focus:border-black bg-transparent py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">IPOD Satışı sorumlusu</span>
              <input
                type="text"
                placeholder="Meral"
                value={altInfo.ipod}
                onChange={(e) => setAltInfo((p) => ({ ...p, ipod: e.target.value }))}
                className="text-xs border-b border-stone-300 outline-none focus:border-black bg-transparent py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">Tempe / ACC sorumlusu</span>
              <input
                type="text"
                placeholder="Sevim"
                value={altInfo.tempe}
                onChange={(e) => setAltInfo((p) => ({ ...p, tempe: e.target.value }))}
                className="text-xs border-b border-stone-300 outline-none focus:border-black bg-transparent py-1"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">İstek noktası sorumlusu</span>
              <input
                type="text"
                placeholder="Selin"
                value={altInfo.istek}
                onChange={(e) => setAltInfo((p) => ({ ...p, istek: e.target.value }))}
                className="text-xs border-b border-stone-300 outline-none focus:border-black bg-transparent py-1"
              />
            </label>
          </div>
        </details>

        <button
          onClick={onSubmit}
          disabled={generate.isPending || includedCount === 0}
          className="w-full mt-4 bg-black text-white py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generate.isPending && <Loader2 className="animate-spin" size={14} />}
          {generate.isPending ? "Çözüm aranıyor…" : "Çöz"}
        </button>

        {generate.error && (
          <div className="mt-3 border border-red-400 bg-red-50 p-3 text-xs text-red-700">
            <strong>Çözüm başarısız:</strong>{" "}
            {formatGenerateError(generate.error)}
          </div>
        )}
      </div>

      {generate.data && (
        <ChartResult
          result={generate.data}
          staff={staff}
          shifts={staff
            .filter((s) => shiftsState[s.id]?.included)
            .map((s) => ({
              short_name: s.shortName,
              start_hour: shiftsState[s.id].start,
              end_hour: shiftsState[s.id].end,
              breaks: shiftsState[s.id].breaks ?? [],
              tasks: shiftsState[s.id].tasks ?? [],
            }))}
          shiftDate={shiftDate}
          onExportExcel={() =>
            exportChartToExcel(
              generate.data!,
              shiftDate,
              staff
                .filter((s) => shiftsState[s.id]?.included)
                .map((s) => ({
                  short_name: s.shortName,
                  start_hour: shiftsState[s.id].start,
                  end_hour: shiftsState[s.id].end,
                  breaks: shiftsState[s.id].breaks ?? [],
                  tasks: shiftsState[s.id].tasks ?? [],
                })),
            )
          }
          onExportPdf={() =>
            exportChartToPdf(
              generate.data!,
              shiftDate,
              staff
                .filter((s) => shiftsState[s.id]?.included)
                .map((s) => ({
                  short_name: s.shortName,
                  start_hour: shiftsState[s.id].start,
                  end_hour: shiftsState[s.id].end,
                  breaks: shiftsState[s.id].breaks ?? [],
                  tasks: shiftsState[s.id].tasks ?? [],
                })),
              altInfo,
            )
          }
        />
      )}
    </div>
  );
}
