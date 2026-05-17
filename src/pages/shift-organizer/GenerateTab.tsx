import { useMemo, useState, useRef } from "react";
import { Loader2, Upload, FileText } from "lucide-react";
import type { StaffRow } from "./constants";
import { ChartResult, type GenerateResult } from "./ChartResult";
import { exportChartToExcel } from "./excel-export";
import { parseShiftsFromPdf, parseShiftsFromText, type ParsedShift } from "./pdf-parser";

export type ShiftInput = {
  short_name: string;
  start_hour: number;
  end_hour: number;
  breaks: Array<[number, number]>;
};

type GenerateMutation = {
  mutate: (input: { shiftDate: string; hours: number[]; shifts: ShiftInput[] }) => void;
  isPending: boolean;
  data: GenerateResult | undefined;
  error: { message: string } | null;
};

export function GenerateTab({
  staff,
  generate,
}: {
  staff: StaffRow[];
  generate: GenerateMutation;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(today);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(21);
  const [shiftsState, setShiftsState] = useState<Record<number, { start: number; end: number; included: boolean }>>(
    () => {
      const m: Record<number, { start: number; end: number; included: boolean }> = {};
      for (const s of staff) m[s.id] = { start: 10, end: 21, included: true };
      return m;
    },
  );
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-sync when staff loads/changes
  useMemo(() => {
    setShiftsState((prev) => {
      const next = { ...prev };
      for (const s of staff) {
        if (!next[s.id]) next[s.id] = { start: startHour, end: endHour, included: true };
      }
      return next;
    });
  }, [staff, startHour, endHour]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h++) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  const applyParsed = (parsed: ParsedShift[]) => {
    if (parsed.length === 0) return;
    setShiftsState((prev) => {
      const next = { ...prev };
      // Reset all included → false; only matched ones become true
      for (const id of Object.keys(next)) {
        next[Number(id)].included = false;
      }
      let minStart = 24;
      let maxEnd = 0;
      for (const p of parsed) {
        const target = staff.find(
          (s) =>
            s.shortName.toLowerCase() === p.name.toLowerCase() ||
            s.fullName.toLowerCase().includes(p.name.toLowerCase()),
        );
        if (!target) continue;
        next[target.id] = { start: p.startHour, end: p.endHour, included: true };
        minStart = Math.min(minStart, p.startHour);
        maxEnd = Math.max(maxEnd, p.endHour);
      }
      if (minStart < 24) setStartHour(minStart);
      if (maxEnd > 0) setEndHour(maxEnd);
      return next;
    });
  };

  const onPdfUpload = async (file: File) => {
    setPdfError(null);
    try {
      const parsed = await parseShiftsFromPdf(file);
      if (parsed.length === 0) {
        setPdfError(
          "PDF okundu ama vardiya satırı bulunamadı. Aşağıdan metni yapıştırmayı dene.",
        );
        return;
      }
      applyParsed(parsed);
    } catch (err) {
      setPdfError(`PDF parse hatası: ${(err as Error).message}`);
    }
  };

  const onPasteParse = () => {
    setPdfError(null);
    const parsed = parseShiftsFromText(pasteText);
    if (parsed.length === 0) {
      setPdfError("Metinden vardiya çıkarılamadı.");
      return;
    }
    applyParsed(parsed);
    setShowPaste(false);
    setPasteText("");
  };

  const onSubmit = () => {
    const shifts: ShiftInput[] = staff
      .filter((s) => shiftsState[s.id]?.included)
      .map((s) => ({
        short_name: s.shortName,
        start_hour: shiftsState[s.id].start,
        end_hour: shiftsState[s.id].end,
        breaks: [],
      }));
    generate.mutate({ shiftDate, hours, shifts });
  };

  const includedCount = staff.filter((s) => shiftsState[s.id]?.included).length;

  return (
    <div className="space-y-6">
      <div className="border border-stone-300 p-8">
        <h3 className="text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Chart Üretimi
        </h3>
        <p className="text-sm text-stone-500 mb-6">
          Tarih, açılış-kapanış ve dahil olacak personel vardiyalarını gir. Çözüm CP-SAT
          ile bulunur.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500">
              Vardiyalar ({includedCount}/{staff.length})
            </div>
            <div className="flex gap-2">
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

          {showPaste && (
            <div className="mb-3 border border-stone-300 p-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Her satıra: 'Baran 10:00-19:00' veya 'Pelin 10 19'"
                rows={5}
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {staff.map((p) => {
              const row = shiftsState[p.id] ?? { start: startHour, end: endHour, included: true };
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 border px-2 py-1.5 ${
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
                  <span className="text-xs flex-1">{p.shortName}</span>
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
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={generate.isPending || includedCount === 0}
          className="w-full bg-black text-white py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generate.isPending && <Loader2 className="animate-spin" size={14} />}
          {generate.isPending ? "Çözüm aranıyor…" : "Çöz"}
        </button>

        {generate.error && (
          <div className="mt-3 border border-red-400 bg-red-50 p-3 text-xs text-red-700">
            {generate.error.message}
          </div>
        )}
      </div>

      {generate.data && (
        <ChartResult
          result={generate.data}
          onExportExcel={() => exportChartToExcel(generate.data!, shiftDate)}
        />
      )}
    </div>
  );
}
