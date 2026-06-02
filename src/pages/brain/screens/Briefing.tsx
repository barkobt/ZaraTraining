import { useMemo } from "react";
import { Eyebrow, Headline, Icon, Marker, Button, Confidence, LiveDot } from "../primitives";
import { predictLoad, loadByBlock, scorePlan, ZONE_LABEL, type Zone } from "../model";
import { ROSTER, BLOCKS, PLAN, HISTORY, TODAY } from "../data";
import { StoreMap } from "../components/StoreMap";

const GOLD = "var(--zara-gold)";
const GOLD_SOFT = "var(--zara-gold-soft)";
const INK = "var(--zara-ink)";
const PAPER = "var(--zara-bg)";
const LINE = "var(--zara-line)";
const MUTED = "var(--zara-ink-50)";

export function Briefing() {
  const load = useMemo(() => predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek }), []);
  const blockLoad = useMemo(() => loadByBlock(load, BLOCKS), [load]);
  const plan = useMemo(() => scorePlan(ROSTER, PLAN, BLOCKS, blockLoad), [blockLoad]);

  return (
    <div>
      {/* başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: "1px solid var(--zara-line-strong)", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Headline ital="Sabah" roman="Brifingi" size={34} />
            <LiveDot label="CANLI" />
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED }}>{TODAY.full}</div>
        </div>
      </div>

      {/* DRAMATİK KOYU HERO (C) — uyarı + gold alan grafiği */}
      <div style={{ background: INK, color: PAPER, padding: "30px 34px", position: "relative", overflow: "hidden", marginBottom: 26 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 80% 0%, rgba(184,147,90,0.18), transparent 60%)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 36, alignItems: "center" }} className="brief-hero">
          <div>
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_SOFT, marginBottom: 12 }}>· UYARI · PREDICTED OVERLOAD</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 40, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
              <em style={{ fontStyle: "italic", fontWeight: 300 }}>Kabin</em>, {load.peakLabel}'da<br />zirve yapacak.
            </div>
            <p style={{ margin: "16px 0 0", fontFamily: "var(--ff-sans)", fontSize: 14, lineHeight: 1.6, color: "rgba(245,241,234,0.78)", maxWidth: 380 }}>
              Ağır Cuma sinyali. Son {load.support} benzer Cuma'nın hepsinde aynı saat zirve yaptı. Akşam ve kapanış bloğunu güçlü kabin performansıyla doldurun.
            </p>
            <div style={{ marginTop: 18 }}><Confidence value={load.confidence} support={load.support} /></div>
          </div>
          <div style={{ background: "rgba(245,241,234,0.04)", border: "1px solid rgba(184,147,90,0.25)", padding: "18px 20px" }}>
            <HotspotTimelineDark hourly={load.hourly} peakIndex={load.peakIndex} />
          </div>
        </div>
      </div>

      {/* MAĞAZA KROKİSİ — interaktif trafik tavsiyesi */}
      <Marker left="MAĞAZA KROKİSİ · CANLI TRAFİK" right="TIKLA · ÖNERİ AÇ" />
      <div style={{ marginBottom: 28 }}>
        <StoreMap />
      </div>

      {/* ÖNERİLEN PLAN + GEREKÇE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 28, alignItems: "start" }} className="brief-plan">
        <div>
          <Marker left="ÖNERİLEN PLAN" right={`NET +${plan.net.toFixed(1)} PUAN`} />
          <PlanGrid rows={plan.rows} net={plan.net} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MarginNotes />
          <ActionBar />
        </div>
      </div>
    </div>
  );
}

function HotspotTimelineDark({ hourly, peakIndex }: { hourly: number[]; peakIndex: number }) {
  const W = 360;
  const H = 150;
  const padB = 22;
  const padT = 12;
  const step = W / (hourly.length - 1);
  const pts = hourly.map((v, i) => [i * step, padT + (H - padT - padB) * (1 - v / 100)] as const);
  const area = `M0,${H - padB} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${W},${H - padB} Z`;
  const line = "M" + pts.map((p) => `${p[0]},${p[1]}`).join(" L");
  const peak = pts[peakIndex];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="briefLoadD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212,181,130,0.32)" />
          <stop offset="100%" stopColor="rgba(212,181,130,0.02)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#briefLoadD)" />
      <path d={line} fill="none" stroke="var(--zara-gold-soft)" strokeWidth="2" />
      <line x1={peak[0]} x2={peak[0]} y1={peak[1]} y2={H - padB} stroke="var(--zara-gold-soft)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={peak[0]} cy={peak[1]} r="5" fill="var(--zara-gold-soft)" stroke="var(--zara-ink)" strokeWidth="2" />
      {hourly.map((_, i) =>
        i % 2 === 0 || i === peakIndex ? (
          <text key={i} x={i * step} y={H - padB + 14} textAnchor="middle" style={{ fontFamily: "var(--ff-mono)", fontSize: 8.5, fill: i === peakIndex ? "var(--zara-gold-soft)" : "rgba(245,241,234,0.4)" }}>{10 + i}</text>
        ) : null,
      )}
    </svg>
  );
}

function MarginNotes() {
  const notes: [string, string][] = [
    ["Selin + Ayşe", "kabinde birlikte → BD %104 (16 May)"],
    ["Eksik kadro", "19:00 → per-ticket −%6 (23 May)"],
    ["Ece", "akşam kabin backlog'unu eritir"],
  ];
  return (
    <div style={{ borderLeft: `2px solid ${GOLD}`, paddingLeft: 18 }}>
      <Eyebrow gold style={{ marginBottom: 12 }}>GEREKÇE · MARGIN NOTES</Eyebrow>
      {notes.map(([h, t], i) => (
        <div key={i} style={{ marginBottom: 13 }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontStyle: "italic" }}>{h}</div>
          <div style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{t}</div>
        </div>
      ))}
    </div>
  );
}

function ActionBar() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--ff-sans)", fontSize: 12.5, fontStyle: "italic", color: MUTED }}>
        <Icon name="hand" size={14} style={{ color: GOLD }} />
        Brain önerir — kararı siz verirsiniz.
      </span>
      <div style={{ display: "flex", gap: 10 }}>
        <Button icon="sliders-horizontal">Düzenle</Button>
        <Button primary icon="check">Planı Onayla</Button>
      </div>
    </div>
  );
}

function PlanGrid({ rows, net }: { rows: ReturnType<typeof scorePlan>["rows"]; net: number }) {
  return (
    <div style={{ border: "1px solid var(--zara-line-strong)", background: "var(--zara-bg-white)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
        <thead>
          <tr style={{ background: "var(--zara-bg-warm)", borderBottom: "1px solid var(--zara-line-strong)" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, fontWeight: 500 }}>Kişi</th>
            {BLOCKS.map((b) => (
              <th key={b.id} style={{ padding: "9px 8px", textAlign: "center", borderLeft: `1px solid ${LINE}` }}>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.12em", color: b.id === "c" ? GOLD : "var(--zara-ink-2)" }}>{b.label}</div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: b.id === "c" ? GOLD : "var(--zara-ink-40)", marginTop: 2 }}>{b.en}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ person, cells }) => (
            <tr key={person.id} style={{ borderBottom: `1px solid ${LINE}` }}>
              <td style={{ padding: "8px 16px" }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 14.5 }}>{person.name}</div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--zara-ink-40)" }}>{person.tenure}{person.manager ? " · Manager" : ""}</div>
              </td>
              {BLOCKS.map((b) => {
                const cell = cells[b.id];
                if (!cell) return <td key={b.id} style={{ borderLeft: `1px solid ${LINE}` }} />;
                const isKabinPeak = (cell.zone as Zone) === "KABIN" && b.id === "c";
                return (
                  <td key={b.id} style={{ padding: "9px 8px", textAlign: "center", borderLeft: `1px solid ${LINE}` }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "7px 11px", minWidth: 66, background: isKabinPeak ? "var(--zara-gold-tint)" : "transparent", border: `1px solid ${cell.zone === "KABIN" ? (isKabinPeak ? GOLD : "rgba(184,147,90,0.4)") : LINE}` }}>
                      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: cell.zone === "KABIN" ? "var(--zara-bronze)" : "var(--zara-ink-2)", fontWeight: cell.zone === "KABIN" ? 500 : 400 }}>{ZONE_LABEL[cell.zone].tr}</span>
                      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, color: GOLD, fontVariantNumeric: "tabular-nums" }}>+{cell.lift.toFixed(1)}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: "var(--zara-bg-warm)", borderTop: "1px solid var(--zara-line-strong)" }}>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>+ rakamlar = tahmini BD puanı katkısı</span>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD }}>net +{net.toFixed(1)} puan</span>
      </div>
    </div>
  );
}
