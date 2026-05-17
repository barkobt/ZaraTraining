import { useMemo, useState } from "react";
import { Crown, Plus, Search, Users, Calendar, X, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

const STAR_LEVELS = [
  { value: 0, label: "—", name: "Yok" },
  { value: 1, label: "★", name: "Kriz" },
  { value: 2, label: "★★", name: "Destek" },
  { value: 3, label: "★★★", name: "Ana" },
  { value: 4, label: "★★★+", name: "Tercih+" },
] as const;

const TENURE_LEVELS = [
  { id: "NEW_0_1", label: "0–1 ay", color: "#ef4444" },
  { id: "NEW_1_3", label: "1–3 ay", color: "#f59e0b" },
  { id: "NEW_3_6", label: "3–6 ay", color: "#eab308" },
  { id: "NEW_6_PLUS", label: "6+ ay", color: "#10b981" },
  { id: "EXPERT", label: "Yetkin", color: "#000000" },
] as const;

const ROLES = ["Welcome", "Kabin", "Runner", "Sprinter", "Z3-Z4", "Z5"] as const;
type Role = (typeof ROLES)[number];

const DEFAULT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

type StaffRow = {
  id: number;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  note: string | null;
  competencies: Record<string, number>;
};

export default function ShiftOrganizer() {
  const [tab, setTab] = useState<"competency" | "generate">("competency");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: number; role: Role } | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const utils = trpc.useUtils();
  const staffQuery = trpc.staff.list.useQuery();
  const staff = (staffQuery.data ?? []) as StaffRow[];

  const updateCompetency = trpc.competency.update.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const createStaffMut = trpc.staff.create.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const updateStaffMut = trpc.staff.update.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const deleteStaffMut = trpc.staff.delete.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const generateChart = trpc.chart.generate.useMutation();

  const filtered = useMemo(() => {
    if (!searchTerm) return staff;
    const q = searchTerm.toLowerCase();
    return staff.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q),
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
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-stone-300 px-8 py-5 flex justify-between items-center">
        <div>
          <div className="font-serif text-2xl tracking-[-0.02em]">Shift Organizer</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 mt-1">
            ZARA · Mağaza 3643
          </div>
        </div>
        <nav className="flex gap-1">
          {[
            { id: "competency" as const, label: "Yetkinlik", icon: Users, count: stats.total },
            { id: "generate" as const, label: "Shift & Chart", icon: Calendar },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-colors ${
                tab === id ? "bg-black text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
              {count !== undefined && (
                <span className="text-[9px] opacity-70">({String(count).padStart(2, "0")})</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-8">
        {tab === "competency" && (
          <CompetencyTab
            loading={staffQuery.isLoading}
            staff={filtered}
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            onUpdateCompetency={(staffId, role, level) =>
              updateCompetency.mutate({ staffId, role, level })
            }
            onUpdateStaff={(id, patch) => updateStaffMut.mutate({ id, ...patch })}
            onDeleteStaff={(id) => deleteStaffMut.mutate({ id })}
            onAddPerson={() => setShowAddPerson(true)}
            onOpenGenerate={() => setShowGenerate(true)}
          />
        )}

        {tab === "generate" && (
          <GenerateTab
            staff={staff}
            generate={generateChart}
          />
        )}
      </main>

      {showAddPerson && (
        <AddPersonModal
          onClose={() => setShowAddPerson(false)}
          onCreate={(data) => {
            createStaffMut.mutate(data, { onSuccess: () => setShowAddPerson(false) });
          }}
          pending={createStaffMut.isPending}
        />
      )}

      {showGenerate && (
        <GenerateModal
          staff={staff}
          onClose={() => setShowGenerate(false)}
          generate={generateChart}
        />
      )}
    </div>
  );
}

function CompetencyTab(props: {
  loading: boolean;
  staff: StaffRow[];
  stats: { total: number; veryNew: number; expert: number; managers: number };
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  editingCell: { id: number; role: Role } | null;
  setEditingCell: (c: { id: number; role: Role } | null) => void;
  onUpdateCompetency: (staffId: number, role: string, level: number) => void;
  onUpdateStaff: (id: number, patch: Partial<{ tenureLevel: string; isManager: boolean; note: string | null }>) => void;
  onDeleteStaff: (id: number) => void;
  onAddPerson: () => void;
  onOpenGenerate: () => void;
}) {
  const {
    loading,
    staff,
    stats,
    searchTerm,
    setSearchTerm,
    editingCell,
    setEditingCell,
    onUpdateCompetency,
    onUpdateStaff,
    onDeleteStaff,
    onAddPerson,
    onOpenGenerate,
  } = props;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-px bg-stone-300 border border-stone-300">
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
          className="border border-black px-6 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 hover:bg-stone-100"
        >
          <Plus size={12} strokeWidth={2} /> Personel Ekle
        </button>
        <button
          onClick={onOpenGenerate}
          className="bg-black text-white px-6 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 hover:bg-stone-800"
        >
          <Calendar size={12} strokeWidth={2} /> Chart Üret
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
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={ROLES.length + 4} className="p-8 text-center text-stone-400 text-sm">
                  Kayıt yok.
                </td>
              </tr>
            )}
            {staff.map((person, idx) => {
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
                      {person.isManager && (
                        <button
                          onClick={() => onUpdateStaff(person.id, { isManager: false })}
                          className="text-black"
                          title="Yönetici (çıkar)"
                        >
                          <Crown size={12} strokeWidth={2} fill="currentColor" />
                        </button>
                      )}
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
                          <div className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-1 bg-white border-2 border-black flex flex-col shadow-xl">
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

function AddPersonModal(props: {
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

type GenerateMutation = ReturnType<typeof trpc.chart.generate.useMutation>;

function GenerateTab({ staff, generate }: { staff: StaffRow[]; generate: GenerateMutation }) {
  return (
    <div className="space-y-6">
      <div className="border border-stone-300 p-8">
        <h3 className="text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Chart Üretimi
        </h3>
        <p className="text-sm text-stone-500 mb-6">
          Vardiya saatlerini gir, "Çöz" düğmesine bas. Solver CP-SAT ile en iyi atamayı bulur.
          ({staff.length} personel hazır.)
        </p>
        <GenerateForm staff={staff} generate={generate} inline />
      </div>

      {generate.data && <ChartResult result={generate.data} />}
    </div>
  );
}

function GenerateModal({
  staff,
  onClose,
  generate,
}: {
  staff: StaffRow[];
  onClose: () => void;
  generate: GenerateMutation;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-white border-2 border-black p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            Chart Üret
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <GenerateForm staff={staff} generate={generate} />
        {generate.data && (
          <div className="mt-6">
            <ChartResult result={generate.data} />
          </div>
        )}
      </div>
    </div>
  );
}

function GenerateForm({
  staff,
  generate,
  inline = false,
}: {
  staff: StaffRow[];
  generate: GenerateMutation;
  inline?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(today);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(21);
  const [includedIds, setIncludedIds] = useState<Set<number>>(
    () => new Set(staff.map((s) => s.id)),
  );

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h++) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  const onSubmit = () => {
    const shifts = staff
      .filter((s) => includedIds.has(s.id))
      .map((s) => ({
        short_name: s.shortName,
        start_hour: startHour,
        end_hour: endHour,
        breaks: [] as Array<[number, number]>,
      }));
    generate.mutate({ shiftDate, hours, shifts });
  };

  return (
    <div className={inline ? "" : "space-y-4"}>
      <div className="grid grid-cols-3 gap-4 mb-4">
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
            Açılış
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
            Kapanış
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

      <div className="mb-4">
        <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
          Vardiyaya dahil ({includedIds.size}/{staff.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {staff.map((p) => {
            const on = includedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() =>
                  setIncludedIds((prev) => {
                    const next = new Set(prev);
                    if (on) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
                className={`text-[11px] px-3 py-1 border ${
                  on
                    ? "bg-black text-white border-black"
                    : "bg-white text-stone-500 border-stone-300"
                }`}
              >
                {p.shortName}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={generate.isPending || includedIds.size === 0}
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
  );
}

function ChartResult({ result }: { result: NonNullable<GenerateMutation["data"]> }) {
  const cellsByHourRole = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of result.chart) m.set(`${c.hour}|${c.role}`, c.persons);
    return m;
  }, [result.chart]);

  const hours = useMemo(() => {
    const set = new Set<number>();
    for (const c of result.chart) set.add(c.hour);
    return [...set].sort((a, b) => a - b);
  }, [result.chart]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    for (const c of result.chart) set.add(c.role);
    return [...set];
  }, [result.chart]);

  return (
    <div className="border border-stone-300">
      <div className="px-4 py-3 border-b border-stone-300 flex items-center gap-4 text-[11px]">
        <span className="tracking-[0.25em] uppercase text-stone-500">Sonuç</span>
        <span
          className={`px-2 py-0.5 ${
            result.status === "OPTIMAL"
              ? "bg-emerald-100 text-emerald-700"
              : result.status === "FEASIBLE"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {result.status}
        </span>
        {result.qualityScore != null && (
          <span className="text-stone-600">Skor: {result.qualityScore.toFixed(1)}</span>
        )}
        <span className="text-stone-400">{result.elapsedSeconds.toFixed(2)}s</span>
        {result.chartId && <span className="text-stone-400 ml-auto">#{result.chartId}</span>}
      </div>

      {result.chart.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-sm">
          {result.status === "INFEASIBLE"
            ? "Çözüm bulunamadı — vardiya tanımı çok kısıtlı olabilir."
            : "Sonuç boş."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal">
                  Rol
                </th>
                {hours.map((h) => (
                  <th
                    key={h}
                    className="text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                  >
                    {String(h).padStart(2, "0")}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r} className="border-b border-stone-200">
                  <td className="p-2 text-[10px] tracking-wider uppercase">{r}</td>
                  {hours.map((h) => {
                    const persons = cellsByHourRole.get(`${h}|${r}`) ?? [];
                    return (
                      <td key={h} className="p-2 text-center">
                        {persons.length === 0 ? (
                          <span className="text-stone-300">—</span>
                        ) : (
                          persons.join("·")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="px-4 py-3 border-t border-stone-300 text-xs">
          <div className="text-[9px] tracking-[0.25em] uppercase text-amber-700 mb-1">Uyarılar</div>
          <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
            {result.warnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_HOURS };
