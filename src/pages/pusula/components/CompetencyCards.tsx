import { motion } from "framer-motion";
import { CalendarPlus, Check, Compass } from "lucide-react";
import {
  compLabel,
  compRaw,
  channelLabel,
  discoveryFor,
  discoveryText,
  personCompetencies,
  stateWord,
  type PersonCompetency,
} from "../data-competency";
import { usePersistentState } from "../session-store";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Kart tonu — nitel duruma göre (sayı yok; bar bireysel gelişim görseli). */
function tone(pc: PersonCompetency): string {
  if (pc.state.kind === "emerging") return "emerging";
  if (pc.state.kind === "proven") return pc.state.level; // gelisiyor | yapabiliyor | guclu | usta
  return "";
}

/**
 * Yetkinlik DNA kartları — kişinin KANITLI 6'lı operasyonel profili.
 * Her kart: yetkinlik adı + nitel seviye + gelişim barı + kanıt satırı (kanal · n).
 * Keşfedilmemiş alanlar boş bar olarak DEĞİL, keşif aksiyonu olarak görünür.
 */
export function CompetencyCards({
  personId,
  compact = false,
}: {
  personId: string;
  compact?: boolean;
}) {
  const t = useT();
  // keşif vardiyası planlama — koç tek tıkla aksiyon alır (görünüm değişiminde korunur)
  const [planned, setPlanned] = usePersistentState<Record<string, boolean>>("disc.planned", {});
  const all = personCompetencies(personId);
  const shown = all
    .filter((p) => p.state.kind !== "unexplored")
    .sort((a, b) => compRaw(personId, b.comp) - compRaw(personId, a.comp));
  const cards = compact ? shown.slice(0, 3) : shown;
  const unexplored = all.filter((p) => p.state.kind === "unexplored");
  const disc = !compact && unexplored.length ? discoveryFor(personId) : null;

  return (
    <div className={`pcomp ${compact ? "compact" : ""}`}>
      <div className="pcomp-grid">
        {cards.map((pc, i) => {
          const w = Math.max(8, Math.round((compRaw(personId, pc.comp) / 4) * 100));
          const ev = pc.evidence[0];
          return (
            <motion.div
              key={pc.comp}
              className={`pcomp-card ${tone(pc)}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
            >
              <div className="pcomp-head">
                <span className="pcomp-name">{compLabel(pc.comp)}</span>
                <span className={`pcomp-level ${tone(pc)}`}>{stateWord(pc.state)}</span>
              </div>
              <div className="pcomp-bar">
                <motion.span
                  className={`pcomp-fill ${tone(pc)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: EASE }}
                />
              </div>
              {ev && (
                <div className="pcomp-ev">
                  <em>{channelLabel(ev.channel)}</em> {pick(ev.line)}
                </div>
              )}
              {pc.state.kind === "proven" && pc.state.teachable && (
                <span className="pcomp-teach">{t("l.teachBadge")}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {!compact && unexplored.length > 0 && (
        <div className="pcomp-unexplored">
          <span className="pcomp-unexplored-eb">{t("e.unexplored")}</span>
          {unexplored.map((pc) => {
            const isDisc = disc?.comp === pc.comp;
            const key = `${personId}:${pc.comp}`;
            const isPlanned = !!planned[key];
            return (
              <div key={pc.comp} className="pcomp-unexplored-row">
                <Compass size={14} strokeWidth={1.7} />
                <span>
                  {isDisc
                    ? discoveryText(disc)
                    : pick({
                        tr: `${compLabel(pc.comp)} — henüz sinyal yok; yargı değil, keşif fırsatı.`,
                        en: `${compLabel(pc.comp)} — no signal yet; not a judgment, a discovery opportunity.`,
                        es: `${compLabel(pc.comp)} — aún sin señal; no es juicio, es una oportunidad.`,
                      })}
                </span>
                {/* ÇIKMAZ SOKAK DEĞİL: koç buradan tek tıkla keşif vardiyasını planlar */}
                {isDisc &&
                  (isPlanned ? (
                    <span className="pcomp-plan done">
                      <Check size={11} strokeWidth={2.2} /> {t("l.planned")} ·{" "}
                      {pick({ tr: "Yarın 15–16", en: "Tomorrow 15–16", es: "Mañana 15–16" })} · {disc.buddyName}
                    </span>
                  ) : (
                    <button className="pcomp-plan" onClick={() => setPlanned((p) => ({ ...p, [key]: true }))}>
                      <CalendarPlus size={11} strokeWidth={2} /> {t("b.plan")}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
