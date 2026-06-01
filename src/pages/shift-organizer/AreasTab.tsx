import { useMemo, type CSSProperties } from "react";
import { Crown, Loader2, Users } from "lucide-react";
import { AREAS, DUTY_BY_ID, staffLabel, withinAreaRank, type StaffRow } from "./constants";
import { AreaGlyph } from "@/components/atelier";
import { areaVisual } from "@/components/atelier/area-visual";

/**
 * AreasTab — Alan-bazlı (area-based) v2 görünümü.
 *
 * Kişileri sabit çalışma alanına göre gruplayıp listeler; sıra kullanıcı
 * isteğiyle Woman → Basic → TRF → Fitting Room → Sprinter → 360 Runner.
 * Her kişinin alanı buradan veya Yetkinlik sekmesinden değiştirilebilir
 * (ikisi de aynı staff.home_area kolonuna yazar).
 *
 * NOT: Bu ekran v1 chart üretimini etkilemez. Sadece v2 sisteminin "kim nerede
 * sabit çalışıyor" tablosunu kurar. Atama (chart) mantığı ayrı gelecek.
 */
export function AreasTab(props: {
  loading: boolean;
  staff: StaffRow[];
  onUpdateStaff: (id: number, patch: { homeArea: string | null }) => void;
}) {
  const { loading, staff, onUpdateStaff } = props;

  // Alan → kişiler. AREAS sırasını korur; sonda "Atanmamış" grubu.
  const groups = useMemo(() => {
    const byArea = new Map<string, StaffRow[]>();
    for (const a of AREAS) byArea.set(a.id, []);
    const unassigned: StaffRow[] = [];
    for (const s of staff) {
      const bucket = s.homeArea ? byArea.get(s.homeArea) : undefined;
      if (bucket) bucket.push(s);
      else unassigned.push(s);
    }
    // Alan-içi sıralama: COM → FT → PT → etiketsiz, her tier'da alfabetik.
    const byTierThenName = (a: StaffRow, b: StaffRow) => {
      const t = withinAreaRank(a) - withinAreaRank(b);
      if (t !== 0) return t;
      return staffLabel(a, staff).localeCompare(staffLabel(b, staff), "tr");
    };
    for (const list of byArea.values()) list.sort(byTierThenName);
    unassigned.sort(byTierThenName);
    return { byArea, unassigned };
  }, [staff]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--zara-ink-40)" }}>
        <Loader2 className="inline-block animate-spin" size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} /> Yükleniyor…
      </div>
    );
  }

  const assignedCount = staff.length - groups.unassigned.length;

  return (
    <div>
      {/* Üst bilgi şeridi */}
      <div className="areas-head">
        <span className="ah-eb">
          <Users size={14} strokeWidth={1.6} /> Alan-bazlı dağılım
        </span>
        <span className="ah-count num">{assignedCount} / {staff.length} atanmış</span>
      </div>

      {/* Alan kartları — responsive grid (editorial.css: 3→2→1 kolon) */}
      <div className="areas-grid">
        {AREAS.map((area) => {
          const people = groups.byArea.get(area.id) ?? [];
          const color = areaVisual(area.id).color;
          return (
            <section key={area.id} className="area-col" style={{ ["--ac" as string]: color } as CSSProperties}>
              <header className="area-col-head">
                <span className="ach-l">
                  <AreaGlyph area={area.id} size={15} />
                  <span className="ach-label" style={{ color }}>{area.label}</span>
                  {area.sub && <span className="ach-sub">{area.sub}</span>}
                </span>
                <span className="ach-count num">{String(people.length).padStart(2, "0")}</span>
              </header>
              <div className="area-col-body">
                {people.length === 0 ? (
                  <div className="ac-empty">Boş</div>
                ) : (
                  people.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                      all={staff}
                      currentArea={area.id}
                      onMove={(toArea) => onUpdateStaff(p.id, { homeArea: toArea })}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Atanmamış havuzu */}
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="area-col-head" style={{ borderBottom: "1px solid var(--zara-line)" }}>
          <span className="ach-l">
            <span className="dl-dot" style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--zara-ink-30)", display: "inline-block" }} />
            <span className="ach-label" style={{ color: "var(--zara-ink-50)" }}>Atanmamış</span>
          </span>
          <span className="ach-count num">{String(groups.unassigned.length).padStart(2, "0")}</span>
        </div>
        <div style={{ padding: 14 }}>
          {groups.unassigned.length === 0 ? (
            <div className="ac-empty" style={{ textAlign: "left" }}>Herkes bir alana atanmış.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {groups.unassigned.map((p) => (
                <div key={p.id} style={{ minWidth: 220, flex: "1 1 220px", maxWidth: 320 }}>
                  <PersonCard
                    person={p}
                    all={staff}
                    currentArea={null}
                    onMove={(toArea) => onUpdateStaff(p.id, { homeArea: toArea })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Tek kişi kartı — adı + görev/ft rozetleri + alan değiştirme dropdown'u. */
function PersonCard(props: {
  person: StaffRow;
  all: StaffRow[];
  currentArea: string | null;
  onMove: (toArea: string | null) => void;
}) {
  const { person, all, currentArea, onMove } = props;
  return (
    <div className="ac-card">
      {person.isManager && <Crown className="ac-crown" size={12} strokeWidth={2} fill="currentColor" />}
      {person.duty && (
        <span className="ac-role" style={{ background: DUTY_BY_ID[person.duty]?.color ?? "#78716c" }}>
          {DUTY_BY_ID[person.duty]?.label ?? person.duty}
        </span>
      )}
      {person.employment && (
        <span className={`ac-ft ${person.employment === "FT" ? "full" : ""}`}>{person.employment}</span>
      )}
      <span className="ac-name">{staffLabel(person, all)}</span>
      <span className="ac-move">
        <select
          value={currentArea ?? ""}
          onChange={(e) => onMove(e.target.value === "" ? null : e.target.value)}
          title="Alanı değiştir"
        >
          <option value="">— Taşı</option>
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </span>
    </div>
  );
}
