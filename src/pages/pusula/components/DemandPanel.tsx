import { hourly, pocket } from "../data";
import { pick } from "../i18n";

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
          <span className="pusula-demand-k">{pick({ tr: "Benzer gün", en: "Similar day", es: "Día similar" })}</span>
          <span className="pusula-demand-v">{pick({ tr: "4 cumartesi", en: "4 Saturdays", es: "4 sábados" })}</span>
          <span className="pusula-demand-s">{pick({ tr: "parçalı bulutlu · özel gün yok", en: "partly cloudy · no special day", es: "parcialmente nublado · sin día especial" })}</span>
        </div>
        <div className="pusula-demand-stat">
          <span className="pusula-demand-k">{pick({ tr: "Tepe trafik", en: "Peak traffic", es: "Tráfico pico" })}</span>
          <span className="pusula-demand-v">{pocket.trafficPeak}</span>
          <span className="pusula-demand-s">{pick({ tr: "17–18 · Orquest tahmini", en: "17–18 · Orquest forecast", es: "17–18 · pronóstico Orquest" })}</span>
        </div>
        <div className="pusula-demand-stat">
          <span className="pusula-demand-k">Productivity</span>
          <span className="pusula-demand-v gold">
            {PROD_PROJECTED}
            <em> / {pick({ tr: "hedef", en: "target", es: "objetivo" })} {PROD_TARGET}</em>
          </span>
          <span className="pusula-demand-s">{pick({ tr: "prod ≫ hedef → kadro yetersiz", en: "prod ≫ target → understaffed", es: "prod ≫ objetivo → personal insuficiente" })}</span>
        </div>
      </div>

      <div className="pusula-demand-bars">
        <span className="pusula-demand-k">{pick({ tr: "Önerilen saatlik kadro", en: "Suggested hourly staffing", es: "Personal por hora sugerido" })}</span>
        <div className="pusula-demand-row">
          {head.map((h) => (
            <div key={h.hour} className="pusula-demand-col">
              <div
                className={`pusula-demand-bar ${h.peak ? "peak" : ""}`}
                style={{ height: `${(h.n / maxN) * 100}%` }}
                title={`${h.hour}:00 · ${h.n} ${pick({ tr: "kişi", en: "people", es: "personas" })}`}
              />
              <span className="pusula-demand-h">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pusula-demand-concl">
        {pick({
          tr: "Tepe-saatte kişi başı yük yüksek — Pusula ",
          en: "Per-person load is high in peak hours — Pusula suggests ",
          es: "La carga por persona es alta en hora pico — Pusula sugiere ",
        })}
        <em>{pick({ tr: "+2 güçlü el", en: "+2 strong hands", es: "+2 manos fuertes" })}</em>
        {pick({ tr: " önerir; chart bu kadroya oturur.", en: "; the chart settles onto this staffing.", es: "; el cuadro se ajusta a este personal." })}
      </div>
    </div>
  );
}
