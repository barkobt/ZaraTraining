import { Check, RotateCcw } from "lucide-react";
import { byId } from "../data";
import { MasteryLevel, type Recommendation as Rec } from "../types";
import { PersonAvatar } from "./PersonAvatar";
import { pick, useT } from "../i18n";

const KIND_LABEL: Record<Rec["kind"], () => string> = {
  strength: () => pick({ tr: "Güç", en: "Strength", es: "Fortaleza" }),
  synergy: () => pick({ tr: "Sinerji", en: "Synergy", es: "Sinergia" }),
  growth: () => pick({ tr: "Gelişim", en: "Growth", es: "Desarrollo" }),
  teaching: () => pick({ tr: "Aktarım", en: "Transfer", es: "Transferencia" }),
  discovery: () => pick({ tr: "Keşif", en: "Discovery", es: "Descubrimiento" }),
};

/**
 * Öneri kartı — KANIT BURADA + #2 İNSAN DÜZENLEMESİ. Koç her öneriyi tek tek
 * onaylar (kademeli uygula) veya geri alır. Gerekçe önerinin üzerinde durur.
 */
export function RecommendationCard({
  rec,
  accepted,
  onToggle,
}: {
  rec: Rec;
  accepted: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const person = byId(rec.employeeId);
  const buddy = rec.buddyId ? byId(rec.buddyId) : undefined;

  return (
    <div className={`pusula-rec ${accepted ? "on" : ""}`}>
      <div className="pusula-rec-avatars">
        <PersonAvatar name={person?.name ?? rec.employeeId} dark={person?.level === MasteryLevel.Coach} size={32} />
        {buddy && (
          <span className="pusula-rec-with">
            <PersonAvatar name={buddy.name} dark={buddy.level === MasteryLevel.Coach} size={32} />
          </span>
        )}
      </div>
      <div className="pusula-rec-body">
        <div className="pusula-rec-head">
          <span className={`pusula-rec-kind ${rec.kind}`}>{KIND_LABEL[rec.kind]()}</span>
          <span className="pusula-rec-route">
            {person?.name ?? rec.employeeId}
            {buddy && ` · ${buddy.name}`} → {rec.toRole} · {rec.hours}
          </span>
        </div>
        <p className="pusula-rec-why">{rec.thesis}</p>
        <span className="pusula-rec-ev">{rec.evidence}</span>
        <button className={`pusula-rec-act ${accepted ? "on" : ""}`} onClick={onToggle}>
          {accepted ? (
            <>
              <RotateCcw size={12} /> {t("b.undo")}
            </>
          ) : (
            <>
              <Check size={12} /> {t("b.apply")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
