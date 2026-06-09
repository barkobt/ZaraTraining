import { hourly, pocket } from "../data";

/**
 * Talep + Productivity → Kadro. Orquest'in tahmini günü, benzer geçmiş günlerden
 * (aynı gün-türü + hava + özel-gün) öğrenilir. Prod sapması kadro sinyalidir:
 * prod ≫ hedef → tepe-saatte yetersiz kadro, kişi başı yük yüksek → güçlü el lazım.
 * Sayılar temsîlî; chart bu kadroya oturur.
 */
const PROD_TARGET = 8;
const PROD_PROJECTED = 11; // tepe-saatte yüksek yük

export function DemandPanel() {
  const maxT = Math.max(...hourly.map((h) => h.traffic));
  const head = hourly.map((h) => {
    const peak = /^1[78]:/.test(h.hour);
    const n = Math.round(6 + (h.traffic / maxT) * 6); // 6–12 önerilen kadro
    return { hour: h.hour.slice(0, 2), n, peak };
  });
  const maxN = Math.max(...head.map((h) => h.n));

  return (
    <div className="pusula-demand">
      <div className="pusula-demand-stats">
        <div className="pusula-demand-stat">
          <span className="pusula-demand-k">Benzer gün</span>
          <span className="pusula-demand-v">4 cumartesi</span>
          <span className="pusula-demand-s">parçalı bulutlu · özel gün yok</span>
        </div>
        <div className="pusula-demand-stat">
          <span className="pusula-demand-k">Tepe trafik</span>
          <span className="pusula-demand-v">{pocket.trafficPeak}</span>
          <span className="pusula-demand-s">17–18 · Orquest tahmini</span>
        </div>
        <div className="pusula-demand-stat">
          <span className="pusula-demand-k">Productivity</span>
          <span className="pusula-demand-v gold">
            {PROD_PROJECTED}
            <em> / hedef {PROD_TARGET}</em>
          </span>
          <span className="pusula-demand-s">prod ≫ hedef → kadro yetersiz</span>
        </div>
      </div>

      <div className="pusula-demand-bars">
        <span className="pusula-demand-k">Önerilen saatlik kadro</span>
        <div className="pusula-demand-row">
          {head.map((h) => (
            <div key={h.hour} className="pusula-demand-col">
              <div
                className={`pusula-demand-bar ${h.peak ? "peak" : ""}`}
                style={{ height: `${(h.n / maxN) * 100}%` }}
                title={`${h.hour}:00 · ${h.n} kişi`}
              />
              <span className="pusula-demand-h">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pusula-demand-concl">
        Tepe-saatte kişi başı yük yüksek — Pusula <em>+2 güçlü el</em> önerir; chart bu kadroya oturur.
      </div>
    </div>
  );
}
