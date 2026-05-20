import { useState } from "react";
import { Sliders, ShieldOff, Store, Server } from "lucide-react";
import { SolverSettings } from "./settings/SolverSettings";
import { ForbiddenPairsSettings } from "./settings/ForbiddenPairsSettings";
import { StoreSettings } from "./settings/StoreSettings";
import { SystemSettings } from "./settings/SystemSettings";

type SubTab = "solver" | "forbidden" | "store" | "system";

const SUB_TABS = [
  {
    id: "solver" as const,
    label: "Solver",
    icon: Sliders,
    desc: "Çözücü ağırlık ve cezaları",
  },
  {
    id: "forbidden" as const,
    label: "Yasaklar",
    icon: ShieldOff,
    desc: "Yasak rol çiftleri",
  },
  {
    id: "store" as const,
    label: "Mağaza",
    icon: Store,
    desc: "Mağaza bilgileri",
  },
  {
    id: "system" as const,
    label: "Sistem",
    icon: Server,
    desc: "DB, solver, güvenlik",
  },
];

export function SettingsTab() {
  const [sub, setSub] = useState<SubTab>("solver");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-stone-200">
        {SUB_TABS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={`px-4 py-3 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-colors border-b-2 ${
              sub === id
                ? "border-black text-black"
                : "border-transparent text-stone-500 hover:text-black"
            }`}
            title={desc}
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>

      <div className="border border-stone-300 p-4 sm:p-6 md:p-8">
        {sub === "solver" && <SolverSettings />}
        {sub === "forbidden" && <ForbiddenPairsSettings />}
        {sub === "store" && <StoreSettings />}
        {sub === "system" && <SystemSettings />}
      </div>
    </div>
  );
}
