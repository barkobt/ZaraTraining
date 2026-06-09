import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Clock, RefreshCw, Sparkles } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { byId } from "../data";
import { MENTOR_MATCHES, MENTOR_MATCHES_OPTIMIZED } from "../data-mentor";
import { MasteryLevel } from "../types";
import type { MentorMatch } from "../types-gelisim";
import { PersonAvatar } from "../components/PersonAvatar";
import { ConfidenceDots } from "../components/ConfidenceDots";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const DAYS = ["Dün", "Bugün", "Yarın"];

/** Yarının müsait (düşük trafik) saatleri — önceki günden bilinir, eğitim fırsatı. */
const SLACK_WINDOWS = ["15:00–16:00 · sakin açılış", "12:30–13:30 · öğle düşüşü", "20:00–21:00 · kapanış öncesi"];

/**
 * Usta Yolu — animasyonlu mentor↔mentee EŞLEŞME TABLOSU. Müsait saatler (slack)
 * "eğitim fırsatı" olarak önceki günden bilinir ve eşleşmeye slot olur. "Yeniden
 * optimize" satırları akıtarak yeniden dizer (model öğrenir). Koç da mentee olur.
 * Match-score yüzdesi YOK — güven SOFT.
 */
export function UstaYolu() {
  const [day, setDay] = useState("Yarın");
  const [matches, setMatches] = useState<MentorMatch[]>(MENTOR_MATCHES);
  const [optimizing, setOptimizing] = useState(false);

  const optimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setMatches(MENTOR_MATCHES_OPTIMIZED);
      setOptimizing(false);
    }, 1200);
  };

  return (
    <div className="pusula-usta">
      <div className="pusula-place-head">
        <div>
          <Headline ital="Usta" roman="Yolu" size={32} />
          <div className="pusula-sub">
            Müsait saatler eğitim fırsatıdır — önceki günden bilinir, koç↔kişi eşleştirilir. Model öğrenir.
          </div>
        </div>
        <div className="pusula-usta-controls">
          <div className="pusula-seg">
            {DAYS.map((d) => (
              <button key={d} className={day === d ? "on" : ""} onClick={() => setDay(d)}>
                {d}
              </button>
            ))}
          </div>
          <button className="pusula-apply" onClick={optimize} disabled={optimizing}>
            <RefreshCw size={14} className={optimizing ? "pusula-spin" : ""} />
            {optimizing ? "Öğreniyor…" : "Yeniden optimize"}
          </button>
        </div>
      </div>

      {/* müsait saat şeridi */}
      <div className="pusula-slack">
        <span className="pusula-slack-eb"><Sparkles size={12} /> Yarının eğitim pencereleri</span>
        {SLACK_WINDOWS.map((w) => (
          <span key={w} className="pusula-slack-chip">{w}</span>
        ))}
        <span className="pusula-slack-note">düşük trafik = sahada koçluk zamanı</span>
      </div>

      {/* animasyonlu eşleşme tablosu */}
      <div className="pusula-matchtable">
        <div className="pusula-matchrow head">
          <span>Eşleşme</span>
          <span>Odak</span>
          <span>Eğitim slotu</span>
          <span>Güven</span>
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
                className="pusula-matchrow"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div className="pusula-match-pair2">
                  <PersonAvatar name={mentor?.name ?? "?"} dark={mentor?.level === MasteryLevel.Coach} size={28} />
                  <div className="pusula-match-names">
                    <strong>{mentor?.name?.split(" ")[0] ?? "—"}</strong>
                    <span className="pusula-match-r">mentor</span>
                  </div>
                  <ArrowRight size={14} className="pusula-match-arrow" />
                  <PersonAvatar name={mentee?.name ?? "?"} dark={mentee?.level === MasteryLevel.Coach} size={28} />
                  <div className="pusula-match-names">
                    <strong>{mentee?.name?.split(" ")[0] ?? "—"}</strong>
                    <span className="pusula-match-r">öğrenen</span>
                  </div>
                </div>
                <div className="pusula-match-focus2">{m.focus}</div>
                <div className="pusula-match-slot">
                  <Clock size={12} strokeWidth={1.7} /> {m.slot}
                </div>
                <div className="pusula-match-conf">
                  <ConfidenceDots level={m.confidence} />
                </div>
                <div className="pusula-match-act2">
                  <button className="pusula-match-yes">Onayla</button>
                  <button className="pusula-match-edit">Düzenle</button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="pusula-usta-learn">
        <BrainCircuit size={18} strokeWidth={1.5} />
        <div>
          <strong>Model nasıl öğreniyor?</strong>
          <p>
            Her onay/revizyonda Pusula saha dinamiklerini (kim kiminle uyumlu, yetkinlik artışı, müsait-saat doluluğu)
            biraz daha iyi öğrenir; eşleşmelerin <em>güveni</em> yükselir. Koçluk sahada gerçekleştikçe — takvimde
            görünmek değil, <em>birlikte geçen zaman + lift</em> — sinyal güçlenir.
          </p>
        </div>
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>Karar koçundur — öneri, dayatma değil</span>
        <span>Eğitimcinin de eğitimi: koç da öğrenen olabilir</span>
      </div>
    </div>
  );
}
