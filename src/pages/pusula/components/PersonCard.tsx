import { MasteryLevel, type Employee } from "../types";
import { jobTypeLabelCaps } from "../data";
import { tenureOf } from "../data-staff";
import {
  aptitudeSuggestions,
  compShort,
  discoveryFor,
  growthEdgeOf,
  personCompetencies,
  strongPointOf,
} from "../data-competency";
import { sellingPersona } from "../data-program";
import { notesFor } from "../data-hafiza";
import { pick, useT } from "../i18n";
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

const PROVEN_IDX: Record<string, number> = { gelisiyor: 0, yapabiliyor: 1, guclu: 2, usta: 3 };

/**
 * Kişi kartı — yaşayan ekip: kimlik + persona/enerji + 6'lı yetkinlik DNA şeridi
 * (kanıt parmak izi; herkesinki farklı) + durum etiketleri (bekleyen onay · keşif ·
 * öğretebilir) + son koç notu. GEREKÇE/SKOR YOK — kanıt önerinin üzerinde durur.
 */
export function PersonCard({ person, onOpen }: { person: Employee; onOpen: () => void }) {
  const t = useT();
  const dark = person.level === MasteryLevel.Coach;
  const acc = ACCENT[person.level];
  const comps = personCompetencies(person.id);
  const persona = sellingPersona(person);
  const pendingApt = aptitudeSuggestions(person.id).length;
  const disc = discoveryFor(person.id);
  const teach = comps.filter((c) => c.state.kind === "proven" && c.state.teachable).length;
  const lastNote = notesFor(person.id)[0];
  return (
    <button className="pusula-card" onClick={onOpen}>
      <div className="pusula-card-top">
        <PersonAvatar name={person.name} dark={dark} size={38} />
        <div className="pusula-card-id">
          <div className="pusula-card-name">{person.name}</div>
          <span className="pusula-card-tenure">{jobTypeLabelCaps(person.id)}{" · "}{tenureOf(person)}</span>
        </div>
        <span className="pusula-card-chip">
          <MasteryChip level={person.level} />
        </span>
      </div>

      <div className="pusula-card-persona">
        <em>{persona.label}</em>
        <span>{persona.energy}</span>
      </div>

      {/* yetkinlik DNA'sı — 6 kanaldan kanıt parmak izi (keşfedilmemiş = boş hücre) */}
      <div className="pusula-card-dna" aria-hidden>
        {comps.map((c) => {
          const cls =
            c.state.kind === "proven" ? `p${PROVEN_IDX[c.state.level]}` : c.state.kind === "emerging" ? "em" : "un";
          return <i key={c.comp} className={cls} title={compShort(c.comp)} />;
        })}
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

      {(pendingApt > 0 || disc !== null || teach > 0) && (
        <div className="pusula-card-tags">
          {pendingApt > 0 && (
            <span className="t-apt">{pendingApt} {pick({ tr: "onay bekliyor", en: "awaiting approval", es: "por aprobar" })}</span>
          )}
          {disc && <span className="t-disc">{pick({ tr: "keşif önerisi", en: "discovery suggested", es: "exploración sugerida" })}</span>}
          {teach > 0 && (
            <span className="t-teach">{teach} {pick({ tr: "öğretebilir", en: "can teach", es: "puede enseñar" })}</span>
          )}
        </div>
      )}

      {lastNote && (
        <p className="pusula-card-note">
          “{lastNote.note.length > 72 ? `${lastNote.note.slice(0, 72)}…` : lastNote.note}”
          <i> — {lastNote.date.split("-").reverse().join(".")}</i>
        </p>
      )}

      <div className="pusula-card-foot">
        <span className="pusula-card-conf">
          <ConfidenceDots level={person.confidence} />
          <i>{pick({ tr: "kanıt güveni", en: "evidence confidence", es: "confianza de evidencia" })}</i>
        </span>
        <span className="pusula-card-peek">{t("b.openProfile")}</span>
      </div>

      <div className="pusula-card-accent">
        <span style={{ width: acc.w, background: acc.c }} />
      </div>
    </button>
  );
}
