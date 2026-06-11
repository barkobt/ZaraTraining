import { AlertTriangle, Check } from "lucide-react";
import { byId } from "../data";
import { mentorMatches } from "../data-mentor";
import { pick } from "../i18n";

/**
 * Koçluk komşuluğu — "koç chartta var" yetmez; mentee ile SAHADA geçen zaman ölçülür.
 * Slack pencerede yan yana = koçluk gerçekleşti (✓); tepe-saatte ayrı/yoğun = 0 saat
 * flag'i + telafi önerisi. Bu, "koç görünüyor ama vakit ayırmıyor"u önler.
 */
const STATUS: Record<string, { ok: boolean; text: () => string }> = {
  mm1: {
    ok: true,
    text: () => pick({
      tr: "15:00–16:00 sakin pencerede yan yana — sahada ~1 saat koçluk.",
      en: "Side by side in the calm 15:00–16:00 window — ~1 hour of coaching on the floor.",
      es: "Juntos en la ventana tranquila de 15:00–16:00 — ~1 hora de coaching en la sala.",
    }),
  },
  mm2: {
    ok: false,
    text: () => pick({
      tr: "Tepe-saatte ikisi de yoğun → sahada 0 saat. Telafi: 20:00 sakin slot önerildi.",
      en: "Both busy in peak hours → 0 hours on the floor. Make-up: a calm 20:00 slot suggested.",
      es: "Ambos ocupados en hora pico → 0 horas en la sala. Compensación: se sugiere una franja tranquila a las 20:00.",
    }),
  },
};

export function AdjacencyNote() {
  return (
    <div className="pusula-adj">
      <div className="pusula-adj-head">
        <span className="pusula-pocket-eb">{pick({ tr: "Koçluk komşuluğu", en: "Coaching adjacency", es: "Proximidad de coaching" })}</span>
        <span className="pusula-adj-sub">{pick({ tr: "takvimde görünmek değil — sahada geçen zaman", en: "not appearing on the calendar — time spent on the floor", es: "no aparecer en el calendario — tiempo en la sala" })}</span>
      </div>
      {mentorMatches().map((m) => {
        const mentor = byId(m.mentorId);
        const mentee = byId(m.menteeId);
        const st = STATUS[m.id] ?? { ok: true, text: () => m.slot };
        return (
          <div key={m.id} className={`pusula-adj-row ${st.ok ? "ok" : "flag"}`}>
            <span className="pusula-adj-icon">{st.ok ? <Check size={13} /> : <AlertTriangle size={13} />}</span>
            <div>
              <div className="pusula-adj-pair">
                {mentor?.name.split(" ")[0]} ↔ {mentee?.name.split(" ")[0]}
              </div>
              <div className="pusula-adj-text">{st.text()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
