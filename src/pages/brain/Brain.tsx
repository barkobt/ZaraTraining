import { useState } from "react";
import { Link } from "react-router";
import { Icon } from "./primitives";
import { Briefing } from "./screens/Briefing";
import { Ask } from "./screens/Ask";
import { Twin } from "./screens/Twin";
import { Loop } from "./screens/Loop";
import { Impact } from "./screens/Impact";
import { UstaYolu } from "./screens/UstaYolu";

type ScreenId = "brief" | "ask" | "twin" | "usta" | "loop" | "impact";

const NAV: Array<{ sect: string } | { id: ScreenId; label: string; sub: string; icon: string }> = [
  { sect: "ZEKÂ · INTELLIGENCE" },
  { id: "brief", label: "Sabah Brifingi", sub: "Günlük okuma", icon: "sunrise" },
  { id: "ask", label: "Beyne Sor", sub: "Hafıza · sorgu", icon: "message-square" },
  { id: "twin", label: "Performans İkizi", sub: "Öğrenen motor", icon: "activity" },
  { id: "usta", label: "Usta Yolu", sub: "Gelişim · mentor", icon: "sprout" },
  { sect: "SUNUM · PITCH" },
  { id: "loop", label: "Kapalı Döngü", sub: "Sistem", icon: "repeat" },
  { id: "impact", label: "Etki", sub: "KPI · ölçek", icon: "trending-up" },
];

export default function Brain() {
  const [screen, setScreen] = useState<ScreenId>("brief");

  const SCREENS: Record<ScreenId, React.ReactNode> = {
    brief: <Briefing />,
    ask: <Ask />,
    twin: <Twin />,
    usta: <UstaYolu />,
    loop: <Loop />,
    impact: <Impact />,
  };

  return (
    <div className="zt-editorial brain-shell">
      <aside className="brain-aside">
        <div className="brain-brand">
          <div className="brain-brand-row">
            <img src="/zt-mark-gold.png" alt="" />
            <div>
              <div className="wm">Zara <em>Brain</em></div>
              <div className="sub">ZARA · ATELYE</div>
            </div>
          </div>
          <div className="gold-rule" />
        </div>

        <nav className="brain-nav">
          {NAV.map((item, i) =>
            "sect" in item ? (
              <div key={i} className="sect">{item.sect}</div>
            ) : (
              <button
                key={item.id}
                className={`brain-navitem ${screen === item.id ? "on" : ""}`}
                onClick={() => setScreen(item.id)}
              >
                <Icon name={item.icon} size={15} />
                <span className="ni-l">
                  <span className="ni-t">{item.label}</span>
                  <span className="ni-s">{item.sub}</span>
                </span>
              </button>
            ),
          )}
          <div className="sect">AİLE · FAMILY</div>
          <Link className="brain-fam" to="/shift-organizer">
            <Icon name="layout-grid" size={14} />
            <span>Shift Organizer</span>
            <Icon name="arrow-up-right" size={12} />
          </Link>
          <Link className="brain-fam" to="/buenas-dias">
            <Icon name="sunrise" size={14} />
            <span>Buenas Dias</span>
            <Icon name="arrow-up-right" size={12} />
          </Link>
        </nav>

        <div className="brain-foot">
          <div className="st">ZARA Bornova</div>
          <div className="lc">NO 3643 · BORNOVA, İZMİR</div>
        </div>
      </aside>

      <main className="brain-main">{SCREENS[screen]}</main>
    </div>
  );
}
