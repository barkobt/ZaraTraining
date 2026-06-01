import { useMemo } from "react";
import { Crown, Loader2, Users } from "lucide-react";
import { AREAS, staffLabel, type StaffRow } from "./constants";

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
    // Her grup içinde isimle sırala.
    const byName = (a: StaffRow, b: StaffRow) =>
      staffLabel(a, staff).localeCompare(staffLabel(b, staff), "tr");
    for (const list of byArea.values()) list.sort(byName);
    unassigned.sort(byName);
    return { byArea, unassigned };
  }, [staff]);

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-400">
        <Loader2 className="inline-block animate-spin mr-2" size={16} /> Yükleniyor…
      </div>
    );
  }

  const assignedCount = staff.length - groups.unassigned.length;

  return (
    <div className="space-y-6">
      {/* Üst bilgi şeridi */}
      <div className="flex items-center justify-between border-y border-stone-300 py-4">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-stone-600">
          <Users size={14} strokeWidth={1.5} />
          Alan-bazlı dağılım
        </div>
        <div className="text-[10px] tracking-[0.15em] uppercase text-stone-500">
          {assignedCount} / {staff.length} atanmış
        </div>
      </div>

      {/* Alan kartları — responsive grid */}
      <div className="grid gap-px bg-stone-300 border border-stone-300 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area) => {
          const people = groups.byArea.get(area.id) ?? [];
          return (
            <section key={area.id} className="bg-white p-4 min-h-[140px] flex flex-col">
              <header className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: area.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: area.color }}>
                    {area.label}
                  </span>
                  {area.sub && (
                    <span className="text-[9px] tracking-wider uppercase text-stone-400">
                      {area.sub}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tabular-nums text-stone-500">
                  {String(people.length).padStart(2, "0")}
                </span>
              </header>

              {people.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[11px] text-stone-300">
                  Boş
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {people.map((p) => (
                    <li key={p.id}>
                      <PersonChip
                        person={p}
                        all={staff}
                        currentArea={area.id}
                        onMove={(toArea) => onUpdateStaff(p.id, { homeArea: toArea })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Atanmamış havuzu */}
      <section className="bg-white border border-stone-300 p-4">
        <header className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
          <span className="text-sm font-medium text-stone-500">Atanmamış</span>
          <span className="text-[11px] tabular-nums text-stone-400">
            {String(groups.unassigned.length).padStart(2, "0")}
          </span>
        </header>
        {groups.unassigned.length === 0 ? (
          <div className="text-[11px] text-stone-300 py-2">
            Herkes bir alana atanmış.
          </div>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {groups.unassigned.map((p) => (
              <li key={p.id}>
                <PersonChip
                  person={p}
                  all={staff}
                  currentArea={null}
                  onMove={(toArea) => onUpdateStaff(p.id, { homeArea: toArea })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Tek kişi — adı + alan değiştirme dropdown'u. */
function PersonChip(props: {
  person: StaffRow;
  all: StaffRow[];
  currentArea: string | null;
  onMove: (toArea: string | null) => void;
}) {
  const { person, all, currentArea, onMove } = props;
  return (
    <div className="flex items-center justify-between gap-2 border border-stone-200 rounded-sm px-2 py-1 hover:border-stone-400 transition-colors">
      <span className="flex items-center gap-1 text-[12px] truncate">
        {person.isManager && (
          <Crown size={10} strokeWidth={2} fill="currentColor" className="text-amber-500 shrink-0" />
        )}
        {staffLabel(person, all)}
      </span>
      <select
        value={currentArea ?? ""}
        onChange={(e) => onMove(e.target.value === "" ? null : e.target.value)}
        className="text-[10px] bg-transparent outline-none cursor-pointer text-stone-400 hover:text-black shrink-0"
        title="Alanı değiştir"
      >
        <option value="">—</option>
        {AREAS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  );
}
