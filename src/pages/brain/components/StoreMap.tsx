import { useState } from "react";
import { Avatar, Icon } from "../primitives";
import { rankForZone, ZONE_LABEL, type Zone } from "../model";
import { ROSTER, CHEMISTRY, ZONE_SIGNAL } from "../data";

/**
 * Mağaza Krokisi — AI üretimli kat planı üzerinden CANLI trafik tavsiyesi.
 * Alanlar tahmini trafik (ZONE_SIGNAL.load) ile boyutlanır/pulse eder; tıkla →
 * model.rankForZone'dan türeyen "kimi koy, neden" önerisi açılır. Tek bir chart
 * yerine sahanın kendisi üzerinden öneri.
 */

const GOLD = "var(--zara-gold)";

type Spot = { zone: Zone; x: number; y: number; icon: string };
const SPOTS: Spot[] = [
  { zone: "DEPO", x: 17, y: 22, icon: "package" },
  { zone: "KABIN", x: 78, y: 19, icon: "shirt" },
  { zone: "SALON", x: 45, y: 47, icon: "layout-grid" },
  { zone: "KASA", x: 71, y: 58, icon: "shopping-bag" },
  { zone: "GIRIS", x: 46, y: 84, icon: "log-in" },
];

function level(load: number) {
  return load >= 85 ? "Zirve" : load >= 62 ? "Yoğun" : load >= 40 ? "Dengede" : "Sakin";
}
function dotSize(load: number) {
  return Math.round(40 + (load / 100) * 26); // 40–66px
}

export function StoreMap() {
  const [sel, setSel] = useState<Zone>("KABIN");
  const sig = ZONE_SIGNAL[sel];
  const ranked = rankForZone(ROSTER, sel, CHEMISTRY).slice(0, 2);
  const lvl = level(sig.load);
  const hot = sig.load >= 85;

  const advice =
    sig.load >= 85
      ? `Zirveye hazırlan: ${ranked.map((r) => r.person.short).join(" + ")} ile kapsamayı güçlendir.`
      : sig.load >= 62
        ? `Yoğunlaşıyor — ${ranked[0].person.short} burada en güçlü seçenek.`
        : sig.sales >= 80
          ? `Trafik düşük ama satış değeri yüksek; ${ranked[0].person.short} ile dönüşümü koru.`
          : "Dengede — ekstra kadro gerekmez, esnek tut.";

  return (
    <div className="zmap-wrap">
      {/* kroki sahnesi */}
      <div className="zmap-stage">
        <svg className="zmap-svg" viewBox="0 0 760 560" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {/* dış sınır */}
          <rect x="24" y="24" width="712" height="512" fill="none" stroke="rgba(26,22,20,0.18)" strokeWidth="2" />
          {/* iç bölmeler (soft) */}
          {[
            [40, 40, 240, 150], [300, 40, 200, 120], [520, 40, 196, 170],
            [40, 210, 200, 300], [560, 240, 156, 130], [300, 360, 220, 150],
          ].map((r, i) => (
            <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill="rgba(26,22,20,0.03)" stroke="rgba(26,22,20,0.08)" strokeWidth="1" />
          ))}
          {/* giriş çizgisi */}
          <line x1="300" y1="536" x2="500" y2="536" stroke="rgba(184,147,90,0.5)" strokeWidth="2" strokeDasharray="4 5" />
        </svg>

        {SPOTS.map((s) => {
          const z = ZONE_SIGNAL[s.zone];
          const size = dotSize(z.load);
          const isHot = z.load >= 85;
          const on = sel === s.zone;
          return (
            <button key={s.zone} className="zmap-marker" style={{ left: `${s.x}%`, top: `${s.y}%` }} onClick={() => setSel(s.zone)}>
              <span className={`zmap-dot ${isHot ? "hot" : ""} ${on ? "on" : ""}`} style={{ width: size, height: size }}>
                <span className="zmap-ring" />
                <Icon name={s.icon} size={Math.round(size * 0.42)} />
              </span>
              <span className="zmap-lab">
                {ZONE_LABEL[s.zone].tr} {isHot ? <b>· {z.load}%</b> : `· ${z.load}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* tavsiye paneli */}
      <div className="zmap-panel">
        <div className="zp-eb">SEÇİLİ ALAN · {ZONE_LABEL[sel].en.toUpperCase()}</div>
        <div className="zp-title">{ZONE_LABEL[sel].tr}</div>

        <div className="zmap-meters">
          <div className="zp-meter">
            <div className="m-k">Trafik</div>
            <div className="m-v num" style={{ color: hot ? GOLD : "var(--zara-ink)" }}>{sig.load}%</div>
            <div className="zp-bar"><i style={{ width: `${sig.load}%`, background: hot ? GOLD : "var(--zara-ink)" }} /></div>
          </div>
          <div className="zp-meter">
            <div className="m-k">Satış endeksi</div>
            <div className="m-v num">{sig.sales}</div>
            <div className="zp-bar"><i style={{ width: `${sig.sales}%`, background: "var(--zara-bronze)" }} /></div>
          </div>
        </div>

        <div className="zp-advice">
          <span className="zp-badge" style={{ color: hot ? GOLD : "var(--zara-ink-65)", background: hot ? "var(--zara-gold-tint)" : "var(--zara-bg-alt)", border: `1px solid ${hot ? GOLD : "var(--zara-line-strong)"}` }}>
            <Icon name={hot ? "target" : "check"} size={11} /> {lvl}
          </span>
          <div className="zp-people">
            {ranked.map((r) => (
              <div className="zp-person" key={r.person.id}>
                <Avatar person={r.person} size={28} />
                <span style={{ fontFamily: "var(--ff-display)", fontSize: 15 }}>{r.person.name}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--ff-mono)", fontSize: 11, color: GOLD }} className="num">{r.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="zp-hint">{advice}</div>
        </div>
      </div>
    </div>
  );
}
