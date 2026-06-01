import { useMemo } from "react";
import {
  AREAS,
  DUTIES,
  ROLES,
  TENURE_LEVELS,
  type StaffRow,
} from "./constants";
import { Panel, SectionBar, StatCards, AreaGlyph } from "@/components/atelier";
import { AREA_VISUAL } from "@/components/atelier/area-visual";
import { trpc } from "@/providers/trpc";

type ChartRow = {
  id: number;
  shiftDate: string;
  generatedAt: string | Date;
  status: string;
  qualityScore: number | null;
  chartData: unknown;
};

/** Yetkinlik kapsamı katman renkleri (Temel → Uzman). */
const TIER_C = ["#E5D4AE", "#D9BE84", "#CBA45E", "#BF9550"];

export function ReportTab({ staff }: { staff: StaffRow[] }) {
  const chartsQuery = trpc.chart.list.useQuery({ limit: 100 });
  const charts = (chartsQuery.data ?? []) as ChartRow[];

  /** Skorlu chart'lar, eski → yeni (trend için). */
  const recs = useMemo(
    () =>
      charts
        .filter((c) => c.qualityScore !== null)
        .sort(
          (a, b) =>
            new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime(),
        )
        .slice(-30)
        .map((c) => ({ date: c.shiftDate, score: c.qualityScore as number, status: c.status })),
    [charts],
  );

  const total = recs.length;
  const avg = total ? recs.reduce((a, r) => a + r.score, 0) / total : 0;
  const max = total ? Math.max(...recs.map((r) => r.score)) : 0;
  const optimal = charts.filter((c) => c.status === "OPTIMAL").length;

  // ── dağılımlar ──────────────────────────────────────────
  const areaDist = useMemo(
    () => AREAS.map((a) => ({ a, n: staff.filter((p) => p.homeArea === a.id).length })),
    [staff],
  );
  const areaMax = Math.max(1, ...areaDist.map((d) => d.n));

  const tenureDist = useMemo(
    () => TENURE_LEVELS.map((t) => ({ t, n: staff.filter((p) => p.tenureLevel === t.id).length })),
    [staff],
  );
  const tenureMax = Math.max(1, ...tenureDist.map((d) => d.n));

  // skill coverage: rol başına seviye (1..4) dağılımı + yetkin (≥3)
  const coverage = useMemo(
    () =>
      ROLES.map((role) => {
        const tiers = [0, 0, 0, 0];
        for (const p of staff) {
          const v = p.competencies[role] ?? 0;
          if (v >= 1 && v <= 4) tiers[v - 1]++;
        }
        const rated = tiers.reduce((a, b) => a + b, 0);
        const yetkin = tiers[2] + tiers[3];
        return { role, tiers, rated, yetkin };
      }),
    [staff],
  );

  // görev (duty) dağılımı
  const roleDist = useMemo(() => {
    const com = staff.filter((p) => p.duty === "COM").length;
    const coach = staff.filter((p) => p.duty === "COACH").length;
    const cx = staff.filter((p) => p.duty === "CX").length;
    const none = staff.filter((p) => !p.duty).length;
    return [
      { key: "COM", label: "COM", n: com, color: DUTIES[0].color },
      { key: "Coach", label: "Coach", n: coach, color: DUTIES[2].color },
      { key: "CX", label: "CX", n: cx, color: DUTIES[1].color },
      { key: "none", label: "Görevsiz", n: none, color: "var(--zara-ink-30)" },
    ];
  }, [staff]);

  const ftCount = staff.filter((p) => p.employment === "FT").length;
  const ftptDist = [
    { label: "Full Time", n: ftCount, color: "var(--zara-ink)" },
    { label: "Part Time", n: staff.length - ftCount, color: "var(--zara-gold)" },
  ];

  // en sık atanan (gerçek chartData'dan)
  const top = useMemo(() => {
    const counter = new Map<string, number>();
    for (const c of charts) {
      if (!Array.isArray(c.chartData)) continue;
      for (const cell of c.chartData as Array<{ persons?: string[] }>) {
        for (const p of cell.persons ?? []) counter.set(p, (counter.get(p) ?? 0) + 1);
      }
    }
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, n]) => ({ name, n }));
  }, [charts]);
  const topMax = top[0]?.n || 1;

  // ── trend SVG geometrisi ────────────────────────────────
  const W = 1000;
  const H = 240;
  const pad = { l: 38, r: 16, t: 18, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const xAt = (i: number) => pad.l + (total <= 1 ? iw / 2 : (i / (total - 1)) * iw);
  const yAt = (v: number) => pad.t + ih - (v / 100) * ih;
  const line = recs
    .map((r, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(r.score).toFixed(1)}`)
    .join(" ");
  const avgY = yAt(avg);

  return (
    <div>
      {/* KPI şeridi */}
      <StatCards
        cols={5}
        stats={[
          { label: "Toplam Personel", value: staff.length },
          { label: "Toplam Chart", value: charts.length },
          { label: "Ortalama Skor", value: total ? avg.toFixed(1) : "—" },
          { label: "En Yüksek", value: total ? max.toFixed(1) : "—", tone: "up" },
          { label: "Optimal Oranı", value: charts.length ? "%" + Math.round((optimal / charts.length) * 100) : "—" },
        ]}
      />

      {/* trend */}
      <Panel>
        <SectionBar idx="01" title="Chart Üretim Trendi" hint="kalite skoru · zaman serisi" />
        {total > 1 ? (
          <div className="report-chart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 260 }}>
              {[0, 25, 50, 75, 100].map((g) => (
                <g key={g}>
                  <line x1={pad.l} x2={W - pad.r} y1={yAt(g)} y2={yAt(g)} stroke="var(--zara-line)" strokeWidth="1" />
                  <text x={pad.l - 8} y={yAt(g) + 4} textAnchor="end" fontSize="11" fill="var(--zara-ink-40)" fontFamily="var(--ff-mono)">{g}</text>
                </g>
              ))}
              <line x1={pad.l} x2={W - pad.r} y1={avgY} y2={avgY} stroke="var(--zara-gold)" strokeWidth="1.4" strokeDasharray="5 4" />
              <text x={W - pad.r} y={avgY - 6} textAnchor="end" fontSize="11" fill="var(--zara-gold-deep)" fontFamily="var(--ff-mono)">ort {avg.toFixed(1)}</text>
              <path d={`${line} L ${xAt(total - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`} fill="var(--zara-gold-tint)" stroke="none" />
              <path d={line} fill="none" stroke="var(--zara-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {recs.map((r, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(r.score)} r="3" fill="var(--zara-ink)" />
              ))}
            </svg>
            <div className="rc-axis">
              <span>{recs[0]?.date}</span>
              <span>{recs[recs.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--zara-ink-30)", fontSize: 13 }}>
            Trend görmek için en az 2 chart üretilmiş olmalı.
          </div>
        )}
      </Panel>

      {/* alan + kıdem dağılımı */}
      <div className="rep-grid2">
        <Panel>
          <SectionBar idx="02" title="Alan Dağılımı" hint="personel sayısı" />
          <div className="dist">
            {areaDist.map(({ a, n }) => (
              <div className="dist-row" key={a.id}>
                <span className="dl">
                  <AreaGlyph area={a.id} size={13} />
                  {a.label}
                </span>
                <span className="dt">
                  <i style={{ width: (n / areaMax) * 100 + "%", background: AREA_VISUAL[a.id].color }} />
                </span>
                <span className="dn num">{String(n).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionBar idx="03" title="Kıdem Dağılımı" hint="işe başlama süresi" />
          <div className="dist">
            {tenureDist.map(({ t, n }) => (
              <div className="dist-row" key={t.id}>
                <span className="dl">
                  <span className="dl-dot" style={{ background: t.color }} />
                  {t.label}
                </span>
                <span className="dt">
                  <i style={{ width: (n / tenureMax) * 100 + "%", background: t.color }} />
                </span>
                <span className="dn num">{String(n).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* yetkinlik kapsamı */}
      <Panel>
        <SectionBar idx="04" title="Yetkinlik Kapsamı" hint="rol başına seviye dağılımı" />
        <div className="cov-head">
          {["Temel", "Gelişiyor", "Yetkin", "Uzman"].map((l, i) => (
            <span className="cov-key" key={l}>
              <i style={{ background: TIER_C[i] }} />
              {l}
            </span>
          ))}
          <span className="cov-key" style={{ marginLeft: "auto" }}>
            <b>Yetkin+</b> = ★★★ ve üzeri
          </span>
        </div>
        <div className="cov-list">
          {coverage.map(({ role, tiers, rated, yetkin }) => (
            <div className="cov-row" key={role}>
              <span className="cov-label">{role}</span>
              <span className="cov-bar">
                {tiers.map((c, i) =>
                  c > 0 ? (
                    <span
                      key={i}
                      className="cov-seg"
                      style={{ width: (c / Math.max(1, staff.length)) * 100 + "%", background: TIER_C[i] }}
                      title={`${c} kişi`}
                    />
                  ) : null,
                )}
              </span>
              <span className="cov-n num">{yetkin}/{rated}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* görev + ft/pt oranları */}
      <div className="rep-grid2">
        <Panel>
          <SectionBar idx="05" title="Görev Dağılımı" hint="yönetim & uzmanlık" />
          <div className="prop">
            <div className="prop-bar">
              {roleDist.map((r) =>
                r.n > 0 ? (
                  <span key={r.key} className="prop-seg" style={{ width: (r.n / Math.max(1, staff.length)) * 100 + "%", background: r.color }}>
                    {r.n}
                  </span>
                ) : null,
              )}
            </div>
            <div className="prop-legend">
              {roleDist.map((r) => (
                <span key={r.key}>
                  <i style={{ background: r.color }} />
                  {r.label} · {r.n}
                </span>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <SectionBar idx="06" title="Çalışma Tipi" hint="full / part time" />
          <div className="prop">
            <div className="prop-bar">
              {ftptDist.map((r) =>
                r.n > 0 ? (
                  <span key={r.label} className="prop-seg" style={{ width: (r.n / Math.max(1, staff.length)) * 100 + "%", background: r.color }}>
                    {r.n}
                  </span>
                ) : null,
              )}
            </div>
            <div className="prop-legend">
              {ftptDist.map((r) => (
                <span key={r.label}>
                  <i style={{ background: r.color }} />
                  {r.label} · {r.n}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* en sık atanan */}
      <Panel>
        <SectionBar idx="07" title="En Sık Atanan Kişiler" hint="top 8 · vardiya yoğunluğu" />
        {top.length > 0 ? (
          <div className="top-list">
            {top.map(({ name, n }, i) => (
              <div className="top-row" key={name}>
                <span className="tr-rank num">{String(i + 1).padStart(2, "0")}</span>
                <span className="tr-glyph">
                  <span className="dl-dot" style={{ background: "var(--zara-gold)", width: 9, height: 9, borderRadius: "50%", display: "inline-block" }} />
                </span>
                <span className="tr-name">{name}</span>
                <span className="tr-bar">
                  <i style={{ width: (n / topMax) * 100 + "%" }} />
                </span>
                <span className="tr-n num">{n}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--zara-ink-30)", fontSize: 13 }}>
            Henüz chart üretilmedi — atama yoğunluğu burada görünecek.
          </div>
        )}
      </Panel>
    </div>
  );
}
