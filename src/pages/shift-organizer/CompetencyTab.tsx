import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crown, Plus, Search, Loader2, ArrowUpDown, Filter, Pencil, X as XIcon,
} from "lucide-react";
import { AREAS, ROLES, STAR_LEVELS, TENURE_LEVELS, type Role, type StaffRow } from "./constants";

type SortKey = "name" | "competency" | "tenure" | "manager";
type SortDir = "asc" | "desc";

export function CompetencyTab(props: {
  loading: boolean;
  staff: StaffRow[];
  onUpdateCompetency: (staffId: number, role: string, level: number) => void;
  onUpdateStaff: (
    id: number,
    patch: Partial<{
      fullName: string;
      shortName: string;
      tenureLevel: string;
      isManager: boolean;
      note: string | null;
      homeArea: string | null;
    }>,
  ) => void;
  onDeleteStaff: (id: number) => void;
  onAddPerson: () => void;
  onEditPerson: (p: StaffRow) => void;
}) {
  const { loading, staff, onUpdateCompetency, onUpdateStaff, onDeleteStaff, onAddPerson, onEditPerson } = props;

  // Search + Sort + Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterTenure, setFilterTenure] = useState<Set<string>>(new Set());
  const [filterManagers, setFilterManagers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Star dropdown — dinamik pozisyon (üst/alt)
  const [editingCell, setEditingCell] = useState<{
    id: number;
    role: Role;
    direction: "down" | "up";
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  /** Bir hücre butonuna basıldığında dropdown'ın yukarı mı aşağı mı açılacağını hesapla. */
  function openCell(person: StaffRow, role: Role, btn: HTMLButtonElement) {
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const NEEDED = 230; // 5 option × ~46px
    setEditingCell({
      id: person.id,
      role,
      direction: spaceBelow < NEEDED ? "up" : "down",
    });
  }

  // ─── Sort + filter pipeline ───
  const filtered = useMemo(() => {
    let arr = staff;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          (p.note ?? "").toLowerCase().includes(q),
      );
    }
    if (filterTenure.size > 0) {
      arr = arr.filter((p) => filterTenure.has(p.tenureLevel));
    }
    if (filterManagers) {
      arr = arr.filter((p) => p.isManager);
    }
    const tenureRank = (t: string) => {
      const idx = TENURE_LEVELS.findIndex((x) => x.id === t);
      return idx < 0 ? 999 : idx;
    };
    const compTotal = (p: StaffRow) =>
      ROLES.reduce((sum, r) => sum + (p.competencies[r] ?? 0), 0);
    const sorted = [...arr].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.fullName.localeCompare(b.fullName, "tr");
          break;
        case "competency":
          cmp = compTotal(a) - compTotal(b);
          break;
        case "tenure":
          cmp = tenureRank(a.tenureLevel) - tenureRank(b.tenureLevel);
          break;
        case "manager":
          cmp = Number(b.isManager) - Number(a.isManager);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [staff, searchTerm, sortKey, sortDir, filterTenure, filterManagers]);

  const stats = useMemo(() => {
    const total = staff.length;
    const veryNew = staff.filter((p) => p.tenureLevel === "NEW_0_1").length;
    const expert = staff.filter((p) => p.tenureLevel === "EXPERT").length;
    const managers = staff.filter((p) => p.isManager).length;
    return { total, veryNew, expert, managers };
  }, [staff]);

  const activeFilterCount =
    filterTenure.size + (filterManagers ? 1 : 0) + (searchTerm.trim() ? 1 : 0);

  function toggleTenure(id: string) {
    const next = new Set(filterTenure);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFilterTenure(next);
  }

  function clearAllFilters() {
    setSearchTerm("");
    setFilterTenure(new Set());
    setFilterManagers(false);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Search + sort + filter + add */}
      <div className="flex flex-col gap-3 py-4 border-y border-stone-300">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <Search size={14} className="text-stone-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Personel ara (ad / kısa ad / not)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-stone-400"
            />
          </div>

          {/* Sort — net yön etiketi ile */}
          <div className="flex items-center gap-2 border border-stone-300 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase">
            <ArrowUpDown size={11} strokeWidth={1.5} className="text-stone-400" />
            <span className="text-stone-500">Sırala:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-transparent outline-none cursor-pointer text-[10px] tracking-[0.15em] uppercase"
            >
              <option value="name">Ad</option>
              <option value="competency">Yetkinlik</option>
              <option value="tenure">Süre</option>
              <option value="manager">Yönetici</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="flex items-center gap-1 text-stone-700 hover:text-black px-2 border-l border-stone-300 ml-1 pl-2"
              title="Sıralama yönü"
            >
              <span className="text-base">{sortDir === "asc" ? "↑" : "↓"}</span>
              <span className="text-[9px]">
                {sortDir === "asc"
                  ? sortKey === "name" || sortKey === "tenure"
                    ? "A → Z"
                    : "Azdan Çoka"
                  : sortKey === "name" || sortKey === "tenure"
                    ? "Z → A"
                    : "Çoktan Aza"}
              </span>
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1 border px-3 py-1 text-[10px] tracking-[0.15em] uppercase ${
              activeFilterCount > 0 ? "border-black bg-stone-100" : "border-stone-300"
            }`}
          >
            <Filter size={11} strokeWidth={1.5} /> Filtrele
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-black text-white rounded-full px-1.5 text-[9px]">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[10px] tracking-[0.15em] uppercase text-stone-500 hover:text-black"
            >
              Temizle
            </button>
          )}

          <button
            onClick={onAddPerson}
            className="bg-black text-white px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 hover:bg-stone-800"
          >
            <Plus size={12} strokeWidth={2} /> Personel Ekle
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-200">
            <span className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mr-2">
              Süre
            </span>
            {TENURE_LEVELS.map((t) => {
              const active = filterTenure.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTenure(t.id)}
                  className={`text-[10px] tracking-wider uppercase border px-2.5 py-1 transition-colors ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-stone-300 hover:border-black"
                  }`}
                  style={!active ? { color: t.color } : undefined}
                >
                  {t.label}
                </button>
              );
            })}
            <span className="w-px h-4 bg-stone-300 mx-2" />
            <button
              onClick={() => setFilterManagers((v) => !v)}
              className={`text-[10px] tracking-wider uppercase border px-2.5 py-1 flex items-center gap-1 transition-colors ${
                filterManagers
                  ? "border-black bg-black text-white"
                  : "border-stone-300 hover:border-black"
              }`}
            >
              <Crown size={10} strokeWidth={1.8} fill={filterManagers ? "currentColor" : "none"} />
              Yöneticiler
            </button>
            <span className="ml-auto text-[10px] text-stone-500">
              {filtered.length} / {staff.length} kayıt
            </span>
          </div>
        )}
      </div>

      {/* Tablo — sticky thead sayfa scroll'una göre kalır (max-h container yok).
          User feedback: "tamamını sabitlemek görsel olarak biraz daha kötü". */}
      <div className="bg-white border border-stone-300 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20">
            <tr style={{ background: "white", boxShadow: "inset 0 -2px 0 #000" }}>
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal" style={{ background: "white" }}>
                Personel
              </th>
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal w-32" style={{ background: "white" }}>
                Süre
              </th>
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal w-36" style={{ background: "white" }}>
                Alan
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                  style={{ background: "white" }}
                >
                  {role}
                </th>
              ))}
              <th className="text-left p-4 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal" style={{ background: "white" }}>
                Not
              </th>
              <th className="w-20" style={{ background: "white" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={ROLES.length + 5} className="p-8 text-center text-stone-400">
                  <Loader2 className="inline-block animate-spin mr-2" size={14} /> Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={ROLES.length + 5} className="p-8 text-center text-stone-400 text-sm">
                  {activeFilterCount > 0
                    ? "Filtreler ile eşleşen personel yok."
                    : "Kayıt yok."}
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
                  <td className="p-4">
                    {/* Alan-bazlı v2: sabit çalışma alanı seçimi. Boş = atanmamış.
                        v1 chart üretimini etkilemez (solver homeArea'yı okumaz). */}
                    <select
                      value={person.homeArea ?? ""}
                      onChange={(e) =>
                        onUpdateStaff(person.id, {
                          homeArea: e.target.value === "" ? null : e.target.value,
                        })
                      }
                      className="text-[11px] py-1 px-2 border border-stone-200 bg-transparent outline-none cursor-pointer rounded-sm"
                      style={{ color: AREAS.find((a) => a.id === person.homeArea)?.color }}
                    >
                      <option value="">—</option>
                      {AREAS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
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
                        {isEditing && (
                          <div
                            ref={dropdownRef}
                            className={`absolute z-30 left-1/2 -translate-x-1/2 ${
                              editingCell.direction === "up"
                                ? "bottom-full mb-1"
                                : "top-full mt-1"
                            } bg-white border-2 border-black flex flex-col shadow-xl`}
                          >
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
                        )}
                        <button
                          onClick={(e) => openCell(person, role, e.currentTarget)}
                          className={`w-full py-2 text-sm hover:bg-stone-100 transition-colors ${
                            level === 4 ? "font-bold" : level === 0 ? "text-stone-300" : ""
                          }`}
                        >
                          {STAR_LEVELS.find((s) => s.value === level)?.label}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-4 text-[11px] text-stone-500 max-w-[160px] truncate" title={person.note ?? ""}>
                    {person.note ?? ""}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditPerson(person)}
                        className="text-stone-400 hover:text-black p-1"
                        title="Düzenle"
                      >
                        <Pencil size={12} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${person.fullName} silinsin mi?`)) onDeleteStaff(person.id);
                        }}
                        className="text-stone-300 hover:text-red-600 p-1"
                        title="Sil"
                      >
                        <XIcon size={12} strokeWidth={1.5} />
                      </button>
                    </div>
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
