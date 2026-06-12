import { useState } from "react";
import { Headline } from "../primitives";
import { employees, jobTypeOf, type JobType } from "../data";
import { MasteryLevel, type Employee } from "../types";
import { PersonCard } from "../components/PersonCard";
import { pick, useT } from "../i18n";

const JOBS: Array<JobType | "Tümü"> = ["Tümü", "Satış Danışmanı", "Commercial", "Müdür"];
/** İş tipi etiketi (filtre değeri TR kalır; görünen ad aktif dilde). */
const jobLabel = (j: JobType): string => {
  if (j === "Müdür") return pick({ tr: "Müdür", en: "Manager", es: "Gerente" });
  // CAPS bağlam (seg butonu uppercase): TR locale "Commercial"ı "COMMERCİAL" yapar —
  // İngilizce marka terimi el-büyütülmüş verilir, transform no-op kalır.
  if (j === "Commercial") return "COMMERCIAL";
  return pick({ tr: "Satış Danışmanı", en: "Sales Assistant", es: "Asesor de Ventas" });
};
const LIFES: Array<{ id: MasteryLevel | "Tümü"; label: () => string }> = [
  { id: "Tümü", label: () => pick({ tr: "Tümü", en: "All", es: "Todos" }) },
  { id: MasteryLevel.New, label: () => pick({ tr: "Yeni", en: "New", es: "Nuevo" }) },
  { id: MasteryLevel.Competent, label: () => pick({ tr: "Yetkin", en: "Proficient", es: "Competente" }) },
  { id: MasteryLevel.Master, label: () => pick({ tr: "Usta", en: "Master", es: "Maestro" }) },
  { id: MasteryLevel.Coach, label: () => pick({ tr: "Koç", en: "Coach", es: "Coach" }) },
];

/**
 * Ekip — roster, rol-tipi (Müdür / Commercial / Satış Danışmanı) ve yaşam evresi
 * (Yeni / Yetkin / Usta / Koç) filtreleriyle ayrı izlenir. Herkesin gelişimi
 * birbirinden farklı takip edilir.
 */
export function Ekip({ onPeek }: { onPeek: (p: Employee) => void }) {
  const t = useT();
  const [job, setJob] = useState<JobType | "Tümü">("Tümü");
  const [life, setLife] = useState<MasteryLevel | "Tümü">("Tümü");

  const list = employees.filter(
    (p) => (job === "Tümü" || jobTypeOf(p.id) === job) && (life === "Tümü" || p.level === life),
  );

  return (
    <div className="pusula-team">
      <div className="pusula-team-head">
        <div>
          <Headline ital={t("t.ekip.i")} roman={t("t.ekip.r")} size={32} />
          <div className="pusula-sub">{t("t.ekipSub")}</div>
          <div className="pv4-how">{t("how.ekip")}</div>
        </div>
        {/* ekip nabzı — evre dağılımı (masthead'in sağı boş kalmasın, sayfa konuşsun) */}
        <div className="pusula-team-pulse" aria-hidden>
          {LIFES.slice(1).map((l) => (
            <div key={String(l.id)}>
              <em>{employees.filter((e) => e.level === l.id).length}</em>
              <span>{l.label()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pusula-filterbar">
        <div className="pusula-filtergroup">
          <span className="pusula-filter-k">{t("f.jobtype")}</span>
          <div className="pusula-seg">
            {JOBS.map((j) => {
              const count = j === "Tümü" ? employees.length : employees.filter((e) => jobTypeOf(e.id) === j).length;
              return (
                <button key={j} className={`pusula-seg-btn ${job === j ? "on" : ""}`} onClick={() => setJob(j)}>
                  <span>{j === "Tümü" ? t("f.all") : jobLabel(j)}</span>
                  <em>{count}</em>
                </button>
              );
            })}
          </div>
        </div>
        <div className="pusula-filtergroup">
          <span className="pusula-filter-k">{t("f.lifecycle")}</span>
          <div className="pusula-seg">
            {LIFES.map((l) => {
              const count = l.id === "Tümü" ? employees.length : employees.filter((e) => e.level === l.id).length;
              return (
                <button key={String(l.id)} className={`pusula-seg-btn ${life === l.id ? "on" : ""}`} onClick={() => setLife(l.id)}>
                  <span>{l.id === "Tümü" ? t("f.all") : l.label()}</span>
                  <em>{count}</em>
                </button>
              );
            })}
          </div>
        </div>
        <div className="pusula-filter-result">
          <strong>{list.length}</strong> {pick({ tr: "kişi", en: "people", es: "personas" })}
        </div>
      </div>

      <div className="pusula-team-grid">
        {list.map((p) => (
          <PersonCard key={p.id} person={p} onOpen={() => onPeek(p)} />
        ))}
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>{t("a.worker")}</span>
        <span>{t("a.noscore")}</span>
      </div>
    </div>
  );
}
