import { useState } from "react";
import { Crown, X } from "lucide-react";
import { TENURE_LEVELS, AREAS, DUTIES, EMPLOYMENTS } from "./constants";

type PersonFormData = {
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  note: string | null;
  // Alan-bazlı v2 pilleri — artık kişi EKLERKEN de set edilebilir (backend hazır).
  // null = atanmamış. Edit modunda initial'dan ön-dolar, veri kaybı olmaz.
  homeArea: string | null;
  duty: string | null;
  employment: string | null;
};

/**
 * Personel ekleme VEYA düzenleme modalı.
 * `initial` verilmişse "Düzenle" başlığıyla mevcut değerlerle açılır.
 * `onSubmit` formdan gelen veriyi alır (create veya update).
 */
export function AddPersonModal(props: {
  onClose: () => void;
  onSubmit: (data: PersonFormData) => void;
  pending: boolean;
  initial?: PersonFormData;
  mode?: "add" | "edit";
}) {
  const isEdit = props.mode === "edit";
  const [name, setName] = useState(props.initial?.fullName ?? "");
  const [short, setShort] = useState(props.initial?.shortName ?? "");
  const [tenure, setTenure] = useState(props.initial?.tenureLevel ?? "NEW_0_1");
  const [isManager, setIsManager] = useState(props.initial?.isManager ?? false);
  const [note, setNote] = useState(props.initial?.note ?? "");
  const [homeArea, setHomeArea] = useState(props.initial?.homeArea ?? "");
  const [duty, setDuty] = useState(props.initial?.duty ?? "");
  const [employment, setEmployment] = useState(props.initial?.employment ?? "");

  const canSubmit = name.trim() && short.trim();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-white border-2 border-black p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg" style={{ fontFamily: "var(--ff-display)" }}>
            {isEdit ? "Personeli Düzenle" : "Yeni Personel"}
          </h3>
          <button onClick={props.onClose} className="text-stone-400 hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Ad Soyad" value={name} onChange={setName} />
          <Field label="Kısa Ad" value={short} onChange={setShort} />
          <div>
            <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
              Yenilik Süresi
            </label>
            <select
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full border border-stone-300 px-3 py-2 outline-none focus:border-black bg-white"
            >
              {TENURE_LEVELS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {/* Alan-bazlı v2 pilleri — opsiyonel; boş bırakılırsa null kaydedilir */}
          <div className="grid grid-cols-3 gap-3">
            <PillSelect
              label="Alan"
              value={homeArea}
              onChange={setHomeArea}
              options={AREAS.map((a) => ({ value: a.id, label: a.label }))}
            />
            <PillSelect
              label="Görev"
              value={duty}
              onChange={setDuty}
              options={DUTIES.map((d) => ({ value: d.id, label: d.label }))}
            />
            <PillSelect
              label="Tip"
              value={employment}
              onChange={setEmployment}
              options={EMPLOYMENTS.map((e) => ({ value: e.id, label: e.label }))}
            />
          </div>
          <Field label="Not" value={note} onChange={setNote} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isManager}
              onChange={(e) => setIsManager(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            <span className="text-sm flex items-center gap-2">
              <Crown size={14} strokeWidth={1.5} /> Yönetici
            </span>
          </label>
          <div className="flex gap-3 pt-4">
            <button
              onClick={props.onClose}
              className="flex-1 border border-black py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-100"
            >
              İptal
            </button>
            <button
              disabled={!canSubmit || props.pending}
              onClick={() =>
                props.onSubmit({
                  fullName: name.trim(),
                  shortName: short.trim(),
                  tenureLevel: tenure,
                  isManager,
                  note: note.trim() || null,
                  homeArea: homeArea || null,
                  duty: duty || null,
                  employment: employment || null,
                })
              }
              className="flex-1 bg-black text-white py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              {props.pending ? "Kaydediliyor…" : isEdit ? "Kaydet" : "Ekle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PillSelect(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
        {props.label}
      </label>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full border border-stone-300 px-2 py-2 text-sm outline-none focus:border-black bg-white"
      >
        <option value="">—</option>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-1">
        {props.label}
      </label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full border-b border-stone-300 py-2 outline-none focus:border-black"
      />
    </div>
  );
}
