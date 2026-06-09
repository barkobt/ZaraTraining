import { ArrowUpRight, Users } from "lucide-react";
import { ROSTER_TODAY, PEAK_NEED, balanceByHour, flexPeople } from "../staffing";

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
          <span className="pusula-surplus-k">vardiyada</span>
        </div>
        <div className="pusula-surplus-arrow">→</div>
        <div className="pusula-surplus-stat">
          <span className="pusula-surplus-big">{PEAK_NEED}</span>
          <span className="pusula-surplus-k">tepe-saat ihtiyacı</span>
        </div>
        <div className="pusula-surplus-arrow">→</div>
        <div className="pusula-surplus-stat gold">
          <span className="pusula-surplus-big">{roster - PEAK_NEED}</span>
          <span className="pusula-surplus-k">esnek (boşta)</span>
        </div>

        {/* saatlik gerekli vs esnek mini */}
        <div className="pusula-surplus-bal">
          {balance.map((b) => (
            <div key={b.hour} className="pusula-surplus-col">
              <div className="pusula-surplus-bar" style={{ height: `${(b.need / maxNeed) * 100}%` }} title={`${b.hour} · gerekli ${b.need} · esnek ${b.flex}`} />
              <span className="pusula-surplus-h">{b.hour.slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pusula-surplus-flex">
        <span className="pusula-period-key">Pusula esnekleri desteğe yönlendiriyor</span>
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
          Off-peak (15–16 · 20–21) ihtiyaç daha düşük → daha çok kişi esner. Pusula fazlalığı <em>dinamik</em> izler;
          boşta kalanı otomatik desteğe gönderir — manuel chart revizi derdi biter, prod artar.
        </div>
      </div>
    </div>
  );
}
