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
import { useAuthGate } from "../shift-organizer/auth-gate";
import { LangCtx, LANGS, tr, type Lang } from "./i18n";

type ViewId = "ekip" | "profil" | "defter" | "hafiza" | "usta" | "yerlestirme";

const GROUPS: Array<{ key: string; hintKey: string; items: Array<{ id: ViewId; labelKey: string; subKey: string }> }> = [
  {
    key: "nav.insan",
    hintKey: "hint.kim",
    items: [
      { id: "ekip", labelKey: "item.ekip", subKey: "sub.ekip" },
      { id: "profil", labelKey: "item.profil", subKey: "sub.profil" },
    ],
  },
  {
    key: "nav.gelisim",
    hintKey: "hint.nasil",
    items: [
      { id: "defter", labelKey: "item.defter", subKey: "sub.defter" },
      { id: "hafiza", labelKey: "item.hafiza", subKey: "sub.hafiza" },
      { id: "usta", labelKey: "item.usta", subKey: "sub.usta" },
    ],
  },
  {
    key: "nav.sonuc",
    hintKey: "hint.ne",
    items: [{ id: "yerlestirme", labelKey: "item.yerlestirme", subKey: "sub.yerlestirme" }],
  },
];

const VIEW_GROUP: Record<ViewId, string> = {
  ekip: "nav.insan",
  profil: "nav.insan",
  defter: "nav.gelisim",
  hafiza: "nav.gelisim",
  usta: "nav.gelisim",
  yerlestirme: "nav.sonuc",
};

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Pusula — ShiftOrganizer ile AYNI şifre (useAuthGate · shiftOrganizerPassword env). */
export default function Pusula() {
  const gate = useAuthGate("Pusula");
  if (gate.required && !gate.authed) {
    return <gate.LoginScreen />;
  }
  return <PusulaInner />;
}

function PusulaInner() {
  const [view, setView] = useState<ViewId>("ekip");
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [peek, setPeek] = useState<Employee | null>(null);
  const [applied, setApplied] = useState(false);
  const [lang, setLang] = useState<Lang>("tr");
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
    <LangCtx.Provider value={{ lang, setLang }}>
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
            const activeGroup = VIEW_GROUP[view] === g.key;
            const isOpen = open === g.key;
            return (
              <div
                key={g.key}
                className="pusula-navdrop"
                onMouseEnter={() => {
                  cancelClose();
                  setOpen(g.key);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`pusula-navtrigger ${activeGroup ? "active" : ""} ${isOpen ? "open" : ""}`}
                  onClick={() => setOpen(isOpen ? null : g.key)}
                >
                  <span className="pusula-navtrigger-g">{tr(g.key, lang)}</span>
                  <span className="pusula-navtrigger-h">{tr(g.hintKey, lang)}</span>
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
                          <span className="pusula-navmenu-label">{tr(it.labelKey, lang)}</span>
                          <span className="pusula-navmenu-sub">{tr(it.subKey, lang)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="pusula-right">
          <div className="pusula-lang">
            {LANGS.map((l) => (
              <button key={l} className={`pusula-lang-b ${lang === l ? "on" : ""}`} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <LiveDot label="PUSULA" />
        </div>
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
    </LangCtx.Provider>
  );
}
