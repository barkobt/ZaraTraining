import type { ReactNode } from "react";

export type Stat = {
  label: string;
  value: ReactNode;
  /** 'up' = emerald, 'down' = destructive, 'accent' = destructive vurgu */
  tone?: "up" | "down" | "accent";
};

/**
 * StatCards — KPI şeridi (editorial.css `.so-stats` / `.so-stat`).
 * `cols` 4 veya 5 olabilir (so-stats-4 / so-stats-5). Design-system -3 report.jsx
 * KPI satırının muadili. `inset` panel içine gömülü kullanım içindir.
 */
export function StatCards({
  stats,
  cols,
  inset = false,
}: {
  stats: Stat[];
  cols?: 4 | 5;
  inset?: boolean;
}) {
  const colCls = cols === 5 ? "so-stats-5" : cols === 4 ? "so-stats-4" : "";
  return (
    <div className={`so-stats ${colCls} ${inset ? "inset" : ""}`}>
      {stats.map((s) => (
        <div className="so-stat" key={s.label}>
          <div className="sl">{s.label}</div>
          <div className={`sv num ${s.tone ?? ""}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
