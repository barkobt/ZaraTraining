import { useMemo } from "react";
import { Eyebrow, Headline, Icon, Marker } from "../primitives";
import { predictLoad, predictAttainment, learnWeights } from "../model";
import { HISTORY, INITIAL_WEIGHTS, TODAY, TODAY_SATISFACTION } from "../data";

const GOLD = "var(--zara-gold)";
const GOLD_SOFT = "var(--zara-gold-soft)";
const INK = "var(--zara-ink)";
const INK2 = "var(--zara-ink-2)";
const PAPER = "var(--zara-bg)";
const PAPER_ALT = "var(--zara-bg-alt)";
const PAPER_WARM = "var(--zara-bg-warm)";
const WHITE = "var(--zara-bg-white)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";
const FAINT = "var(--zara-ink-40)";
const EMERALD = "var(--zara-emerald)";

export function Impact() {
  // Model'den türeyen iki değer (gerisi pilot demo göstergeleri)
  const { attGain, peakCoverage } = useMemo(() => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    const learned = learnWeights(INITIAL_WEIGHTS, HISTORY).weights;
    const attGain = Math.round(
      predictAttainment(learned, TODAY_SATISFACTION) - predictAttainment(INITIAL_WEIGHTS, TODAY_SATISFACTION),
    );
    return { attGain, peakCoverage: Math.max(...load.hourly) };
  }, []);

  const KPIS = [
    { metric: "−42", unit: "dk", label: "PLANLAMA SÜRESİ / GÜN", en: "Planning time saved", sub: "yöneticinin sabahı geri döner", icon: "clock" },
    { metric: `+${attGain}`, unit: "puan", label: "BD HEDEF TUTTURMA", en: "Attainment uplift", sub: "soyut skor değil, gerçek sonuç", icon: "target", accent: true },
    { metric: String(peakCoverage), unit: "%", label: "KABİN KAPSAMA · PEAK", en: "Peak coverage", sub: "Cuma 19:00 artık boş kalmıyor", icon: "users" },
    { metric: "3", unit: "hafta", label: "TURNOVER ERKEN-UYARI", en: "Turnover early-warning", sub: "ayrılış sinyali önceden", icon: "bell" },
  ];

  const cols = 22;
  const rows = 7;
  const dots = Array.from({ length: cols * rows }, (_, i) => i);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <Headline ital="Etki" roman="& Ölçek" size={34} />
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginTop: 8 }}>ZATEN ÇALIŞAN BİR SİSTEMİN ÜZERİNDE · KISA PİLOT YOLU</div>
        </div>
        <Eyebrow>· IMPACT · MEASURABLE</Eyebrow>
      </div>

      <Marker left="ÖLÇÜLEBİLİR ETKİ" right="PER STORE · PER DAY" />
      <div style={{ display: "flex", marginBottom: 28, flexWrap: "wrap" }}>
        {KPIS.map((k, i) => (
          <div key={k.label} style={{ flex: "1 1 200px", marginLeft: i ? -1 : 0 }}>
            <div style={{ background: k.accent ? WHITE : PAPER_ALT, border: `1px solid ${k.accent ? GOLD : LINE_STRONG}`, padding: "22px 22px 20px", position: "relative", height: "100%" }}>
              {k.accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, maxWidth: 120, lineHeight: 1.5 }}>{k.label}</span>
                <Icon name={k.icon} size={15} style={{ color: k.accent ? GOLD : FAINT }} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 18 }}>
                <span style={{ fontFamily: "var(--ff-display)", fontSize: 52, lineHeight: 0.9, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{k.metric}</span>
                <span style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: k.accent ? GOLD : MUTED }}>{k.unit}</span>
              </div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: FAINT, marginTop: 8 }}>{k.en}</div>
              <div style={{ fontFamily: "var(--ff-sans)", fontSize: 12, fontStyle: "italic", color: MUTED, marginTop: 6 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 1 mağaza → tüm ağ */}
      <div style={{ background: INK, color: PAPER, padding: "30px 34px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 90% at 100% 50%, rgba(184,147,90,0.16), transparent 60%)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(240px, auto) 1fr", gap: 40, alignItems: "center" }} className="impact-scale">
          <div>
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.26em", textTransform: "uppercase", color: GOLD_SOFT, marginBottom: 12 }}>· PİLOT → AĞ</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 36, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
              <em style={{ fontStyle: "italic", fontWeight: 300 }}>Bir</em> mağaza,<br />sonra <em style={{ fontStyle: "italic", fontWeight: 300 }}>tüm</em> ağ.
            </div>
            <p style={{ margin: "14px 0 0", fontFamily: "var(--ff-sans)", fontSize: 13, lineHeight: 1.6, color: "rgba(245,241,234,0.72)", maxWidth: 280 }}>
              Bornova 3643'te öğrenilen motor, her mağazaya kendi sonuçlarından öğrenerek ölçeklenir. Soğuk başlangıç benzer mağaza önsellerinden transfer edilir.
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 40, color: GOLD }}>1</span>
              <Icon name="arrow-right" size={18} style={{ color: GOLD_SOFT }} />
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 40 }}>570<span style={{ fontSize: 22, color: GOLD_SOFT }}>+</span></span>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,241,234,0.5)", maxWidth: 110, lineHeight: 1.5 }}>MAĞAZA · İSPANYA + TÜRKİYE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
              {dots.map((i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === 0 ? GOLD : "rgba(245,241,234,0.22)", boxShadow: i === 0 ? "0 0 0 3px rgba(184,147,90,0.3)" : "none" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* sürdürülebilirlik */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", border: `1px solid ${LINE_STRONG}`, background: PAPER_WARM }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(5,150,105,0.1)", color: EMERALD, flexShrink: 0 }}>
          <Icon name="leaf" size={16} />
        </span>
        <span style={{ fontFamily: "var(--ff-sans)", fontSize: 13.5, color: INK2, lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 600 }}>Sürdürülebilirlik, ölçülü bir ek olarak:</strong> aynı motor, isteğe bağlı bir yeşil KPI terimiyle <em style={{ fontStyle: "italic" }}>over-staffing</em> (gereksiz enerji/aydınlatma yükü) ve <em style={{ fontStyle: "italic" }}>circularity</em> görev kapsamasını (take-back, onarım kabulü) da optimize eder.
        </span>
      </div>
    </div>
  );
}
