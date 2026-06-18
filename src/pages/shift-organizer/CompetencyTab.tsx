import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Crown, Plus, Search, Loader2, ArrowUpDown, Filter, Pencil, X as XIcon, Compass,
} from "lucide-react";
import {
  AREAS, AREA_BY_ID, DUTIES, ROLES, STAR_LEVELS, TENURE_LEVELS,
  withinAreaRank, type Role, type StaffRow,
} from "./constants";
import { StatCards, AreaGlyph } from "@/components/atelier";
import { areaVisual } from "@/components/atelier/area-visual";

type SortKey = "area" | "name" | "competency" | "tenure" | "manager";

// Alan sıralama rütbesi: AREAS sırası (Woman→Basic→TRF→…); atanmamış en sonda.
const AREA_RANK = new Map<string, number>(AREAS.map((a, i) => [a.id, i]));
function areaRank(area: string | null): number {
  if (!area) return 999;
  return AREA_RANK.get(area) ?? 998;
}
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
      duty: string | null;
      employment: string | null;
    }>,
  ) => void;
  onDeleteStaff: (id: number) => void;
  onAddPerson: () => void;
  onEditPerson: (p: StaffRow) => void;
}) {
  const { loading, staff, onUpdateCompetency, onUpdateStaff, onDeleteStaff, onAddPerson, onEditPerson } = props;

  // Search + Sort + Filter state
  const [searchTerm, setSearchTerm] = useState("");
  // Varsayılan: alana göre gruplu (kullanıcı isteği). Grup-içi alfabetik.
  const [sortKey, setSortKey] = useState<SortKey>("area");
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
        case "area":
          // Alan rütbesi → alan-içi tier (COM→FT→PT) → alfabetik.
          cmp = areaRank(a.homeArea) - areaRank(b.homeArea);
          if (cmp === 0) cmp = withinAreaRank(a) - withinAreaRank(b);
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, "tr");
          break;
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
    <div>
      {/* KPI */}
      <StatCards
        cols={4}
        stats={[
          { label: "Toplam Personel", value: String(stats.total).padStart(2, "0") },
          { label: "Çok Yeni · 0–1 ay", value: String(stats.veryNew).padStart(2, "0"), tone: "accent" },
          { label: "Yetkin", value: String(stats.expert).padStart(2, "0") },
          { label: "Yönetici", value: String(stats.managers).padStart(2, "0") },
        ]}
      />

      {/* Arama + sırala + filtre + ekle */}
      <div className="so-toolbar" style={{ marginTop: 22 }}>
        <div className="so-search">
          <Search size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Personel ara — ad / kısa ad / not…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="so-tb-right">
          <div className="seg">
            <span className="seg-lbl"><ArrowUpDown size={11} strokeWidth={1.6} style={{ verticalAlign: "-2px" }} /> Sırala</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="mx-sel"
              style={{ border: "none", borderRadius: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10 }}
            >
              <option value="area">Alan</option>
              <option value="name">Ad</option>
              <option value="competency">Yetkinlik</option>
              <option value="tenure">Süre</option>
              <option value="manager">Yönetici</option>
            </select>
            <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} title="Sıralama yönü">
              {sortDir === "asc" ? "↑ A–Z" : "↓ Z–A"}
            </button>
          </div>

          <button onClick={() => setShowFilters((v) => !v)} className={`mx-fchip ${activeFilterCount > 0 ? "on" : ""}`}>
            <Filter size={11} strokeWidth={1.6} /> Filtrele
            {activeFilterCount > 0 && <span className="num">· {activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="mx-fchip">Temizle</button>
          )}

          <button onClick={onAddPerson} className="btn gold sm">
            <Plus size={13} strokeWidth={2} /> Personel Ekle
          </button>
        </div>
      </div>

      {/* Filtre çipleri */}
      {showFilters && (
        <div className="mx-filters">
          <span className="eb">Süre</span>
          {TENURE_LEVELS.map((t) => {
            const active = filterTenure.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTenure(t.id)}
                className={`mx-fchip ${active ? "on" : ""}`}
                style={!active ? { color: t.color } : undefined}
              >
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setFilterManagers((v) => !v)}
            className={`mx-fchip ${filterManagers ? "on" : ""}`}
          >
            <Crown size={11} strokeWidth={1.8} fill={filterManagers ? "currentColor" : "none"} /> Yöneticiler
          </button>
          <span style={{ marginLeft: "auto", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--zara-ink-50)" }} className="num">
            {filtered.length} / {staff.length} kayıt
          </span>
        </div>
      )}

      {/* Matris — yatay scroll (mobil uyumlu), sticky personel kolonu + sticky thead */}
      <div className="panel matrix-panel" style={{ marginTop: 18 }}>
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th className="col-id sticky-l">Personel</th>
                <th className="col-sm">Süre</th>
                <th className="col-md">Alan</th>
                <th className="col-sm">Görev</th>
                <th className="col-sm">FT/PT</th>
                {ROLES.map((role) => (
                  <th key={role} className="col-skill">{role}</th>
                ))}
                <th className="col-md">Not</th>
                <th className="col-skill"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={ROLES.length + 7} style={{ padding: 32, textAlign: "center", color: "var(--zara-ink-40)" }}>
                    <Loader2 className="inline-block animate-spin" size={14} style={{ verticalAlign: "-2px", marginRight: 8 }} /> Yükleniyor…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={ROLES.length + 7} style={{ padding: 32, textAlign: "center", color: "var(--zara-ink-40)", fontSize: 13 }}>
                    {activeFilterCount > 0 ? "Filtreler ile eşleşen personel yok." : "Kayıt yok."}
                  </td>
                </tr>
              )}
              {filtered.map((person, idx) => {
                const tenure = TENURE_LEVELS.find((t) => t.id === person.tenureLevel);
                // Alan sıralamasında, alan değiştiğinde grup başlığı satırı bas.
                const curArea = person.homeArea ?? "__none__";
                const prevArea = idx > 0 ? (filtered[idx - 1].homeArea ?? "__none__") : null;
                const showGroupHeader = sortKey === "area" && curArea !== prevArea;
                const areaMeta = person.homeArea ? AREA_BY_ID[person.homeArea] : undefined;
                const groupCount = filtered.filter((p) => (p.homeArea ?? "__none__") === curArea).length;
                return (
                  <Fragment key={person.id}>
                    {showGroupHeader && (
                      <tr className="area-row">
                        <td colSpan={ROLES.length + 7}>
                          <div className="area-row-inner">
                            <AreaGlyph area={person.homeArea} size={14} />
                            <span className="ar-label" style={{ color: areaMeta ? areaVisual(person.homeArea).color : "var(--zara-ink-50)" }}>
                              {areaMeta?.label ?? "Atanmamış"}
                            </span>
                            {areaMeta?.sub && <span className="ar-sub">{areaMeta.sub}</span>}
                            <span className="ar-count num">· {String(groupCount).padStart(2, "0")}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className="person-row">
                      <td className="col-id sticky-l">
                        <div className="pr-id">
                          <button
                            className={`mx-crown ${person.isManager ? "on" : ""}`}
                            onClick={() => onUpdateStaff(person.id, { isManager: !person.isManager })}
                            title={person.isManager ? "Yöneticiyi kaldır" : "Yönetici yap"}
                          >
                            <Crown size={13} strokeWidth={2} fill={person.isManager ? "currentColor" : "none"} />
                          </button>
                          <div className="pr-name">
                            <span className="pn">{person.fullName}</span>
                            <span className="ps">{person.shortName}</span>
                          </div>
                          {/* Pusula bağı — SEMBOLİK: kişinin Pusula profilini
                              çağrıştırır ama tıklanamaz (Pusula verisi temsilî). */}
                          <span className="pr-pusula" aria-hidden title="Pusula profili · yakında">
                            <Compass size={13} strokeWidth={1.6} />
                          </span>
                        </div>
                      </td>
                      <td>
                        <select
                          value={person.tenureLevel}
                          onChange={(e) => onUpdateStaff(person.id, { tenureLevel: e.target.value })}
                          className="mx-sel"
                          style={{ color: tenure?.color, border: "none", background: "transparent" }}
                        >
                          {TENURE_LEVELS.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {/* Alan-bazlı v2: pill seçici (renkli çerçeve). v1 chart'ı etkilemez. */}
                        <span
                          className="mx-pill"
                          style={{
                            borderColor: person.homeArea ? areaVisual(person.homeArea).color : "var(--zara-line-strong)",
                            color: person.homeArea ? areaVisual(person.homeArea).color : "var(--zara-ink-40)",
                          }}
                        >
                          <AreaGlyph area={person.homeArea} size={12} />
                          <select
                            value={person.homeArea ?? ""}
                            onChange={(e) => onUpdateStaff(person.id, { homeArea: e.target.value === "" ? null : e.target.value })}
                          >
                            <option value="">— Alan</option>
                            {AREAS.map((a) => (
                              <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                          </select>
                        </span>
                      </td>
                      <td>
                        {/* Görev (COM/CX/Coach) — pill. Alan-içi sıralamada COM en üste. */}
                        <span
                          className="mx-pill"
                          style={{
                            borderColor: DUTIES.find((d) => d.id === person.duty)?.color ?? "var(--zara-line-strong)",
                            color: DUTIES.find((d) => d.id === person.duty)?.color ?? "var(--zara-ink-40)",
                          }}
                        >
                          <select
                            value={person.duty ?? ""}
                            onChange={(e) => onUpdateStaff(person.id, { duty: e.target.value === "" ? null : e.target.value })}
                          >
                            <option value="">— Görev</option>
                            {DUTIES.map((d) => (
                              <option key={d.id} value={d.id}>{d.label}</option>
                            ))}
                          </select>
                        </span>
                      </td>
                      <td>
                        {/* Çalışma tipi — tıklanabilir FT/PT toggle (buton). Aktife basınca temizler. */}
                        <span className={`ftpt ${person.employment === "FT" ? "full" : person.employment === "PT" ? "part" : ""}`}>
                          <button
                            type="button"
                            className={`ftpt-seg ${person.employment === "FT" ? "on" : ""}`}
                            onClick={() => onUpdateStaff(person.id, { employment: person.employment === "FT" ? null : "FT" })}
                          >
                            FT
                          </button>
                          <button
                            type="button"
                            className={`ftpt-seg ${person.employment === "PT" ? "on" : ""}`}
                            onClick={() => onUpdateStaff(person.id, { employment: person.employment === "PT" ? null : "PT" })}
                          >
                            PT
                          </button>
                        </span>
                      </td>
                      {ROLES.map((role) => {
                        const level = person.competencies[role] ?? 0;
                        const isEditing = editingCell?.id === person.id && editingCell?.role === role;
                        return (
                          <td key={role} style={{ position: "relative" }}>
                            {isEditing && (
                              <div ref={dropdownRef} className={`star-menu ${editingCell.direction}`}>
                                {STAR_LEVELS.map((s) => (
                                  <button
                                    key={s.value}
                                    onClick={() => {
                                      onUpdateCompetency(person.id, role, s.value);
                                      setEditingCell(null);
                                    }}
                                    className={`star-opt ${level === s.value ? "on" : ""}`}
                                  >
                                    <span className="so-star">{s.label}</span>
                                    <span className="so-name">{s.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={(e) => openCell(person, role, e.currentTarget)}
                              className={`stars ${level ? "t" + level : "empty"}`}
                              title="Seviye değiştir"
                            >
                              {STAR_LEVELS.find((s) => s.value === level)?.label}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "left" }}>
                        <span className="mx-note" title={person.note ?? ""}>{person.note ?? ""}</span>
                      </td>
                      <td>
                        <div className="mx-acts">
                          <button onClick={() => onEditPerson(person)} title="Düzenle">
                            <Pencil size={13} strokeWidth={1.6} />
                          </button>
                          <button
                            className="del"
                            onClick={() => {
                              if (confirm(`${person.fullName} silinsin mi?`)) onDeleteStaff(person.id);
                            }}
                            title="Sil"
                          >
                            <XIcon size={13} strokeWidth={1.6} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
