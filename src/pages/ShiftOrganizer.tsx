import { useState } from "react";
import { Users, Calendar, BarChart3, Settings, LogOut, Archive } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { CompetencyTab } from "./shift-organizer/CompetencyTab";
import { GenerateTab } from "./shift-organizer/GenerateTab";
import { ReportTab } from "./shift-organizer/ReportTab";
import { SettingsTab } from "./shift-organizer/SettingsTab";
import { ArchiveTab } from "./shift-organizer/ArchiveTab";
import { AddPersonModal } from "./shift-organizer/AddPersonModal";
import type { StaffRow } from "./shift-organizer/constants";
import { useAuthGate } from "./shift-organizer/auth-gate";

type TabId = "competency" | "generate" | "archive" | "report" | "settings";

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

  const TABS = [
    { id: "competency" as const, label: "Yetkinlik", icon: Users, count: staff.length },
    { id: "generate" as const, label: "Shift & Chart", icon: Calendar },
    { id: "archive" as const, label: "Arşiv", icon: Archive },
    { id: "report" as const, label: "Rapor", icon: BarChart3 },
    { id: "settings" as const, label: "Ayarlar", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-stone-300 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-serif text-xl sm:text-2xl tracking-[-0.02em]">
              Shift Organizer
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-stone-500 mt-1">
              ZARA · Mağaza 3643
            </div>
          </div>
          {canLogout && (
            <button
              onClick={onLogout}
              className="text-stone-400 hover:text-black lg:hidden"
              title="Çıkış"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="flex gap-1 flex-nowrap">
            {TABS.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 sm:px-5 py-2 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 whitespace-nowrap transition-colors ${
                  tab === id ? "bg-black text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
                {count !== undefined && (
                  <span className="text-[9px] opacity-70">
                    ({String(count).padStart(2, "0")})
                  </span>
                )}
              </button>
            ))}
          </nav>
          {canLogout && (
            <button
              onClick={onLogout}
              className="text-stone-400 hover:text-black hidden lg:inline-flex"
              title="Çıkış"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 md:p-8">
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
          />
        )}

        {tab === "generate" && <GenerateTab staff={staff} generate={generateChart} />}

        {tab === "archive" && <ArchiveTab staff={staff} />}

        {tab === "report" && <ReportTab staff={staff} />}

        {tab === "settings" && <SettingsTab />}
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
    </div>
  );
}
