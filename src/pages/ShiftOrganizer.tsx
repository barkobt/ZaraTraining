import { useState } from "react";
import { Users, Calendar, BarChart3, Settings, LogOut, Archive, LayoutGrid } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { CompetencyTab } from "./shift-organizer/CompetencyTab";
import { AreasTab } from "./shift-organizer/AreasTab";
import { GenerateTab } from "./shift-organizer/GenerateTab";
import { ReportTab } from "./shift-organizer/ReportTab";
import { SettingsTab } from "./shift-organizer/SettingsTab";
import { ArchiveTab } from "./shift-organizer/ArchiveTab";
import { AddPersonModal } from "./shift-organizer/AddPersonModal";
import type { StaffRow } from "./shift-organizer/constants";
import { useAuthGate } from "./shift-organizer/auth-gate";

type TabId = "competency" | "areas" | "generate" | "archive" | "report" | "settings";

export default function ShiftOrganizer() {
  const gate = useAuthGate();

  if (gate.required && !gate.authed) {
    return <gate.LoginScreen />;
  }

  return <ShiftOrganizerInner onLogout={gate.logout} canLogout={gate.required} />;
}

function ShiftOrganizerInner({
  onLogout,
  canLogout,
}: {
  onLogout: () => void;
  canLogout: boolean;
}) {
  const [tab, setTab] = useState<TabId>("competency");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editPerson, setEditPerson] = useState<StaffRow | null>(null);

  const utils = trpc.useUtils();
  const staffQuery = trpc.staff.list.useQuery();
  const staff = (staffQuery.data ?? []) as StaffRow[];

  // Optimistic update pattern: UI'da değişiklik anında görünür, sonra background
  // request tamamlanınca cache invalidate. Hata olursa onError ile rollback.
  const updateCompetency = trpc.competency.update.useMutation({
    onMutate: async ({ staffId, role, level }) => {
      await utils.staff.list.cancel();
      const prev = utils.staff.list.getData();
      utils.staff.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((s) =>
          s.id === staffId
            ? { ...s, competencies: { ...s.competencies, [role]: level } }
            : s,
        );
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.staff.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.staff.list.invalidate(),
  });
  const createStaffMut = trpc.staff.create.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const updateStaffMut = trpc.staff.update.useMutation({
    onMutate: async (vars) => {
      await utils.staff.list.cancel();
      const prev = utils.staff.list.getData();
      utils.staff.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((s) => (s.id === vars.id ? { ...s, ...vars } : s));
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.staff.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.staff.list.invalidate(),
  });
  const deleteStaffMut = trpc.staff.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.staff.list.cancel();
      const prev = utils.staff.list.getData();
      utils.staff.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter((s) => s.id !== id);
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.staff.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.staff.list.invalidate(),
  });
  const generateChart = trpc.chart.generate.useMutation();

  const TABS = [
    { id: "competency" as const, label: "Yetkinlik", icon: Users, count: staff.length },
    { id: "areas" as const, label: "Alanlar", icon: LayoutGrid },
    { id: "generate" as const, label: "Shift & Chart", icon: Calendar },
    { id: "archive" as const, label: "Arşiv", icon: Archive },
    { id: "report" as const, label: "Rapor", icon: BarChart3 },
    { id: "settings" as const, label: "Ayarlar", icon: Settings },
  ];

  return (
    <div className="zt-editorial so-shell">
      <header className="so-head">
        <div className="so-brand">
          <div className="bn">Shift <em>Organizer</em></div>
          <div className="bs">ZARA · Mağaza 3643</div>
        </div>
        <nav className="so-tabs">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`so-tab ${tab === id ? "on" : ""}`}
            >
              <Icon size={13} strokeWidth={1.6} />
              {label}
              {count !== undefined && (
                <span className="tc num">({String(count).padStart(2, "0")})</span>
              )}
            </button>
          ))}
          {canLogout && (
            <button onClick={onLogout} className="so-logout" title="Çıkış">
              <LogOut size={14} strokeWidth={1.6} />
            </button>
          )}
        </nav>
      </header>

      <main className="content">
        {tab === "competency" && (
          <CompetencyTab
            loading={staffQuery.isLoading}
            staff={staff}
            onUpdateCompetency={(staffId, role, level) =>
              updateCompetency.mutate({ staffId, role, level })
            }
            onUpdateStaff={(id, patch) => updateStaffMut.mutate({ id, ...patch })}
            onDeleteStaff={(id) => deleteStaffMut.mutate({ id })}
            onAddPerson={() => setShowAddPerson(true)}
            onEditPerson={(p) => setEditPerson(p)}
          />
        )}

        {tab === "areas" && (
          <AreasTab
            loading={staffQuery.isLoading}
            staff={staff}
            onUpdateStaff={(id, patch) => updateStaffMut.mutate({ id, ...patch })}
          />
        )}

        {tab === "generate" && <GenerateTab staff={staff} generate={generateChart} />}

        {tab === "archive" && <ArchiveTab staff={staff} />}

        {tab === "report" && <ReportTab staff={staff} />}

        {tab === "settings" && <SettingsTab />}
      </main>

      {showAddPerson && (
        <AddPersonModal
          mode="add"
          onClose={() => setShowAddPerson(false)}
          onSubmit={(data) => {
            createStaffMut.mutate(data, { onSuccess: () => setShowAddPerson(false) });
          }}
          pending={createStaffMut.isPending}
        />
      )}
      {editPerson && (
        <AddPersonModal
          mode="edit"
          initial={{
            fullName: editPerson.fullName,
            shortName: editPerson.shortName,
            tenureLevel: editPerson.tenureLevel,
            isManager: editPerson.isManager,
            note: editPerson.note,
          }}
          onClose={() => setEditPerson(null)}
          onSubmit={(data) => {
            updateStaffMut.mutate(
              { id: editPerson.id, ...data },
              { onSuccess: () => setEditPerson(null) },
            );
          }}
          pending={updateStaffMut.isPending}
        />
      )}
    </div>
  );
}
