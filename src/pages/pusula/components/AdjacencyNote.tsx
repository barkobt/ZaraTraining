import { AlertTriangle, Check } from "lucide-react";
import { byId } from "../data";
import { MENTOR_MATCHES } from "../data-mentor";

/**
 * Koçluk komşuluğu — "koç chartta var" yetmez; mentee ile SAHADA geçen zaman ölçülür.
 * Slack pencerede yan yana = koçluk gerçekleşti (✓); tepe-saatte ayrı/yoğun = 0 saat
 * flag'i + telafi önerisi. Bu, "koç görünüyor ama vakit ayırmıyor"u önler.
 */
const STATUS: Record<string, { ok: boolean; text: string }> = {
  mm1: { ok: true, text: "15:00–16:00 sakin pencerede yan yana — sahada ~1 saat koçluk." },
  mm2: { ok: false, text: "Tepe-saatte ikisi de yoğun → sahada 0 saat. Telafi: 20:00 sakin slot önerildi." },
};

export function AdjacencyNote() {
  return (
    <div className="pusula-adj">
      <div className="pusula-adj-head">
        <span className="pusula-pocket-eb">Koçluk komşuluğu</span>
        <span className="pusula-adj-sub">takvimde görünmek değil — sahada geçen zaman</span>
      </div>
      {MENTOR_MATCHES.map((m) => {
        const mentor = byId(m.mentorId);
        const mentee = byId(m.menteeId);
        const st = STATUS[m.id] ?? { ok: true, text: m.slot };
        return (
          <div key={m.id} className={`pusula-adj-row ${st.ok ? "ok" : "flag"}`}>
            <span className="pusula-adj-icon">{st.ok ? <Check size={13} /> : <AlertTriangle size={13} />}</span>
            <div>
              <div className="pusula-adj-pair">
                {mentor?.name.split(" ")[0]} ↔ {mentee?.name.split(" ")[0]}
              </div>
              <div className="pusula-adj-text">{st.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
