import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Check, Clock, RefreshCw, Sparkles } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { usePersistentState } from "../session-store";
import { pick, useT } from "../i18n";
import { byId, employees } from "../data";
import { mentorMatches, mentorMatchesOptimized } from "../data-mentor";
import { inferTags } from "../data-hafiza";
import { compShort, personCompetencies } from "../data-competency";
import { methodLabel } from "../data-curriculum";
import { MasteryLevel } from "../types";
import type { MentorMatch } from "../types-gelisim";
import { PersonAvatar } from "../components/PersonAvatar";
import { ConfidenceDots } from "../components/ConfidenceDots";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const DAYS: { key: string; label: () => string }[] = [
  { key: "Dün", label: () => pick({ tr: "Dün", en: "Yesterday", es: "Ayer" }) },
  { key: "Bugün", label: () => pick({ tr: "Bugün", en: "Today", es: "Hoy" }) },
  { key: "Yarın", label: () => pick({ tr: "Yarın", en: "Tomorrow", es: "Mañana" }) },
];

/** Yarının müsait (düşük trafik) saatleri — önceki günden bilinir, eğitim fırsatı. */
const SLACK_WINDOWS: (() => string)[] = [
  () => pick({ tr: "15:00–16:00 · sakin açılış", en: "15:00–16:00 · calm opening", es: "15:00–16:00 · apertura tranquila" }),
  () => pick({ tr: "12:30–13:30 · öğle düşüşü", en: "12:30–13:30 · midday dip", es: "12:30–13:30 · bajada de mediodía" }),
  () => pick({ tr: "20:00–21:00 · kapanış öncesi", en: "20:00–21:00 · before closing", es: "20:00–21:00 · antes del cierre" }),
];

/**
 * Usta Yolu — animasyonlu mentor↔mentee EŞLEŞME TABLOSU. Müsait saatler (slack)
 * "eğitim fırsatı" olarak önceki günden bilinir ve eşleşmeye slot olur. "Yeniden
 * optimize" satırları akıtarak yeniden dizer (model öğrenir). Koç da mentee olur.
 * Match-score yüzdesi YOK — güven SOFT.
 */
export function UstaYolu() {
  const t = useT();
  const [day, setDay] = useState("Yarın");
  const [optimized, setOptimized] = usePersistentState("usta.optimized", false);
  const [optimizing, setOptimizing] = useState(false);
  // koç onayları görünüm değişiminde kaybolmasın
  const [confirmed, setConfirmed] = usePersistentState<Record<string, boolean>>("usta.confirmed", {});
  const toggleConfirm = (id: string) => setConfirmed((p) => ({ ...p, [id]: !p[id] }));
  const matches: MentorMatch[] = optimized ? mentorMatchesOptimized() : mentorMatches();

  const optimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimized(true);
      setOptimizing(false);
    }, 1200);
  };

  return (
    <div className="pusula-usta">
      <div className="pusula-place-head">
        <div>
          <Headline ital={t("t.usta.i")} roman={t("t.usta.r")} size={32} />
          <div className="pusula-sub">
            {pick({
              tr: "Müsait saatler eğitim fırsatıdır — önceki günden bilinir, koç↔kişi eşleştirilir. Model öğrenir.",
              en: "Free hours are training opportunities — known from the day before, coach↔person matched. The model learns.",
              es: "Las horas libres son oportunidades de formación — conocidas desde el día anterior, coach↔persona emparejados. El modelo aprende.",
            })}
          </div>
          <div className="pv4-how">{t("how.usta")}</div>
        </div>
        <div className="pusula-usta-controls">
          <div className="pusula-seg">
            {DAYS.map((d) => (
              <button key={d.key} className={day === d.key ? "on" : ""} onClick={() => setDay(d.key)}>
                {d.label()}
              </button>
            ))}
          </div>
          <button className="pusula-apply" onClick={optimize} disabled={optimizing}>
            <RefreshCw size={14} className={optimizing ? "pusula-spin" : ""} />
            {optimizing ? t("b.learning") : t("b.reoptimize")}
          </button>
        </div>
      </div>

      {/* bu ekranın hikâyesi: öğretebilir bayrağı → eşleşme → yöntem kurumda kalır */}
      <div className="pusula-usta-story" aria-hidden>
        <span>{pick({ tr: "Öğretebilir bayrağı", en: "Can-teach flag", es: "Insignia 'puede enseñar'" })}</span>
        <i>→</i>
        <span>{pick({ tr: "Müsait saatte eşleşme", en: "Match in a slack hour", es: "Emparejado en hora libre" })}</span>
        <i>→</i>
        <span>{pick({ tr: "Yöntem aktarılır", en: "Method is transferred", es: "El método se transfiere" })}</span>
        <i>→</i>
        <span className="last">{pick({ tr: "Usta ayrılsa da yöntem kurumda kalır", en: "Even if the master leaves, the method stays", es: "Aunque el maestro se vaya, el método queda" })}</span>
      </div>

      {/* öğretebilir havuzu — bayrak nereden doğuyor */}
      <div className="pusula-teachpool">
        <span className="pusula-slack-eb">{pick({ tr: "Öğretebilir havuzu · mentor adayları", en: "Can-teach pool · mentor candidates", es: "Grupo 'puede enseñar' · candidatos a mentor" })}</span>
        {employees
          .map((e) => ({ e, n: personCompetencies(e.id).filter((c) => c.state.kind === "proven" && c.state.teachable).length }))
          .filter((x) => x.n > 0)
          .sort((a, b) => b.n - a.n)
          .slice(0, 5)
          .map(({ e, n }) => (
            <span key={e.id} className="pusula-teachpool-chip">
              <PersonAvatar name={e.name} size={20} dark={e.level === MasteryLevel.Coach} />
              {e.name.split(" ")[0]} <em>{n} {pick({ tr: "konu", en: "topics", es: "temas" })}</em>
            </span>
          ))}
      </div>

      {/* müsait saat şeridi */}
      <div className="pusula-slack">
        <span className="pusula-slack-eb"><Sparkles size={12} /> {pick({ tr: "Yarının eğitim pencereleri", en: "Tomorrow's training windows", es: "Ventanas de formación de mañana" })}</span>
        {SLACK_WINDOWS.map((w, i) => (
          <span key={i} className="pusula-slack-chip">{w()}</span>
        ))}
        <span className="pusula-slack-note">{pick({ tr: "düşük trafik = sahada koçluk zamanı", en: "low traffic = coaching time on the floor", es: "tráfico bajo = tiempo de coaching en la sala" })}</span>
      </div>

      {/* animasyonlu eşleşme tablosu */}
      <div className="pusula-matchtable">
        <div className="pusula-matchrow head">
          <span>{pick({ tr: "Eşleşme", en: "Match", es: "Emparejamiento" })}</span>
          <span>{pick({ tr: "Odak", en: "Focus", es: "Enfoque" })}</span>
          <span>{pick({ tr: "Eğitim slotu", en: "Training slot", es: "Franja de formación" })}</span>
          <span>{pick({ tr: "Güven", en: "Confidence", es: "Confianza" })}</span>
          <span />
        </div>
        <AnimatePresence mode="popLayout">
          {matches.map((m) => {
            const mentor = byId(m.mentorId);
            const mentee = byId(m.menteeId);
            return (
              <motion.div
                key={m.id}
                layout
                className={`pusula-matchrow ${confirmed[m.id] ? "confirmed" : ""}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div className="pusula-match-pair2">
                  <PersonAvatar name={mentor?.name ?? "?"} dark={mentor?.level === MasteryLevel.Coach} size={28} />
                  <div className="pusula-match-names">
                    <strong>{mentor?.name?.split(" ")[0] ?? "—"}</strong>
                    <span className="pusula-match-r">{pick({ tr: "mentor", en: "mentor", es: "mentor" })}</span>
                  </div>
                  <ArrowRight size={14} className="pusula-match-arrow" />
                  <PersonAvatar name={mentee?.name ?? "?"} dark={mentee?.level === MasteryLevel.Coach} size={28} />
                  <div className="pusula-match-names">
                    <strong>{mentee?.name?.split(" ")[0] ?? "—"}</strong>
                    <span className="pusula-match-r">{pick({ tr: "öğrenen", en: "learner", es: "aprendiz" })}</span>
                  </div>
                </div>
                <div className="pusula-match-focus2">
                  {m.focus}
                  {/* aktarılan yöntem etiketi — eşleşme "kişi eşleştirme" değil, BİLGİ AKTARIMI */}
                  {(() => {
                    const tg = inferTags(m.focus);
                    return (
                      <span className="pusula-match-method">
                        {compShort(tg.scenario)} · {methodLabel(tg.method)}
                        {confirmed[m.id] && (
                          <em>{pick({ tr: "✓ hafızaya kodlandı", en: "✓ written to memory", es: "✓ codificado en memoria" })}</em>
                        )}
                      </span>
                    );
                  })()}
                </div>
                <div className="pusula-match-slot">
                  <Clock size={12} strokeWidth={1.7} /> {m.slot}
                </div>
                <div className="pusula-match-conf">
                  <ConfidenceDots level={m.confidence} />
                  <span className="pusula-match-confw">
                    {m.confidence === "high"
                      ? pick({ tr: "yüksek", en: "high", es: "alta" })
                      : m.confidence === "medium"
                        ? pick({ tr: "orta", en: "medium", es: "media" })
                        : pick({ tr: "filizlenen", en: "emerging", es: "incipiente" })}
                  </span>
                </div>
                <div className="pusula-match-act2">
                  {confirmed[m.id] ? (
                    <button className="pusula-match-yes on" onClick={() => toggleConfirm(m.id)}>
                      <Check size={12} strokeWidth={2.4} /> {pick({ tr: "Onaylandı", en: "Confirmed", es: "Confirmado" })}
                    </button>
                  ) : (
                    <>
                      <button className="pusula-match-yes" onClick={() => toggleConfirm(m.id)}>{t("b.confirm")}</button>
                      <button className="pusula-match-edit">{t("b.edit")}</button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="pusula-usta-learn">
        <BrainCircuit size={18} strokeWidth={1.5} />
        <div>
          <strong>{pick({ tr: "Model nasıl öğreniyor?", en: "How does the model learn?", es: "¿Cómo aprende el modelo?" })}</strong>
          <p>
            {pick({
              tr: "Her onay/revizyonda Pusula saha dinamiklerini (kim kiminle uyumlu, yetkinlik artışı, müsait-saat doluluğu) biraz daha iyi öğrenir; eşleşmelerin ",
              en: "With each approval/revision Pusula learns the floor dynamics (who fits with whom, competency growth, slack-hour usage) a little better; the ",
              es: "Con cada aprobación/revisión Pusula aprende mejor las dinámicas de sala (quién encaja con quién, crecimiento de competencia, uso de horas libres); la ",
            })}
            <em>{pick({ tr: "güveni", en: "confidence", es: "confianza" })}</em>
            {pick({
              tr: " yükselir. Koçluk sahada gerçekleştikçe — takvimde görünmek değil, ",
              en: " of matches rises. As coaching actually happens on the floor — not appearing on the calendar, but ",
              es: " de los emparejamientos sube. A medida que el coaching ocurre en la sala — no aparecer en el calendario, sino ",
            })}
            <em>{pick({ tr: "birlikte geçen zaman + lift", en: "time spent together + lift", es: "tiempo juntos + lift" })}</em>
            {pick({ tr: " — sinyal güçlenir.", en: " — the signal strengthens.", es: " — la señal se fortalece." })}
          </p>
        </div>
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>{pick({ tr: "Karar koçundur — öneri, dayatma değil", en: "The decision is the coach's — a suggestion, not a mandate", es: "La decisión es del coach — sugerencia, no imposición" })}</span>
        <span>{pick({ tr: "Eğitimcinin de eğitimi: koç da öğrenen olabilir", en: "Training the trainer too: a coach can also be a learner", es: "Formar al formador también: un coach también puede ser aprendiz" })}</span>
      </div>
    </div>
  );
}
