import { useMemo, useState } from "react";
import { Eyebrow, Headline, Icon, Marker, Button, Confidence, LiveDot } from "../primitives";
import { predictLoad, loadByBlock, scorePlan, ZONE_LABEL, type Zone } from "../model";
import { ROSTER, BLOCKS, PLAN, HISTORY, TODAY } from "../data";

const GOLD = "var(--zara-gold)";
const INK = "var(--zara-ink)";
const LINE = "var(--zara-line)";
const MUTED = "var(--zara-ink-50)";

export function Briefing() {
  const load = useMemo(() => predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek }), []);
  const blockLoad = useMemo(() => loadByBlock(load, BLOCKS), [load]);
  const plan = useMemo(() => scorePlan(ROSTER, PLAN, BLOCKS, blockLoad), [blockLoad]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: "1px solid var(--zara-line-strong)", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Headline ital="Sabah" roman="Brifingi" size={34} />
            <LiveDot label="CANLI" />
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED }}>{TODAY.full}</div>
        </div>
      </div>

      {/* bugünün okuması */}
      <div className="brain-card gold-top" style={{ marginBottom: 24 }}>
        <Eyebrow gold style={{ marginBottom: 12 }}>BUGÜNÜN OKUMASI · TODAY'S READ</Eyebrow>
        <p style={{ margin: 0, fontFamily: "var(--ff-display)", fontWeight: 400, fontSize: 20, lineHeight: 1.5, color: INK, letterSpacing: "-0.005em" }}>
          Bugün <em style={{ fontStyle: "italic" }}>ağır bir Cuma</em> gibi okunuyor — hava açık, ay sonu maaş haftası,
          ve son {load.support} benzer Cuma'da kabin trafiği <strong style={{ fontWeight: 600 }}>{load.peakLabel}'da zirve</strong> yaptı.
          Akşam ve kapanış bloklarını güçlü kabin performansıyla doldurmanızı öneriyorum; aksi halde
          per-ticket'in düşme riski yüksek.
        </p>
      </div>

      {/* hotspot timeline */}
      <div className="brain-card" style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <Eyebrow gold>TAHMİNİ YÜK · KABİN · PREDICTED HOTSPOTS</Eyebrow>
          <Confidence value={load.confidence} support={load.support} />
        </div>
        <HotspotTimeline hourly={load.hourly} peakIndex={load.peakIndex} peakLabel={load.peakLabel} />
      </div>

      {/* önerilen plan */}
      <Marker left="ÖNERİLEN PLAN" right={`NET +${plan.net.toFixed(1)} PUAN`} />
      <PlanGrid rows={plan.rows} net={plan.net} />

      {/* neden bu plan */}
      <div style={{ marginTop: 26 }}>
        <WhyThisPlan />
      </div>

      {/* aksiyon */}
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--ff-sans)", fontSize: 12.5, fontStyle: "italic", color: MUTED }}>
          <Icon name="hand" size={14} style={{ color: GOLD }} />
          Brain önerir — kararı siz verirsiniz.
          <span style={{ fontFamily: "var(--ff-mono)", fontStyle: "normal", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase" }}>Human-in-the-loop</span>
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Button icon="sliders-horizontal">Düzenle</Button>
          <Button primary icon="check">Planı Onayla</Button>
        </div>
      </div>
    </div>
  );
}

function HotspotTimeline({ hourly, peakIndex, peakLabel }: { hourly: number[]; peakIndex: number; peakLabel: string }) {
  const W = 760;
  const H = 150;
  const padB = 26;
  const padT = 16;
  const step = W / (hourly.length - 1);
  const pts = hourly.map((v, i) => [i * step, padT + (H - padT - padB) * (1 - v / 100)] as const);
  const area = `M0,${H - padB} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${W},${H - padB} Z`;
  const line = "M" + pts.map((p) => `${p[0]},${p[1]}`).join(" L");
  const peak = pts[peakIndex];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="brainLoadFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(191,149,80,0.22)" />
          <stop offset="100%" stopColor="rgba(191,149,80,0.02)" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g, i) => (
        <line key={i} x1="0" x2={W} y1={padT + (H - padT - padB) * g} y2={padT + (H - padT - padB) * g} stroke="var(--zara-line)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#brainLoadFill)" />
      <path d={line} fill="none" stroke="var(--zara-gold)" strokeWidth="2" />
      <line x1={peak[0]} x2={peak[0]} y1={peak[1]} y2={H - padB} stroke="var(--zara-gold)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={peak[0]} cy={peak[1]} r="5" fill="var(--zara-gold)" stroke="var(--zara-bg)" strokeWidth="2" />
      {hourly.map((_, i) => (
        <text key={i} x={i * step} y={H - padB + 16} textAnchor="middle" style={{ fontFamily: "var(--ff-mono)", fontSize: 9, fill: i === peakIndex ? "var(--zara-gold)" : "var(--zara-ink-40)" }}>
          {10 + i}
        </text>
      ))}
      <g transform={`translate(${peak[0]}, ${peak[1] - 14})`}>
        <rect x="-46" y="-22" width="92" height="20" fill="var(--zara-ink)" />
        <text x="0" y="-8" textAnchor="middle" style={{ fontFamily: "var(--ff-mono)", fontSize: 9, fill: "var(--zara-bg)", letterSpacing: "0.1em" }}>{peakLabel} · ZİRVE</text>
      </g>
    </svg>
  );
}

function PlanGrid({ rows, net }: { rows: ReturnType<typeof scorePlan>["rows"]; net: number }) {
  const zoneTint = (z: Zone) => (z === "KABIN" ? "rgba(191,149,80,0.4)" : LINE);
  return (
    <div style={{ border: "1px solid var(--zara-line-strong)", background: "var(--zara-bg-white)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
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
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--zara-ink-40)" }}>
                  {person.tenure}{person.manager ? " · Manager" : ""}
                </div>
              </td>
              {BLOCKS.map((b) => {
                const cell = cells[b.id];
                if (!cell) return <td key={b.id} style={{ borderLeft: `1px solid ${LINE}` }} />;
                const isKabinPeak = cell.zone === "KABIN" && b.id === "c";
                return (
                  <td key={b.id} style={{ padding: "9px 8px", textAlign: "center", borderLeft: `1px solid ${LINE}` }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "7px 11px", minWidth: 66, background: isKabinPeak ? "var(--zara-gold-tint)" : "transparent", border: `1px solid ${cell.zone === "KABIN" ? (isKabinPeak ? GOLD : zoneTint(cell.zone)) : LINE}` }}>
                      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: cell.zone === "KABIN" ? "var(--zara-bronze)" : "var(--zara-ink-2)", fontWeight: cell.zone === "KABIN" ? 500 : 400 }}>
                        {ZONE_LABEL[cell.zone].tr}
                      </span>
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
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>+ rakamlar = tahmini BD puanı katkısı · predicted KPI lift</span>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD }}>net +{net.toFixed(1)} puan</span>
      </div>
    </div>
  );
}

function WhyThisPlan() {
  const [open, setOpen] = useState(false);
  const cites = [
    { d: "23 May · Cuma", t: "Kabin 19:00'da güçlüydü → per-ticket +%6, kuyruk 8 → 3 dk" },
    { d: "16 May · Cuma", t: "Selin + Ayşe kabinde → BD hedefi %104 tuttu" },
    { d: "09 May · Cuma", t: "Akşam kabin eksikti → 3 çapraz-satış kaçtı" },
  ];
  return (
    <div style={{ border: "1px solid var(--zara-line-strong)", background: "var(--zara-bg-warm)" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Icon name="quote" size={14} style={{ color: GOLD }} />
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>Neden <em style={{ fontStyle: "italic" }}>bu plan?</em></span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>· son 3 Cuma'ya dayalı</span>
        </span>
        <Icon name={open ? "minus" : "plus"} size={16} style={{ color: MUTED }} />
      </button>
      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          <div style={{ height: 1, background: LINE, marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cites.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, minWidth: 110 }}>{c.d}</span>
                <span style={{ fontFamily: "var(--ff-sans)", fontSize: 13, color: "var(--zara-ink-2)", lineHeight: 1.5 }}>{c.t}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="git-branch" size={13} style={{ color: MUTED }} />
            <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: MUTED, fontStyle: "italic" }}>
              Kaynak: episodic_memory · geçmiş Cuma'lar · takım kimyası grafiği. Her iddia kanıta dayanır.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
