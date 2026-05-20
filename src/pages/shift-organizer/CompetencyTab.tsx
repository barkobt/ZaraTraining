import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Plus, Search, Loader2 } from "lucide-react";
import { ROLES, STAR_LEVELS, TENURE_LEVELS, type Role, type StaffRow } from "./constants";

export function CompetencyTab(props: {
  loading: boolean;
  staff: StaffRow[];
  onUpdateCompetency: (staffId: number, role: string, level: number) => void;
  onUpdateStaff: (id: number, patch: Partial<{ tenureLevel: string; isManager: boolean; note: string | null }>) => void;
  onDeleteStaff: (id: number) => void;
  onAddPerson: () => void;
}) {
  const { loading, staff, onUpdateCompetency, onUpdateStaff, onDeleteStaff, onAddPerson } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: number; role: Role } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Outside-click → editing cell'i kapat
  useEffect(() => {
    if (!editingCell) return;
    const onPointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEditingCell(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingCell(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [editingCell]);

  const filtered = useMemo(() => {
    if (!searchTerm) return staff;
    const q = searchTerm.toLowerCase();
    return staff.filter(
      (p) => p.fullName.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q),
    );
  }, [staff, searchTerm]);

  const stats = useMemo(() => {
    const total = staff.length;
    const veryNew = staff.filter((p) => p.tenureLevel === "NEW_0_1").length;
    const expert = staff.filter((p) => p.tenureLevel === "EXPERT").length;
    const managers = staff.filter((p) => p.isManager).length;
    return { total, veryNew, expert, managers };
  }, [staff]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-300 border border-stone-300">
        {[
          { label: "Toplam Personel", value: stats.total },
          { label: "Çok Yeni (0–1 ay)", value: stats.veryNew, accent: "#ef4444" },
          { label: "Yetkin", value: stats.expert, accent: "#000" },
          { label: "Yönetici", value: stats.managers },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6">
            <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
              {stat.label}
            </div>
            <div
              className="text-4xl font-light tabular-nums"
              style={{ color: stat.accent || "#000" }}
            >
              {String(stat.value).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 py-4 border-y border-stone-300">
        <div className="flex items-center gap-3 flex-1">
          <Search size={14} className="text-stone-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Personel ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-stone-400"
          />
        </div>
        <button
          onClick={onAddPerson}
          className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 hover:bg-stone-800"
        >
          <Plus size={12} strokeWidth={2} /> Personel Ekle
        </button>
      </div>

      <div className="bg-white border border-stone-300 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal">
                Personel
              </th>
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal w-32">
                Süre
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                >
                  {role}
                </th>
              ))}
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal">
                Not
              </th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={ROLES.length + 4} className="p-8 text-center text-stone-400">
                  <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={ROLES.length + 4} className="p-8 text-center text-stone-400 text-sm">
                  Kayıt yok.
                </td>
              </tr>
            )}
            {filtered.map((person, idx) => {
              const tenure = TENURE_LEVELS.find((t) => t.id === person.tenureLevel);
              return (
                <tr
                  key={person.id}
                  className={`border-b border-stone-200 hover:bg-stone-50 transition-colors ${
                    idx % 2 === 0 ? "" : "bg-stone-50/50"
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateStaff(person.id, { isManager: !person.isManager })}
                        className={person.isManager ? "text-black" : "text-stone-300 hover:text-black"}
                        title={person.isManager ? "Yöneticiyi kaldır" : "Yönetici yap"}
                      >
                        <Crown
                          size={12}
                          strokeWidth={2}
                          fill={person.isManager ? "currentColor" : "none"}
                        />
                      </button>
                      <div>
                        <div className="text-sm">{person.fullName}</div>
                        <div className="text-[10px] tracking-wider text-stone-400 uppercase">
                          {person.shortName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={person.tenureLevel}
                      onChange={(e) => onUpdateStaff(person.id, { tenureLevel: e.target.value })}
                      className="text-[11px] py-1 px-2 border-0 bg-transparent outline-none cursor-pointer"
                      style={{ color: tenure?.color }}
                    >
                      {TENURE_LEVELS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  {ROLES.map((role) => {
                    const level = person.competencies[role] ?? 0;
                    const isEditing =
                      editingCell?.id === person.id && editingCell?.role === role;
                    return (
                      <td key={role} className="p-2 text-center relative">
                        {isEditing ? (
                          <div ref={dropdownRef} className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-1 bg-white border-2 border-black flex flex-col shadow-xl">
                            {STAR_LEVELS.map((s) => (
                              <button
                                key={s.value}
                                onClick={() => {
                                  onUpdateCompetency(person.id, role, s.value);
                                  setEditingCell(null);
                                }}
                                className={`px-4 py-2 text-sm hover:bg-stone-100 whitespace-nowrap text-left ${
                                  level === s.value ? "bg-stone-100 font-bold" : ""
                                }`}
                              >
                                <span className="inline-block w-12">{s.label}</span>
                                <span className="text-[10px] text-stone-500 ml-2">{s.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCell({ id: person.id, role })}
                            className={`w-full py-2 text-sm hover:bg-stone-100 transition-colors ${
                              level === 4 ? "font-bold" : level === 0 ? "text-stone-300" : ""
                            }`}
                          >
                            {STAR_LEVELS.find((s) => s.value === level)?.label}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-[11px] text-stone-500">{person.note ?? ""}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`${person.fullName} silinsin mi?`)) onDeleteStaff(person.id);
                      }}
                      className="text-stone-300 hover:text-red-600 text-xs"
                      title="Sil"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
