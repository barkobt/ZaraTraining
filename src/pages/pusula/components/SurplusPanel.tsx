import { ArrowUpRight, Users } from "lucide-react";
import { ROSTER_TODAY, PEAK_NEED, balanceByHour, flexPeople } from "../staffing";
import { pick } from "../i18n";

/**
 * Kadro dengesi + SURPLUS. Trafiğe göre gerekli kişi vs vardiyadaki kişi → boşta
 * kalanları (düşük/orta yetkin) Pusula otomatik ekstra işe yönlendirir → prod artar.
 * Fazla kadroda chartı sürekli elle reviz etme derdi biter. Sayılar temsîlî.
 */
export function SurplusPanel() {
  const roster = ROSTER_TODAY.length;
  const flex = flexPeople();
  const balance = balanceByHour();
  const maxNeed = Math.max(...balance.map((b) => b.need));

  return (
    <div className="pusula-surplus">
      <div className="pusula-surplus-top">
        <div className="pusula-surplus-stat">
          <Users size={16} strokeWidth={1.6} />
          <span className="pusula-surplus-big">{roster}</span>
          <span className="pusula-surplus-k">{pick({ tr: "vardiyada", en: "on shift", es: "en turno" })}</span>
        </div>
        <div className="pusula-surplus-arrow">→</div>
        <div className="pusula-surplus-stat">
          <span className="pusula-surplus-big">{PEAK_NEED}</span>
          <span className="pusula-surplus-k">{pick({ tr: "tepe-saat ihtiyacı", en: "peak-hour need", es: "necesidad en hora pico" })}</span>
        </div>
        <div className="pusula-surplus-arrow">→</div>
        <div className="pusula-surplus-stat gold">
          <span className="pusula-surplus-big">{roster - PEAK_NEED}</span>
          <span className="pusula-surplus-k">{pick({ tr: "esnek (boşta)", en: "flexible (idle)", es: "flexible (libre)" })}</span>
        </div>

        {/* saatlik gerekli vs esnek mini */}
        <div className="pusula-surplus-bal">
          {balance.map((b) => (
            <div key={b.hour} className="pusula-surplus-col">
              <div className="pusula-surplus-bar" style={{ height: `${(b.need / maxNeed) * 100}%` }} title={`${b.hour} · ${pick({ tr: "gerekli", en: "need", es: "necesario" })} ${b.need} · ${pick({ tr: "esnek", en: "flex", es: "flex" })} ${b.flex}`} />
              <span className="pusula-surplus-h">{b.hour.slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pusula-surplus-flex">
        <span className="pusula-period-key">{pick({ tr: "Pusula esnekleri desteğe yönlendiriyor", en: "Pusula routes the flexible to support", es: "Pusula dirige a los flexibles al apoyo" })}</span>
        <div className="pusula-surplus-list">
          {flex.map((f) => (
            <div key={f.id} className="pusula-surplus-row">
              <span className="pusula-surplus-name">{f.name}</span>
              <ArrowUpRight size={12} strokeWidth={1.8} className="pusula-surplus-go" />
              <span className="pusula-surplus-task">{f.task}</span>
              <span className="pusula-surplus-reason">{f.reason}</span>
            </div>
          ))}
        </div>
        <div className="pusula-surplus-note">
          {pick({
            tr: "Off-peak (15–16 · 20–21) ihtiyaç daha düşük → daha çok kişi esner. Pusula fazlalığı ",
            en: "Off-peak (15–16 · 20–21) the need is lower → more people flex. Pusula watches the surplus ",
            es: "Off-peak (15–16 · 20–21) la necesidad es menor → más gente flexibiliza. Pusula observa el excedente de forma ",
          })}
          <em>{pick({ tr: "dinamik", en: "dynamically", es: "dinámica" })}</em>
          {pick({
            tr: " izler; boşta kalanı otomatik desteğe gönderir — manuel chart revizi derdi biter, prod artar.",
            en: "; it sends the idle to support automatically — no more manual chart revisions, prod rises.",
            es: "; envía a los libres al apoyo automáticamente — se acaba la revisión manual del cuadro, sube la prod.",
          })}
        </div>
      </div>
    </div>
  );
}
