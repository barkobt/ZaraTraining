import { COMPETENCY_SCALE_TRI } from "../data-gelisim";
import { competencyEval } from "../data-program";
import type { Employee } from "../types";
import { pick, useT } from "../i18n";

/**
 * Davranışsal taban şeridi — Defter'deki 5 davranışsal yetkinliğin SON dönem
 * okuması, Defter'le AYNI kelimelerle (COMPETENCY_SCALE_TRI). Herkes için dolu:
 * pozisyondan bağımsız, koç gözleminden gelir. Profil ↔ Defter hizası burada görünür.
 */
export function BehavioralStrip({ emp }: { emp: Employee }) {
  const t = useT();
  const rows = competencyEval(emp);
  return (
    <div className="pusula-asa-strip pcomp-behav">
      <span className="pusula-asa-strip-eb">{t("e.behavioral")}</span>
      {rows.map((r) => {
        const last = r.periods[r.periods.length - 1] ?? 0;
        return (
          <span key={r.name} className={`pusula-asa-chip ${r.priority ? "prio" : ""}`}>
            {r.name} <em>{pick(COMPETENCY_SCALE_TRI[last] ?? COMPETENCY_SCALE_TRI[0])}</em>
          </span>
        );
      })}
    </div>
  );
}
