import { useMemo } from "react";
import { Eyebrow, Headline, Icon, Marker } from "../primitives";
import {
  scorePlan, loadByBlock, predictLoad, predictAttainment, learnWeights,
} from "../model";
import { ROSTER, BLOCKS, PLAN, HISTORY, INITIAL_WEIGHTS, TODAY, TODAY_SATISFACTION } from "../data";

const GOLD = "var(--zara-gold)";
const INK2 = "var(--zara-ink-2)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";

export function Impact() {
  const { net, attGain } = useMemo(() => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    const blockLoad = loadByBlock(load, BLOCKS);
    const net = scorePlan(ROSTER, PLAN, BLOCKS, blockLoad).net;
    const learned = learnWeights(INITIAL_WEIGHTS, HISTORY).weights;
    const attGain = predictAttainment(learned, TODAY_SATISFACTION) - predictAttainment(INITIAL_WEIGHTS, TODAY_SATISFACTION);
    return { net, attGain };
  }, []);

  // ölçek projeksiyonu — tek mağazadan zincire (demo varsayımları açıkça yazılı)
  const perTicket = +(attGain * 0.9).toFixed(1); // tutturma puanı → ~per-ticket %
  const stores = 48; // Türkiye ZARA (yaklaşık)
  const dailyTL = Math.round(net * 1200); // 1 BD puanı ≈ 1.2k TL/gün (demo katsayı)
  const yearlyChain = Math.round((dailyTL * stores * 300) / 1_000_000); // milyon TL/yıl

  const kpis = [
    { k: "Tahmini tutturma kazancı", v: `+${Math.round(attGain)}`, u: "puan", note: "kâğıt → bu mağaza", icon: "trending-up" },
    { k: "Per-ticket etkisi", v: `+${perTicket}`, u: "%", note: "kabin peak kapsama", icon: "target" },
    { k: "Net plan katkısı", v: `+${net.toFixed(1)}`, u: "puan", note: "bugünün planı · Σ lift", icon: "activity" },
    { k: "Günlük tahmini etki", v: `${dailyTL.toLocaleString("tr-TR")}`, u: "TL", note: "tek mağaza · demo katsayı", icon: "store" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <Headline ital="Etki" roman="& Ölçek" size={34} />
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginTop: 8 }}>MODELDEN TÜREYEN PROJEKSİYON · DEMO KATSAYILAR AÇIK</div>
        </div>
        <Eyebrow>· {HISTORY.length} EPİSODE</Eyebrow>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0, border: `1px solid ${LINE_STRONG}`, marginBottom: 26 }}>
        {kpis.map((s, i) => (
          <div key={s.k} style={{ padding: "22px 24px", borderRight: i < kpis.length - 1 ? `1px solid var(--zara-line)` : "none", borderBottom: "1px solid var(--zara-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Icon name={s.icon} size={14} style={{ color: GOLD }} />
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>{s.k}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }} className="num">{s.v}</span>
              <span style={{ fontFamily: "var(--ff-sans)", fontSize: 15, color: "var(--zara-ink-40)" }}>{s.u}</span>
            </div>
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, color: "var(--zara-ink-40)", marginTop: 9, letterSpacing: "0.04em" }}>{s.note}</div>
          </div>
        ))}
      </div>

      <Marker left="TEK MAĞAZADAN ZİNCİRE" right="SCALE-OUT" />
      <div className="brain-card gold-top">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }} className="num">~{yearlyChain}M</span>
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: GOLD }}>TL / yıl</span>
          <span style={{ fontFamily: "var(--ff-sans)", fontSize: 13, color: MUTED, fontStyle: "italic", marginLeft: 8 }}>
            {stores} mağaza × ~300 gün × günlük etki (demo)
          </span>
        </div>
        <p style={{ margin: "16px 0 0", fontFamily: "var(--ff-sans)", fontSize: 13, color: INK2, lineHeight: 1.6, maxWidth: 680 }}>
          Aynı kapalı döngü her mağazada <em style={{ fontStyle: "italic" }}>kendi</em> KPI'ından öğrenir — merkezî tek bir model değil, mağaza-yerel ikizler.
          Katsayılar demo amaçlıdır; gerçek dağıtımda her mağazanın geçmiş Buenas Dias + per-ticket serisinden kalibre edilir.
        </p>
      </div>
    </div>
  );
}
