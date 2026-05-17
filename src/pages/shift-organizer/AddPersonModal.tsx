import { useState } from "react";
import { Crown, X } from "lucide-react";
import { TENURE_LEVELS } from "./constants";

export function AddPersonModal(props: {
  onClose: () => void;
  onCreate: (data: {
    fullName: string;
    shortName: string;
    tenureLevel: string;
    isManager: boolean;
    note: string | null;
  }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [tenure, setTenure] = useState("NEW_0_1");
  const [isManager, setIsManager] = useState(false);
  const [note, setNote] = useState("");

  const canSubmit = name.trim() && short.trim();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-white border-2 border-black p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            Yeni Personel
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
                props.onCreate({
                  fullName: name.trim(),
                  shortName: short.trim(),
                  tenureLevel: tenure,
                  isManager,
                  note: note.trim() || null,
                })
              }
              className="flex-1 bg-black text-white py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              {props.pending ? "Ekleniyor…" : "Ekle"}
            </button>
          </div>
        </div>
      </div>
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
