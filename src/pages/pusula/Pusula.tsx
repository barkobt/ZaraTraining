import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { Icon, LiveDot } from "../brain/primitives";
import type { Employee } from "./types";
import { Ekip } from "./views/Ekip";
import { Profil } from "./views/Profil";
import { Yerlestirme } from "./views/Yerlestirme";
import { GelisimDefteri } from "./views/GelisimDefteri";
import { OgrenenHafiza } from "./views/OgrenenHafiza";
import { UstaYolu } from "./views/UstaYolu";
import { ProfileDrawer } from "./components/ProfileDrawer";

type ViewId = "ekip" | "profil" | "defter" | "hafiza" | "usta" | "yerlestirme";

const GROUPS: Array<{ group: string; items: Array<{ id: ViewId; label: string }> }> = [
  { group: "İnsan", items: [{ id: "ekip", label: "Ekip" }, { id: "profil", label: "Profil" }] },
  {
    group: "Gelişim",
    items: [
      { id: "defter", label: "Defter" },
      { id: "hafiza", label: "Hafıza" },
      { id: "usta", label: "Usta Yolu" },
    ],
  },
  { group: "Sonuç", items: [{ id: "yerlestirme", label: "Yerleştirme" }] },
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function Pusula() {
  const [view, setView] = useState<ViewId>("ekip");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [peek, setPeek] = useState<Employee | null>(null);
  const [applied, setApplied] = useState(false);

  return (
    <div className="zt-editorial pusula-shell">
      <header className="pusula-top">
        <div className="pusula-brand">
          <Link to="/brain" className="pusula-brand-back" aria-label="Brain'e dön">
            <Icon name="arrow-up-right" size={13} style={{ transform: "rotate(-135deg)" }} />
          </Link>
          <div>
            <div className="pusula-brand-name">
              <em>Pusula</em>
            </div>
            <div className="pusula-brand-sub">ZARA · ATELYE · BORNOVA</div>
          </div>
        </div>

        <nav className="pusula-nav">
          {GROUPS.map((g) => (
            <div key={g.group} className="pusula-navgroup">
              <span className="pusula-navgroup-label">{g.group}</span>
              <div className="pusula-navgroup-items">
                {g.items.map((n) => (
                  <button
                    key={n.id}
                    className={`pusula-navitem ${view === n.id ? "on" : ""}`}
                    onClick={() => setView(n.id)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <LiveDot label="PUSULA" />
      </header>

      <main className="pusula-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {view === "ekip" && <Ekip onPeek={setPeek} />}
            {view === "profil" && <Profil person={selected} onSelect={setSelected} />}
            {view === "defter" && <GelisimDefteri />}
            {view === "hafiza" && <OgrenenHafiza />}
            {view === "usta" && <UstaYolu />}
            {view === "yerlestirme" && <Yerlestirme applied={applied} onApply={setApplied} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <ProfileDrawer
        person={peek}
        onClose={() => setPeek(null)}
        onFull={() => {
          if (peek) setSelected(peek);
          setPeek(null);
          setView("profil");
        }}
      />
    </div>
  );
}
