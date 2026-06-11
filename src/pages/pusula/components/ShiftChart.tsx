import { motion } from "framer-motion";
import { byId, chartHours, chartRoles } from "../data";
import { MasteryLevel, type ChartState } from "../types";
import { pick } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Cep penceresi 17:00–19:00 → başlangıç saati 17 veya 18 olan dilim tepe-saat. */
function isPeak(hour: string): boolean {
  const h = parseInt(hour, 10);
  return h >= 17 && h < 19;
}

function personsAt(chart: ChartState, role: string, hour: string): string[] {
  return chart.find((c) => c.role === role && c.hour === hour)?.persons ?? [];
}

/**
 * Saat × rol grid. Her person chip'i `layoutId={id-hour}` taşır; chart
 * before→after değişince framer-motion chip'i hücreden hücreye AKITIR
 * (her saat kolonunda dikey morph). Stagger ile sakin bir dalga.
 * Vurgu: Koç → koyu, Usta → altın (güçlü eller nerede, gözle okunur).
 */
export function ShiftChart({ chart }: { chart: ChartState }) {
  return (
    <div className="pusula-chart" role="table" aria-label={pick({ tr: "Akşam yerleşimi", en: "Evening placement", es: "Asignación vespertina" })}>
      <div
        className="pusula-chart-grid"
        style={{ gridTemplateColumns: `minmax(130px, 1.1fr) repeat(${chartHours.length}, 1fr)` }}
      >
        {/* başlık satırı: saatler */}
        <div className="pusula-chart-corner" />
        {chartHours.map((h) => (
          <div key={h} className={`pusula-chart-hour ${isPeak(h) ? "peak" : ""}`}>
            {h}
            {isPeak(h) && <span className="pusula-chart-peaktag">{pick({ tr: "cep", en: "pocket", es: "hueco" })}</span>}
          </div>
        ))}

        {/* rol satırları */}
        {chartRoles.map((role) => (
          <RoleRow key={role} role={role} chart={chart} />
        ))}
      </div>
    </div>
  );
}

function RoleRow({ role, chart }: { role: string; chart: ChartState }) {
  return (
    <>
      <div className="pusula-chart-role">{role}</div>
      {chartHours.map((hour) => {
        const persons = personsAt(chart, role, hour);
        const peak = isPeak(hour);
        return (
          <div key={hour} className={`pusula-chart-cell ${peak ? "peak" : ""}`}>
            {persons.map((id, i) => {
              const p = byId(id);
              const mgr = p?.level === MasteryLevel.Coach;
              const strong = p?.level === MasteryLevel.Master;
              return (
                <motion.div
                  key={id}
                  layout
                  layoutId={`${id}-${hour}`}
                  className={`pusula-chip ${mgr ? "mgr" : ""} ${strong ? "strong" : ""}`}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
                >
                  <span className="pusula-chip-dot" />
                  {p?.name.split(" ")[0] ?? id}
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
