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
    <div>
      <nav className="set-subnav">
        {SUB_TABS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={`set-subtab ${sub === id ? "on" : ""}`}
            title={desc}
          >
            <Icon size={13} strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </nav>

      <div className="panel" style={{ padding: "24px 26px" }}>
        {sub === "solver" && <SolverSettings />}
        {sub === "forbidden" && <ForbiddenPairsSettings />}
        {sub === "store" && <StoreSettings />}
        {sub === "system" && <SystemSettings />}
      </div>
    </div>
  );
}
