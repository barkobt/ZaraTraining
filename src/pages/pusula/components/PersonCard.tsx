import { MasteryLevel, type Employee } from "../types";
import { jobTypeOf } from "../data";
import { PersonAvatar } from "./PersonAvatar";
import { MasteryChip } from "./MasteryChip";
import { ConfidenceDots } from "./ConfidenceDots";

/**
 * Kompakt kişi kartı. Kimlik + nitel güçlü/gelişen yan + ustalık + soluk güven.
 * GEREKÇE YOK — kanıt önerinin üzerinde durur, kişinin değil.
 */
export function PersonCard({ person, onOpen }: { person: Employee; onOpen: () => void }) {
  const dark = person.level === MasteryLevel.Coach;
  return (
    <button className="pusula-card" onClick={onOpen}>
      <div className="pusula-card-top">
        <PersonAvatar name={person.name} dark={dark} size={38} />
        <div className="pusula-card-id">
          <div className="pusula-card-name">{person.name}</div>
          <span className="pusula-card-tenure">{jobTypeOf(person.id)} · {person.tenure}</span>
        </div>
        <span style={{ marginLeft: "auto" }}>
          <MasteryChip level={person.level} />
        </span>
      </div>

      <div className="pusula-card-lines">
        <div className="pusula-card-line">
          <span className="pusula-card-key strong">Güçlü</span>
          <span>{person.strongPoint}</span>
        </div>
        <div className="pusula-card-line">
          <span className="pusula-card-key growing">Gelişiyor</span>
          <span>{person.growthEdge}</span>
        </div>
      </div>

      <div className="pusula-card-foot">
        <ConfidenceDots level={person.confidence} />
        <span className="pusula-card-peek">Profili aç →</span>
      </div>
    </button>
  );
}
