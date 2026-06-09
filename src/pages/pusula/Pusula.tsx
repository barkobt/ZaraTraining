import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
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

const GROUPS: Array<{ group: string; hint: string; items: Array<{ id: ViewId; label: string; sub: string }> }> = [
  {
    group: "İnsan",
    hint: "Kim",
    items: [
      { id: "ekip", label: "Ekip", sub: "Yaşayan roster" },
      { id: "profil", label: "Profil", sub: "Derin okuma" },
    ],
  },
  {
    group: "Gelişim",
    hint: "Nasıl büyür",
    items: [
      { id: "defter", label: "Gelişim Defteri", sub: "Takip · yetkinlik · dönem" },
      { id: "hafiza", label: "Öğrenen Hafıza", sub: "Koçluk arşivi" },
      { id: "usta", label: "Usta Yolu", sub: "Mentor eşleşme" },
    ],
  },
  {
    group: "Sonuç",
    hint: "Ne değişir",
    items: [{ id: "yerlestirme", label: "Yerleştirme", sub: "Canlı chart" }],
  },
];

const VIEW_GROUP: Record<ViewId, string> = {
  ekip: "İnsan",
  profil: "İnsan",
  defter: "Gelişim",
  hafiza: "Gelişim",
  usta: "Gelişim",
  yerlestirme: "Sonuç",
};

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function Pusula() {
  const [view, setView] = useState<ViewId>("ekip");
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [peek, setPeek] = useState<Employee | null>(null);
  const [applied, setApplied] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // hover gecikmesiyle dropdown kapanışı (titremesin)
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  useEffect(() => () => cancelClose(), []);

  const go = (id: ViewId) => {
    setView(id);
    setOpen(null);
  };

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
          {GROUPS.map((g) => {
            const activeGroup = VIEW_GROUP[view] === g.group;
            const isOpen = open === g.group;
            return (
              <div
                key={g.group}
                className="pusula-navdrop"
                onMouseEnter={() => {
                  cancelClose();
                  setOpen(g.group);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`pusula-navtrigger ${activeGroup ? "active" : ""} ${isOpen ? "open" : ""}`}
                  onClick={() => setOpen(isOpen ? null : g.group)}
                >
                  <span className="pusula-navtrigger-g">{g.group}</span>
                  <span className="pusula-navtrigger-h">{g.hint}</span>
                  <ChevronDown size={12} strokeWidth={2} className="pusula-navchev" />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="pusula-navmenu"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: EASE }}
                    >
                      {g.items.map((it) => (
                        <button
                          key={it.id}
                          className={`pusula-navmenu-item ${view === it.id ? "on" : ""}`}
                          onClick={() => go(it.id)}
                        >
                          <span className="pusula-navmenu-label">{it.label}</span>
                          <span className="pusula-navmenu-sub">{it.sub}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
