import { useState } from "react";
import { Eyebrow, Headline, Icon, Button } from "../primitives";
import { predictAttainment, updateWeights, OBJECTIVES, type Objective } from "../model";
import { HISTORY, INITIAL_WEIGHTS, OBJECTIVE_LABEL } from "../data";

const GOLD = "var(--zara-gold)";
const INK = "var(--zara-ink)";
const INK2 = "var(--zara-ink-2)";
const LINE = "var(--zara-line)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";
const PAPER = "var(--zara-bg)";
const FAINT = "var(--zara-ink-40)";

const LOOP_NODES = [
  { tr: "Bağlam", en: "Context", icon: "cloud-sun", desc: "Cuma · hava · takvim · notlar" },
  { tr: "Brain muhakeme eder", en: "Brain reasons", icon: "brain", desc: "hafıza + Graph RAG → ne, neden" },
  { tr: "Twin optimize eder", en: "Twin optimizes", icon: "activity", desc: "CP-SAT + öğrenilen hedef" },
  { tr: "Yönetici onayı", en: "Manager approves", icon: "hand", desc: "human-in-the-loop · öneri", human: true },
  { tr: "Vardiya çalışır", en: "Shift runs", icon: "store", desc: "plan sahada uygulanır" },
  { tr: "KPI geri akar", en: "KPIs flow back", icon: "repeat", desc: "Buenas Dias · per-ticket" },
];

export function Loop() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <Headline ital="Kapalı" roman="Döngü" size={34} />
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginTop: 8 }}>TEK ÜRÜN · İKİ MOTOR · BİR ÖĞRENEN DÖNGÜ</div>
        </div>
        <Eyebrow>· BRAIN ↔ TWIN · decision_log</Eyebrow>
      </div>

      <p style={{ maxWidth: 640, margin: "0 auto 18px", textAlign: "center", fontFamily: "var(--ff-display)", fontSize: 18, lineHeight: 1.5, color: INK2 }}>
        Brain <em style={{ fontStyle: "italic" }}>bağlamı ve gerekçeyi</em> üretir; Twin <em style={{ fontStyle: "italic" }}>optimizasyonu ve öğrenmeyi</em>. Her vardiya sonucu ikisini de besler — sistem ne yaptığını ve sonucunu hatırlar.
      </p>

      <div className="brain-card" style={{ marginBottom: 22 }}>
        <LoopDiagram />
      </div>

      <LearningDemo />
    </div>
  );
}

function LoopDiagram() {
  const cx = 380;
  const cy = 300;
  const r = 232;
  const pos = LOOP_NODES.map((_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const arrows = LOOP_NODES.map((_, i) => {
    const a = ((-90 + (i + 0.5) * 60) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const rot = (Math.atan2(Math.cos(a), -Math.sin(a)) * 180) / Math.PI;
    return { x, y, rot };
  });
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 760, margin: "0 auto", aspectRatio: "760 / 600" }}>
      <svg viewBox="0 0 760 600" width="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--zara-gold)" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" opacity="0.85" />
        {arrows.map((ar, i) => (
          <g key={i} transform={`translate(${ar.x},${ar.y}) rotate(${ar.rot})`}>
            <path d="M-5,-5 L5,0 L-5,5" fill="none" stroke="var(--zara-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <image href="/zt-mark-gold.png" x={cx - 24} y={cy - 58} height="46" />
        <text x={cx} y={cy + 6} textAnchor="middle" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontStyle: "italic", fill: "var(--zara-ink)" }}>Store Intelligence</text>
        <text x={cx} y={cy + 30} textAnchor="middle" style={{ fontFamily: "var(--ff-display)", fontSize: 22, fill: "var(--zara-ink)" }}>Loop</text>
        <text x={cx} y={cy + 52} textAnchor="middle" style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.3em", fill: "var(--zara-gold)" }}>KAPALI DÖNGÜ</text>
      </svg>
      {LOOP_NODES.map((n, i) => (
        <div key={i} style={{ position: "absolute", left: `${(pos[i].x / 760) * 100}%`, top: `${(pos[i].y / 600) * 100}%`, transform: "translate(-50%, -50%)", width: 168 }}>
          <div style={{ background: n.human ? INK : "var(--zara-bg-white)", color: n.human ? PAPER : INK, border: `1px solid ${n.human ? GOLD : LINE_STRONG}`, padding: "12px 14px", boxShadow: n.human ? "0 0 0 4px rgba(191,149,80,0.14)" : "var(--shadow-xs)", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: n.human ? GOLD : "var(--zara-bg-warm)", color: n.human ? INK : GOLD }}>
                <Icon name={n.icon} size={15} />
              </span>
            </div>
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 7.5, letterSpacing: "0.2em", textTransform: "uppercase", color: n.human ? "var(--zara-gold-soft)" : FAINT, marginBottom: 4 }}>{n.human ? "★ İNSAN · HUMAN" : `0${i + 1}`}</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 15, lineHeight: 1.15, marginBottom: 4 }}>{n.tr}</div>
            <div style={{ fontFamily: "var(--ff-sans)", fontSize: 10.5, lineHeight: 1.4, color: n.human ? "rgba(245,241,234,0.78)" : MUTED }}>{n.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** İnteraktif kapalı-döngü: her tıkta bir geçmiş vardiyayı işle → ağırlıklar
 *  güncellenir, tahmin hatası küçülür. Öğrenme gerçekten çalışıyor — canlı. */
function LearningDemo() {
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [step, setStep] = useState(0);
  const [lastErr, setLastErr] = useState<{ before: number; after: number; date: string } | null>(null);

  const done = step >= HISTORY.length;
  const processStep = () => {
    if (done) return;
    const d = HISTORY[step];
    if (d.bdActual == null) {
      setStep((s) => s + 1);
      return;
    }
    const before = Math.abs(d.bdActual - predictAttainment(weights, d.satisfaction));
    const next = updateWeights(weights, { satisfaction: d.satisfaction, bdActual: d.bdActual });
    const after = Math.abs(d.bdActual - predictAttainment(next, d.satisfaction));
    setWeights(next);
    setLastErr({ before: +before.toFixed(1), after: +after.toFixed(1), date: d.date });
    setStep((s) => s + 1);
  };
  const reset = () => {
    setWeights(INITIAL_WEIGHTS);
    setStep(0);
    setLastErr(null);
  };

  const max = Math.max(...OBJECTIVES.map((o) => weights[o]));
  return (
    <div className="brain-card gold-top">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Eyebrow gold>CANLI ÖĞRENME · updateWeights()</Eyebrow>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.16em", color: MUTED }}>{step} / {HISTORY.length} vardiya işlendi</span>
      </div>
      <p style={{ margin: "0 0 16px", fontFamily: "var(--ff-sans)", fontSize: 13, color: INK2, lineHeight: 1.6, maxWidth: 640 }}>
        Her gerçekleşen vardiya bir <em style={{ fontStyle: "italic" }}>episode</em>. Sonucu işleyince Twin, o gün işe yarayan hedeflerin ağırlığını yükseltir — tahmin hatası adım adım küçülür. Matematiksel çıktı + öğrenme; sihir değil.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {OBJECTIVES.map((o: Objective) => (
          <div key={o}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12, color: INK }}>{OBJECTIVE_LABEL[o].tr}</span>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: INK2, fontVariantNumeric: "tabular-nums" }}>{weights[o].toFixed(2)}</span>
            </div>
            <div style={{ height: 7, background: "var(--zara-bg-alt)", border: `1px solid ${LINE}` }}>
              <div style={{ height: "100%", width: `${(weights[o] / max) * 100}%`, background: o === "kabinPeak" ? GOLD : INK2, transition: "width 500ms var(--ease-atelier)" }} />
            </div>
          </div>
        ))}
      </div>

      {lastErr && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--zara-gold-tint)", border: `1px solid ${GOLD}`, marginBottom: 16 }}>
          <Icon name="trending-up" size={15} style={{ color: GOLD }} />
          <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: INK2 }}>
            <strong>{lastErr.date}</strong> işlendi — tahmin hatası <span className="num">{lastErr.before}</span> → <span className="num" style={{ color: GOLD }}>{lastErr.after}</span> puan.
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Button primary icon={done ? "check" : "activity"} onClick={processStep}>
          {done ? "Tüm vardiyalar işlendi" : "Bir sonraki vardiyayı işle"}
        </Button>
        <Button icon="repeat" onClick={reset}>Sıfırla</Button>
      </div>
    </div>
  );
}
