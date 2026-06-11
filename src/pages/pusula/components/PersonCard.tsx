import { MasteryLevel, type Employee } from "../types";
import { jobTypeLabelCaps } from "../data";
import { tenureOf } from "../data-staff";
import { strongPointOf, growthEdgeOf } from "../data-competency";
import { useT } from "../i18n";
import { PersonAvatar } from "./PersonAvatar";
import { MasteryChip } from "./MasteryChip";
import { ConfidenceDots } from "./ConfidenceDots";

/** Yaşam evresi → soft gelişim dolgusu + ton (skor değil, gelişim hissi). */
const ACCENT: Record<MasteryLevel, { w: string; c: string }> = {
  [MasteryLevel.New]: { w: "34%", c: "var(--zara-sage)" },
  [MasteryLevel.Competent]: { w: "60%", c: "var(--zara-gold-soft)" },
  [MasteryLevel.Master]: { w: "86%", c: "var(--zara-gold)" },
  [MasteryLevel.Coach]: { w: "96%", c: "var(--zara-ink)" },
};

/**
 * Kompakt kişi kartı. Kimlik + nitel güçlü/gelişen yan + ustalık + soluk güven +
 * alt accent (gelişim hissi). GEREKÇE YOK — kanıt önerinin üzerinde durur, kişinin değil.
 */
export function PersonCard({ person, onOpen }: { person: Employee; onOpen: () => void }) {
  const t = useT();
  const dark = person.level === MasteryLevel.Coach;
  const acc = ACCENT[person.level];
  return (
    <button className="pusula-card" onClick={onOpen}>
      <div className="pusula-card-top">
        <PersonAvatar name={person.name} dark={dark} size={38} />
        <div className="pusula-card-id">
          <div className="pusula-card-name">{person.name}</div>
          <span className="pusula-card-tenure">{jobTypeLabelCaps(person.id)}{"\u00A0·\u00A0"}{tenureOf(person)}</span>
        </div>
        <span className="pusula-card-chip">
          <MasteryChip level={person.level} />
        </span>
      </div>

      <div className="pusula-card-lines">
        <div className="pusula-card-line">
          <span className="pusula-card-key strong">{t("c.strong")}</span>
          <span>{strongPointOf(person)}</span>
        </div>
        <div className="pusula-card-line">
          <span className="pusula-card-key growing">{t("c.growing")}</span>
          <span>{growthEdgeOf(person)}</span>
        </div>
      </div>

      <div className="pusula-card-foot">
        <ConfidenceDots level={person.confidence} />
        <span className="pusula-card-peek">{t("b.openProfile")}</span>
      </div>

      <div className="pusula-card-accent">
        <span style={{ width: acc.w, background: acc.c }} />
      </div>
    </button>
  );
}
