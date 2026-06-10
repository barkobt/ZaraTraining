import { ArrowRight, Lightbulb } from "lucide-react";
import { PLAN_SIGNALS } from "../data-curriculum";

/**
 * Müfredat sinyali — koçların notlarından/aksiyon planlarından çıkan ortak desenler
 * plan revizyon önerisine dönüşür. Form statik değil; mağaza dinamik. Aksiyon önerisi
 * gibi EĞİTİM PLANI güncelleme önerisi de buradan çıkar.
 */
export function CurriculumSignal() {
  return (
    <div className="pusula-curr">
      <div className="pusula-curr-head">
        <Lightbulb size={14} strokeWidth={1.7} />
        <span>Müfredat sinyali · koç notlarından plan revizyon önerileri</span>
      </div>
      {PLAN_SIGNALS.map((s, i) => (
        <div key={i} className="pusula-curr-row">
          <span className={`pusula-curr-kind ${s.kind}`}>{s.kind}</span>
          <div className="pusula-curr-body">
            <div className="pusula-curr-topic">
              {s.topic} <em>· {s.coaches} koç</em>
            </div>
            <div className="pusula-curr-signal">{s.signal}</div>
            <div className="pusula-curr-sugg">
              <ArrowRight size={11} strokeWidth={2} /> {s.suggestion}
            </div>
          </div>
          <button className="pusula-curr-act">İncele</button>
        </div>
      ))}
      <div className="pusula-curr-note">
        Form tek başına kusursuz değil — mağaza dinamik. Pusula koç davranışından müfredatı evriltir.
      </div>
    </div>
  );
}
