import { ArrowRight, Lightbulb } from "lucide-react";
import { planSignals, type PlanSignal } from "../data-curriculum";
import { roleLabel } from "../data-gelisim";
import type { GuidebookRole } from "../types-gelisim";
import { pick } from "../i18n";

const kindLabel = (k: PlanSignal["kind"]): string =>
  k === "ekle"
    ? pick({ tr: "ekle", en: "add", es: "añadir" })
    : k === "taşı"
      ? pick({ tr: "taşı", en: "move", es: "mover" })
      : pick({ tr: "pekiştir", en: "reinforce", es: "reforzar" });

/**
 * Müfredat sinyali — koçların notlarından/aksiyon planlarından çıkan ortak desenler
 * plan revizyon önerisine dönüşür. ROL-BAZLI: her kitapçığın (Satış/Kasa/Operasyon)
 * kendi desenleri vardır — sinyal, seçili kitapçığın notlarından gelir.
 */
export function CurriculumSignal({ role }: { role: GuidebookRole }) {
  return (
    <div className="pusula-curr">
      <div className="pusula-curr-head">
        <Lightbulb size={14} strokeWidth={1.7} />
        <span>
          {pick({ tr: "Müfredat sinyali", en: "Curriculum signal", es: "Señal de currículo" })} · <em>{roleLabel(role)}</em> {pick({ tr: "kitapçığının koç notlarından", en: "— from this booklet's coach notes", es: "— de las notas de coach de este cuadernillo" })}
        </span>
      </div>
      {planSignals(role).map((s, i) => (
        <div key={i} className="pusula-curr-row">
          <span className={`pusula-curr-kind ${s.kind}`}>{kindLabel(s.kind)}</span>
          <div className="pusula-curr-body">
            <div className="pusula-curr-topic">
              {s.topic} <em>· {s.coaches} {pick({ tr: "koç", en: "coaches", es: "coaches" })}</em>
            </div>
            <div className="pusula-curr-signal">{s.signal}</div>
            <div className="pusula-curr-sugg">
              <ArrowRight size={11} strokeWidth={2} /> {s.suggestion}
            </div>
          </div>
          <button className="pusula-curr-act">{pick({ tr: "İncele", en: "Review", es: "Revisar" })}</button>
        </div>
      ))}
      <div className="pusula-curr-note">
        {pick({
          tr: "Form tek başına kusursuz değil — mağaza dinamik. Pusula koç davranışından müfredatı evriltir.",
          en: "The form alone isn't perfect — the store is dynamic. Pusula evolves the curriculum from coach behavior.",
          es: "El formulario por sí solo no es perfecto — la tienda es dinámica. Pusula evoluciona el currículo a partir del comportamiento del coach.",
        })}
      </div>
    </div>
  );
}
