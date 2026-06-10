import { useState } from "react";
import { Headline } from "../../brain/primitives";
import { employees, jobTypeOf, type JobType } from "../data";
import { MasteryLevel, type Employee } from "../types";
import { PersonCard } from "../components/PersonCard";

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
  const [job, setJob] = useState<JobType | "Tümü">("Tümü");
  const [life, setLife] = useState<MasteryLevel | "Tümü">("Tümü");

  const list = employees.filter(
    (p) => (job === "Tümü" || jobTypeOf(p.id) === job) && (life === "Tümü" || p.level === life),
  );

  return (
    <div className="pusula-team">
      <div className="pusula-team-head">
        <Headline ital="Yaşayan" roman="Ekip" size={32} />
        <div className="pusula-sub">İnsan birincil — rol-tipi ve yaşam evresine göre ayrı izlenir.</div>
      </div>

      <div className="pusula-team-filters">
        <div className="pusula-filterrow">
          <span className="pusula-filter-k">İş tipi</span>
          {JOBS.map((j) => (
            <button key={j} className={`pusula-chipf ${job === j ? "on" : ""}`} onClick={() => setJob(j)}>
              {j}
            </button>
          ))}
        </div>
        <div className="pusula-filterrow">
          <span className="pusula-filter-k">Yaşam evresi</span>
          {LIFES.map((l) => (
            <button key={l.label} className={`pusula-chipf ${life === l.id ? "on" : ""}`} onClick={() => setLife(l.id)}>
              {l.label}
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
        {list.length} kişi · {job === "Tümü" ? "tüm roller" : job} ·{" "}
        {life === "Tümü" ? "tüm evreler" : LIFES.find((l) => l.id === life)?.label}
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>Bu profili çalışan da görür</span>
        <span>Skor yok, sıralama yok — yalnız nitel okuma</span>
      </div>
    </div>
  );
}
