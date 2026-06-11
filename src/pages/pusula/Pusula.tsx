import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { Icon, LiveDot } from "../brain/primitives";
import type { Employee } from "./types";
import { employees } from "./data";
import { Bugun } from "./views/Bugun";
import { Ekip } from "./views/Ekip";
import { Profil } from "./views/Profil";
import { Yerlestirme } from "./views/Yerlestirme";
import { GelisimDefteri } from "./views/GelisimDefteri";
import { OgrenenHafiza } from "./views/OgrenenHafiza";
import { UstaYolu } from "./views/UstaYolu";
import { SahaKrokisi } from "./views/SahaKrokisi";
import { ProfileDrawer } from "./components/ProfileDrawer";
import { useAuthGate } from "../shift-organizer/auth-gate";
import { LangCtx, LANGS, tr, setActiveLang, type Lang } from "./i18n";

type ViewId = "bugun" | "ekip" | "profil" | "defter" | "hafiza" | "usta" | "yerlestirme" | "saha";

/** Tek düz liste — Zara-app menüsü gibi: dev tipografi, indeks, grup ayraçları. */
const MENU: Array<{ id: ViewId; labelKey: string; subKey: string; group?: string }> = [
  { id: "bugun", labelKey: "item.bugun", subKey: "sub.bugun" },
  { id: "ekip", labelKey: "item.ekip", subKey: "sub.ekip", group: "nav.insan" },
  { id: "profil", labelKey: "item.profil", subKey: "sub.profil" },
  { id: "defter", labelKey: "item.defter", subKey: "sub.defter", group: "nav.gelisim" },
  { id: "hafiza", labelKey: "item.hafiza", subKey: "sub.hafiza" },
  { id: "usta", labelKey: "item.usta", subKey: "sub.usta" },
  { id: "yerlestirme", labelKey: "item.yerlestirme", subKey: "sub.yerlestirme", group: "nav.sonuc" },
  { id: "saha", labelKey: "item.saha", subKey: "sub.saha" },
];

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
  const [view, setView] = useState<ViewId>("bugun");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [peek, setPeek] = useState<Employee | null>(null);
  const [applied, setApplied] = useState(false);
  const [lang, setLang] = useState<Lang>("tr");
  const [q, setQ] = useState("");

  const go = (id: ViewId) => {
    setView(id);
    setMenuOpen(false);
    setQ("");
  };

  // üretilmiş içerik (data-program) için aktif dili senkron set et (çocuklar render'dan önce)
  setActiveLang(lang);

  // CSS text-transform: uppercase TR locale'de EN metne noktalı İ basar (STRONG İN) —
  // html lang'ı aktif dile eşitle; ayrılırken site varsayılanına (tr) dön.
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "tr";
    };
  }, [lang]);

  // menü açıkken: Escape kapatır, arka plan kaymaz
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const idx = Math.max(0, MENU.findIndex((m) => m.id === view));
  const hits = q.trim()
    ? employees.filter((p) => p.name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr"))).slice(0, 5)
    : [];

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
    <div className="zt-editorial pusula-shell">
      <header className="pusula-top">
        <div className="pusula-brand">
          <Link to="/brain" className="pusula-brand-back" aria-label={tr("a11y.backBrain", lang)}>
            <Icon name="arrow-up-right" size={13} style={{ transform: "rotate(-135deg)" }} />
          </Link>
          <div>
            <div className="pusula-brand-name">
              <em>Pusula</em>
            </div>
            <div className="pusula-brand-sub">ZARA · ATELYE · BORNOVA</div>
          </div>
        </div>

        {/* bölüm künyesi — tıklayınca menü açılır */}
        <button className="pv3-crumb" onClick={() => setMenuOpen(true)}>
          <span className="pv3-crumb-idx">{String(idx + 1).padStart(2, "0")}</span>
          <span className="pv3-crumb-label">{tr(MENU[idx].labelKey, lang)}</span>
          <span className="pv3-crumb-sub">{tr(MENU[idx].subKey, lang)}</span>
        </button>

        <div className="pusula-right">
          <div className="pusula-lang">
            {LANGS.map((l) => (
              <button key={l} className={`pusula-lang-b ${lang === l ? "on" : ""}`} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <LiveDot label="PUSULA" />
          <button className="pv3-menubtn" onClick={() => setMenuOpen(true)}>
            <span className="pv3-menubtn-lines" aria-hidden>
              <i />
              <i />
            </span>
            {tr("b.menu", lang)}
          </button>
        </div>
      </header>

      {/* ── TAM-EKRAN MENÜ — Zara-app imzası: dev serif liste + kişi arama ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="pv3-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="pv3-menu-top">
              <div className="pv3-menu-search">
                <Search size={15} strokeWidth={1.6} />
                <input
                  autoFocus
                  placeholder={tr("l.searchPerson", lang)}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <button className="pv3-menu-x" onClick={() => setMenuOpen(false)} aria-label={tr("a11y.closeMenu", lang)}>
                <Plus size={22} strokeWidth={1.4} style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>

            {hits.length > 0 && (
              <div className="pv3-menu-hits">
                {hits.map((p) => (
                  <button
                    key={p.id}
                    className="pv3-menu-hit"
                    onClick={() => {
                      setSelected(p);
                      go("profil");
                    }}
                  >
                    {p.name} <i>→ {tr("item.profil", lang)}</i>
                  </button>
                ))}
              </div>
            )}

            <nav className="pv3-menu-list">
              {MENU.map((m, i) => (
                <div key={m.id}>
                  {m.group && <div className="pv3-menu-group">{tr(m.group, lang)}</div>}
                  <motion.button
                    className={`pv3-menu-item ${view === m.id ? "on" : ""}`}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 + i * 0.04, ease: EASE }}
                    onClick={() => go(m.id)}
                  >
                    <span className="pv3-menu-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="pv3-menu-label">{tr(m.labelKey, lang)}</span>
                    <span className="pv3-menu-sub">{tr(m.subKey, lang)}</span>
                  </motion.button>
                </div>
              ))}
            </nav>

            <div className="pv3-menu-foot">
              <span>ZARA · BORNOVA 3643</span>
              <span>{tr("a.noscore", lang)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pusula-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {view === "bugun" && <Bugun onGo={go} onPeek={setPeek} />}
            {view === "ekip" && <Ekip onPeek={setPeek} />}
            {view === "profil" && <Profil person={selected} onSelect={setSelected} />}
            {view === "defter" && <GelisimDefteri />}
            {view === "hafiza" && <OgrenenHafiza />}
            {view === "usta" && <UstaYolu />}
            {view === "yerlestirme" && <Yerlestirme applied={applied} onApply={setApplied} />}
            {view === "saha" && <SahaKrokisi />}
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
