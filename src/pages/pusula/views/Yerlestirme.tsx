import { motion } from "framer-motion";
import { Eyebrow, Headline } from "../primitives";
import { usePersistentState } from "../session-store";
import { useT } from "../i18n";
import { pocket, getRecommendations } from "../data";
import { applyMoves } from "../placement";
import { ShiftChart } from "../components/ShiftChart";
import { PocketMeter } from "../components/PocketMeter";
import { HourlySpark } from "../components/HourlySpark";
import { RecommendationCard } from "../components/Recommendation";
import { DemandPanel } from "../components/DemandPanel";
import { SurplusPanel } from "../components/SurplusPanel";
import { AdjacencyNote } from "../components/AdjacencyNote";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * DEMO KALBİ — Yerleştirme (KADEMELİ).
 * Koç önerileri TEK TEK uygular (#2 human-in-loop): her kabul, kişiyi chart'ta
 * yerine AKITIR (layoutId morph) ve cebi biraz daha rahatlatır. Kanıt öneride.
 * Veri köprüsü placement.applyMoves üzerinden (gerçekte solver çağrısı olur, #3).
 */
export function Yerlestirme({
  applied,
  onApply,
}: {
  applied: boolean;
  onApply: (v: boolean) => void;
}) {
  const t = useT();
  const recommendations = getRecommendations();
  // accepted rec id listesi — session-store'da yaşar (görünüm değişiminde tek tek
  // kabul edilenler kaybolmaz); ilk girişte shell hatırası (applied) ile uyumlu başlar.
  const [accepted, setAccepted] = usePersistentState<string[]>(
    "yer.accepted",
    applied ? recommendations.map((r) => r.id) : [],
  );

  const chart = applyMoves(accepted);
  const fraction = accepted.length / recommendations.length;

  const toggle = (id: string) =>
    setAccepted((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      onApply(next.length > 0);
      return next;
    });

  const all = () => {
    setAccepted(recommendations.map((r) => r.id));
    onApply(true);
  };
  const reset = () => {
    setAccepted([]);
    onApply(false);
  };

  return (
    <div className="pusula-place">
      <div className="pusula-place-head">
        <div>
          <Headline ital={t("t.yer.i")} roman={t("t.yer.r")} size={32} />
          <div className="pusula-sub">{t("t.yer.sub")}</div>
          <div className="pv4-how">{t("how.yerlestirme")}</div>
        </div>
        <div className="pusula-usta-controls">
          <button className="pusula-apply" onClick={all} disabled={fraction >= 1}>
            {t("b.applyAll")}
          </button>
          <button className="pusula-apply" data-applied="1" onClick={reset} disabled={accepted.length === 0}>
            {t("b.reset")}
          </button>
        </div>
      </div>

      <DemandPanel />
      <SurplusPanel />

      <div className="pusula-place-grid">
        <div className="pusula-place-chart">
          <ShiftChart chart={chart} />
          <PocketMeter pocket={pocket} fraction={fraction} />
          <HourlySpark />
        </div>

        <aside className="pusula-place-side">
          <div className="pusula-recs-head">
            <Eyebrow>{t("e.thesis")}</Eyebrow>
            <span className="pusula-recs-count">
              {accepted.length}/{recommendations.length} {t("l.applied")}
            </span>
          </div>
          <div className="pusula-recs">
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: i * 0.06 }}
              >
                <RecommendationCard
                  rec={rec}
                  accepted={accepted.includes(rec.id)}
                  onToggle={() => toggle(rec.id)}
                />
              </motion.div>
            ))}
          </div>

          <AdjacencyNote />

          <div className="pusula-assure">
            <span>{t("a.constraints")}</span>
            <span>{t("a.decision")}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
