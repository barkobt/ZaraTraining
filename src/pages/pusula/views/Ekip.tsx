import { useState } from "react";
import { Headline } from "../../brain/primitives";
import { employees, jobTypeOf, type JobType } from "../data";
import { MasteryLevel, type Employee } from "../types";
import { PersonCard } from "../components/PersonCard";
import { useT } from "../i18n";

const JOBS: Array<JobType | "Tümü"> = ["Tümü", "Satış Danışmanı", "Commercial", "Müdür"];
const LIFES: Array<{ id: MasteryLevel | "Tümü"; label: string }> = [
  { id: "Tümü", label: "Tümü" },
  { id: MasteryLevel.New, label: "Yeni" },
  { id: MasteryLevel.Competent, label: "Yetkin" },
  { id: MasteryLevel.Master, label: "Usta" },
  { id: MasteryLevel.Coach, label: "Koç" },
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
        <Headline ital={t("t.ekip.i")} roman={t("t.ekip.r")} size={32} />
        <div className="pusula-sub">{t("t.ekipSub")}</div>
      </div>

      <div className="pusula-team-filters">
        <div className="pusula-filterrow">
          <span className="pusula-filter-k">{t("f.jobtype")}</span>
          {JOBS.map((j) => (
            <button key={j} className={`pusula-chipf ${job === j ? "on" : ""}`} onClick={() => setJob(j)}>
              {j === "Tümü" ? t("f.all") : j}
            </button>
          ))}
        </div>
        <div className="pusula-filterrow">
          <span className="pusula-filter-k">{t("f.lifecycle")}</span>
          {LIFES.map((l) => (
            <button key={l.label} className={`pusula-chipf ${life === l.id ? "on" : ""}`} onClick={() => setLife(l.id)}>
              {l.id === "Tümü" ? t("f.all") : l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pusula-team-grid">
        {list.map((p) => (
          <PersonCard key={p.id} person={p} onOpen={() => onPeek(p)} />
        ))}
      </div>

      <div className="pusula-team-count">
        {list.length} · {job === "Tümü" ? t("f.all") : job} ·{" "}
        {life === "Tümü" ? t("f.all") : LIFES.find((l) => l.id === life)?.label}
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>{t("a.worker")}</span>
        <span>{t("a.noscore")}</span>
      </div>
    </div>
  );
}
