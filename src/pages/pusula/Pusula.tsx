import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BookOpen,
  CircleUser,
  GraduationCap,
  LayoutGrid,
  Lock,
  Map,
  Newspaper,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { LiveDot } from "../brain/primitives";
import { PusulaMark } from "./components/PusulaMark";
import { trpc } from "@/providers/trpc";
import type { Employee } from "./types";
import { employees, pocket } from "./data";
import { aptitudeSuggestions, discoveryFor } from "./data-competency";
import { mentorMatches } from "./data-mentor";
import { peekSession } from "./session-store";
import { Bugun } from "./views/Bugun";
import { Ekip } from "./views/Ekip";
import { Profil } from "./views/Profil";
import { Yerlestirme } from "./views/Yerlestirme";
import { GelisimDefteri } from "./views/GelisimDefteri";
import { OgrenenHafiza } from "./views/OgrenenHafiza";
import { UstaYolu } from "./views/UstaYolu";
import { SahaKrokisi } from "./views/SahaKrokisi";
import { Etki } from "./views/Etki";
import { ProfileDrawer } from "./components/ProfileDrawer";
import { useAuthGate } from "../shift-organizer/auth-gate";
import { LangCtx, LANGS, tr, setActiveLang, type Lang } from "./i18n";

type ViewId = "bugun" | "ekip" | "profil" | "defter" | "hafiza" | "usta" | "yerlestirme" | "saha" | "etki";

/** Tek düz liste — Zara menüsü gibi: dev tipografi, indeks, grup ayraçları. */
const MENU: Array<{ id: ViewId; labelKey: string; subKey: string; group?: string; Ico: typeof Users }> = [
  { id: "bugun", labelKey: "item.bugun", subKey: "sub.bugun", Ico: Newspaper },
  { id: "ekip", labelKey: "item.ekip", subKey: "sub.ekip", group: "nav.insan", Ico: Users },
  { id: "profil", labelKey: "item.profil", subKey: "sub.profil", Ico: CircleUser },
  { id: "defter", labelKey: "item.defter", subKey: "sub.defter", group: "nav.gelisim", Ico: BookOpen },
  { id: "hafiza", labelKey: "item.hafiza", subKey: "sub.hafiza", Ico: Archive },
  { id: "usta", labelKey: "item.usta", subKey: "sub.usta", Ico: GraduationCap },
  { id: "yerlestirme", labelKey: "item.yerlestirme", subKey: "sub.yerlestirme", group: "nav.sonuc", Ico: LayoutGrid },
  { id: "saha", labelKey: "item.saha", subKey: "sub.saha", Ico: Map },
  { id: "etki", labelKey: "item.etki", subKey: "sub.etki", Ico: TrendingUp },
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
// auth-gate.tsx ile AYNI anahtar — Pusula girişine özel ekran, aynı oturum.
const AUTH_KEY = "shift_organizer_auth_v1";

/** Pusula — ShiftOrganizer ile AYNI şifre; giriş ekranı Pusula'nın editorial dili. */
export default function Pusula() {
  const gate = useAuthGate("Pusula");
  const preview =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gatePreview");
  if (preview || (gate.required && !gate.authed)) {
    return <PusulaLogin preview={preview && !(gate.required && !gate.authed)} />;
  }
  return <PusulaInner />;
}

/** Ferah, monokrom giriş — aynı doğrulama (trpc.auth.check) + aynı token anahtarı. */
function PusulaLogin({ preview }: { preview?: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loginMut = trpc.auth.check.useMutation();
  const submit = () => {
    if (!password.trim()) return;
    loginMut.mutate(
      { token: password },
      {
        onSuccess: (r) => {
          if (r.ok) {
            localStorage.setItem(AUTH_KEY, password);
            window.location.reload();
          } else setError(tr("login.err", "tr"));
        },
        onError: () => setError(tr("login.err", "tr")),
      },
    );
  };
  return (
    <div className="zt-editorial pusula-shell pv4-login">
      <div className="pv4-login-card">
        <span className="pv4-login-eb">
          <Lock size={11} strokeWidth={1.8} /> {tr("login.eb", "tr")}
        </span>
        <div className="pv4-login-compass" aria-hidden>
          <PusulaMark size={54} />
        </div>
        <div className="pv4-login-mark">
          <em>Pusula</em>
        </div>
        <div className="pv4-login-store">ZARA · ATELYE · BORNOVA 3643</div>
        <p className="pv4-login-sub">{tr("login.sub", "tr")}</p>
        <input
          type="password"
          className="pv4-login-input"
          placeholder={tr("login.ph", "tr")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
          disabled={preview}
        />
        {error && <div className="pv4-login-err">{error}</div>}
        <button className="pusula-apply pv4-login-btn" onClick={submit} disabled={loginMut.isPending || preview}>
          {loginMut.isPending ? "…" : tr("login.btn", "tr")}
        </button>
        <div className="pv4-login-foot">{tr("a.noscore", "tr")}</div>
      </div>
    </div>
  );
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

  // menü sağ kolonu: CANLI hızlı aksiyonlar (session-store anlık okuma — reaktif gerekmiyor,
  // menü her açılışta yeniden render olur)
  const approved = peekSession<Record<string, boolean>>("apt.approved", {});
  const planned = peekSession<Record<string, boolean>>("disc.planned", {});
  const pendingApt = employees.reduce(
    (n, e) => n + aptitudeSuggestions(e.id).filter((s) => !approved[s.id]).length,
    0,
  );
  const pendingDisc = employees.reduce((n, e) => {
    const d = discoveryFor(e.id);
    return n + (d && !planned[`${e.id}:${d.comp}`] ? 1 : 0);
  }, 0);
  const QUICK: Array<{ group: string; items: Array<{ label: string; meta?: string; to: ViewId }> }> = [
    {
      group: "nav.insan",
      items: [
        { label: tr("item.ekip", lang), meta: `${employees.length}`, to: "ekip" },
        { label: tr("item.profil", lang), to: "profil" },
      ],
    },
    {
      group: "nav.gelisim",
      items: [
        { label: tr("m.pendingApt", lang), meta: `${pendingApt}`, to: "bugun" },
        { label: tr("m.discPlan", lang), meta: `${pendingDisc}`, to: "bugun" },
        { label: tr("m.todayPair", lang), meta: `${mentorMatches().length}`, to: "usta" },
      ],
    },
    {
      group: "nav.sonuc",
      items: [
        { label: tr("m.pocket", lang), meta: `${pocket.window} · %${pocket.convBefore[0]}`, to: "yerlestirme" },
        { label: tr("m.zoneNeeds", lang), to: "saha" },
        { label: tr("item.etki", lang), meta: "+9", to: "etki" },
      ],
    },
  ];

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
    <div className="zt-editorial pusula-shell pv4-withrail">
      {/* ── KALICI İKON RAYI — bölümler her an görünür (hover'da genişler) ── */}
      <nav className="pv4-rail" aria-label="Pusula">
        <div className="pv4-rail-mark" aria-hidden>
          <PusulaMark size={26} />
        </div>
        {MENU.map((m, i) => (
          <button
            key={m.id}
            className={`pv4-rail-item ${view === m.id ? "on" : ""}`}
            onClick={() => go(m.id)}
            title={tr(m.labelKey, lang)}
          >
            <m.Ico size={17} strokeWidth={1.5} />
            <span className="pv4-rail-label">
              <i>{String(i + 1).padStart(2, "0")}</i> {tr(m.labelKey, lang)}
            </span>
          </button>
        ))}
        {/* ayarlar rayın altında: dil + canlı (kullanıcı yönergesi) */}
        <div className="pv4-rail-foot">
          <div className="pv4-rail-lang">
            {LANGS.map((l) => (
              <button
                key={l}
                className={`pusula-lang-b ${lang === l ? "on" : ""}`}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <LiveDot label="" />
        </div>
      </nav>

      <div className="pv4-body">
      <header className="pusula-top">
        <button className="pusula-brand pusula-brand-home" onClick={() => go("bugun")} aria-label={tr("a11y.home", lang)}>
          <div>
            <div className="pusula-brand-name">
              <em>Pusula</em>
            </div>
            <div className="pusula-brand-sub">ZARA · ATELYE · BORNOVA</div>
          </div>
        </button>

        {/* bölüm künyesi — tıklayınca menü açılır */}
        <button className="pv3-crumb" onClick={() => setMenuOpen(true)}>
          <span className="pv3-crumb-idx">{String(idx + 1).padStart(2, "0")}</span>
          <span className="pv3-crumb-label">{tr(MENU[idx].labelKey, lang)}</span>
          <span className="pv3-crumb-sub">{tr(MENU[idx].subKey, lang)}</span>
        </button>

        <div className="pusula-right">
          {/* dil: desktop'ta rayın altında — burada yalnız mobil */}
          <div className="pusula-lang pv4-lang-top">
            {LANGS.map((l) => (
              <button key={l} className={`pusula-lang-b ${lang === l ? "on" : ""}`} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <LiveDot label="PUSULA" />
        </div>
      </header>

      {/* ── TAM-EKRAN MENÜ — Zara-web düzeni: solda dev liste, sağda indeksli aksiyonlar ── */}
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

            <div className="pv3-menu-cols">
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

              {/* sağ kolon — |01| indeksli CANLI hızlı aksiyonlar (Zara-web sağ sütunu) */}
              <aside className="pv3-menu-quick">
                <div className="pv3-quick-eb">{tr("m.actions", lang)}</div>
                {QUICK.map((g, gi) => (
                  <div key={g.group} className="pv3-quick-group">
                    <span className="pv3-quick-gid">
                      |{String(gi + 1).padStart(2, "0")}| {tr(g.group, lang)}
                    </span>
                    {g.items.map((it) => (
                      <motion.button
                        key={it.label}
                        className="pv3-quick-item"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.18 + gi * 0.06, ease: EASE }}
                        onClick={() => go(it.to)}
                      >
                        {it.label}
                        {it.meta && <i>{it.meta}</i>}
                      </motion.button>
                    ))}
                  </div>
                ))}
              </aside>
            </div>

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
            {view === "etki" && <Etki />}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>

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
