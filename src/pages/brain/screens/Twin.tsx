import { useMemo } from "react";
import { Eyebrow, Headline, Icon, Marker, LiveDot } from "../primitives";
import { learnWeights, predictAttainment, meanAbsError, OBJECTIVES } from "../model";
import { HISTORY, INITIAL_WEIGHTS, TODAY_SATISFACTION, CHEMISTRY, OBJECTIVE_LABEL } from "../data";

const GOLD = "var(--zara-gold)";
const INK = "var(--zara-ink)";
const INK2 = "var(--zara-ink-2)";
const LINE = "var(--zara-line)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";
const FAINT = "var(--zara-ink-40)";
const STONE = "var(--zara-stone)";
const BRONZE = "var(--zara-bronze)";

export function Twin() {
  const learned = useMemo(() => learnWeights(INITIAL_WEIGHTS, HISTORY), []);
  const mae = useMemo(() => meanAbsError(learned.weights, HISTORY), [learned]);

  // tahmin vs gerçek serisi: store = öğrenilen ağırlıkla tahmin, actual = gerçek
  const series = useMemo(() => {
    const rows = HISTORY.map((d) => ({
      d: d.date,
      paper: predictAttainment(INITIAL_WEIGHTS, d.satisfaction),
      store: predictAttainment(learned.weights, d.satisfaction),
      actual: d.bdActual,
    }));
    rows.push({
      d: TODAY_SATISFACTION ? "06 Haz" : "",
      paper: predictAttainment(INITIAL_WEIGHTS, TODAY_SATISFACTION),
      store: predictAttainment(learned.weights, TODAY_SATISFACTION),
      actual: null,
    });
    return rows;
  }, [learned]);

  const paperToday = predictAttainment(INITIAL_WEIGHTS, TODAY_SATISFACTION);
  const storeToday = predictAttainment(learned.weights, TODAY_SATISFACTION);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Headline ital="Performans" roman="İkizi" size={34} />
            <LiveDot label="ÖĞRENİYOR" />
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED }}>PREDICT-THEN-OPTIMIZE · HER VARDİYA = 1 EPİSODE</div>
        </div>
        <Eyebrow>· {HISTORY.length} EPİSODE · MAE {mae.toFixed(1)} PUAN</Eyebrow>
      </div>

      {/* hero karşılaştırma */}
      <Marker left="KÂĞIT ÜZERİNDE vs BU MAĞAZADA" right="OPTIMAL-ON-PAPER → BEST-IN-STORE" />
      <div style={{ display: "flex", gap: 0, alignItems: "stretch", marginBottom: 30, flexWrap: "wrap" }}>
        <CompareCard
          dim
          tag="KÂĞIT ÜZERİNDE OPTİMAL"
          en="OPTIMAL ON PAPER"
          title="Hedeflere eşit ağırlık"
          metric={Math.round(paperToday)}
          sub="Soyut skoru maksimize eder — gerçek sonucu görmez."
          points={[["equal", "Yetkinliği eşit dağıtır"], ["x", "Kabin 19:00'da eksik kalır"], ["minus", "Per-ticket sabit"]]}
        />
        <div style={{ display: "grid", placeItems: "center", padding: "0 14px" }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="arrow-right" size={22} style={{ color: GOLD }} />
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginTop: 6 }}>öğrenildi</div>
          </div>
        </div>
        <CompareCard
          accent
          tag="BU MAĞAZADA EN İYİ"
          en="BEST IN THIS STORE"
          title="Gerçek sonuçtan öğrenildi"
          metric={Math.round(storeToday)}
          sub="Bu mağazanın kendi KPI'larından öğrenir."
          points={[["target", "Kabini peak'te yoğunlaştırır"], ["check", "Selin + Ayşe sinerjisini kullanır"], ["trending-up", `+${Math.round(storeToday - paperToday)} puan tahmini tutturma`]]}
        />
      </div>

      {/* destek satırı */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 20 }}>
        <PredActual series={series} mae={mae} />
        <WeightBars learned={learned} />
      </div>
      <Chemistry />
    </div>
  );
}

function CompareCard({ tag, en, title, metric, sub, points, accent, dim }: { tag: string; en: string; title: string; metric: number; sub: string; points: [string, string][]; accent?: boolean; dim?: boolean }) {
  return (
    <div style={{ flex: "1 1 280px", background: dim ? "var(--zara-bg-alt)" : "var(--zara-bg-white)", border: `1px solid ${accent ? GOLD : LINE_STRONG}`, padding: "24px 26px", position: "relative" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />}
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: accent ? GOLD : MUTED }}>· {tag}</div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color: FAINT, marginTop: 3 }}>{en}</div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, marginTop: 14, color: dim ? MUTED : INK }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
        <span style={{ fontFamily: "var(--ff-display)", fontSize: 56, lineHeight: 0.9, letterSpacing: "-0.02em", color: dim ? STONE : INK, fontVariantNumeric: "tabular-nums" }}>{metric}</span>
        <span style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: dim ? STONE : GOLD }}>%</span>
      </div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginTop: 6 }}>BD HEDEF TUTTURMA</div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 8 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
            <Icon name={p[0]} size={12} style={{ color: accent ? GOLD : FAINT, position: "relative", top: 2 }} />
            <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: dim ? MUTED : INK2, lineHeight: 1.45 }}>{p[1]}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontFamily: "var(--ff-sans)", fontSize: 12, fontStyle: "italic", color: dim ? FAINT : MUTED }}>{sub}</div>
    </div>
  );
}

function PredActual({ series, mae }: { series: { d: string; paper: number; store: number; actual: number | null }[]; mae: number }) {
  const W = 380;
  const H = 150;
  const padB = 26;
  const padT = 14;
  const padL = 4;
  const padR = 8;
  const lo = 60;
  const hi = 100;
  const x = (i: number) => padL + ((W - padL - padR) * i) / (series.length - 1);
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - lo) / (hi - lo));
  const storeLine = "M" + series.map((p, i) => `${x(i)},${y(p.store)}`).join(" L");
  return (
    <div className="brain-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <Eyebrow gold>TAHMİN vs GERÇEK · PREDICTED vs ACTUAL</Eyebrow>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.14em", color: MUTED }}>MAE {mae.toFixed(1)} puan</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {[lo, 80, hi].map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="var(--zara-line)" strokeWidth="1" />
            <text x={W} y={y(g) + 3} textAnchor="end" style={{ fontFamily: "var(--ff-mono)", fontSize: 8, fill: "var(--zara-ink-40)" }}>{g}</text>
          </g>
        ))}
        <path d={storeLine} fill="none" stroke="var(--zara-gold)" strokeWidth="2" />
        {series.map((p, i) => p.actual != null && <circle key={i} cx={x(i)} cy={y(p.actual)} r="4" fill="var(--zara-ink)" />)}
        {series.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.store)} r="3" fill="var(--zara-bg)" stroke="var(--zara-gold)" strokeWidth="1.5" />
        ))}
        {series.map((p, i) => (
          <text key={i} x={x(i)} y={H - padB + 15} textAnchor="middle" style={{ fontFamily: "var(--ff-mono)", fontSize: 8, fill: i === series.length - 1 ? "var(--zara-gold)" : "var(--zara-ink-40)" }}>{p.d}</text>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
          <span style={{ width: 16, height: 2, background: GOLD }} />Twin tahmini
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: INK }} />gerçekleşen
        </span>
      </div>
    </div>
  );
}

function WeightBars({ learned }: { learned: ReturnType<typeof learnWeights> }) {
  const max = Math.max(...OBJECTIVES.map((o) => learned.weights[o]));
  return (
    <div className="brain-card">
      <Eyebrow gold style={{ marginBottom: 16 }}>ÖĞRENİLEN HEDEF AĞIRLIKLARI · LEARNED OBJECTIVE</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {OBJECTIVES.map((o) => {
          const w = learned.weights[o];
          const up = learned.delta[o] > 0.005;
          return (
            <div key={o}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: INK }}>
                  {OBJECTIVE_LABEL[o].tr}
                  {up && <span style={{ marginLeft: 8, fontFamily: "var(--ff-mono)", fontSize: 8.5, letterSpacing: "0.12em", color: GOLD }}>▲ ARTTI</span>}
                </span>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: INK2, fontVariantNumeric: "tabular-nums" }}>{w.toFixed(2)}</span>
              </div>
              <div style={{ height: 8, background: "var(--zara-bg-alt)", border: `1px solid ${LINE}` }}>
                <div style={{ height: "100%", width: `${(w / max) * 100}%`, background: up ? GOLD : INK2, transition: "width 800ms var(--ease-atelier)" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, paddingTop: 13, borderTop: `1px solid ${LINE}`, display: "flex", gap: 9, alignItems: "baseline" }}>
        <Icon name="lock" size={13} style={{ color: INK, position: "relative", top: 2 }} />
        <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: INK2, lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 600 }}>Sert kısıtlar sert kalır.</strong> İş kanunu, müsaitlik ve adalet kuralları öğrenmeye kapalıdır — yalnızca <em style={{ fontStyle: "italic" }}>hedef fonksiyonu</em> öğrenilir.
        </span>
      </div>
    </div>
  );
}

function Chemistry() {
  return (
    <div style={{ background: "var(--zara-bg-warm)", border: `1px solid ${LINE_STRONG}`, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <Eyebrow gold>TAKIM KİMYASI · TEAM CHEMISTRY</Eyebrow>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.14em", color: MUTED }}>öğrenilen sinerji</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CHEMISTRY.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", minWidth: 130 }}>
              <span style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: 16 }}>{c.a}</span>
              <Icon name="plus" size={11} style={{ color: GOLD, margin: "0 6px" }} />
              <span style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: 16 }}>{c.b}</span>
            </div>
            <div style={{ flex: 1, minWidth: 80, height: 6, background: "var(--zara-bg-alt)", border: `1px solid ${LINE}` }}>
              <div style={{ height: "100%", width: `${c.v * 100}%`, background: c.v > 0.85 ? GOLD : c.v > 0.6 ? BRONZE : STONE }} />
            </div>
            <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: INK2, minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.v.toFixed(2)}</span>
            <span style={{ fontFamily: "var(--ff-sans)", fontSize: 11.5, fontStyle: "italic", color: MUTED, minWidth: 160 }}>{c.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
