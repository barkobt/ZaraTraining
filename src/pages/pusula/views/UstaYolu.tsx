import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Calendar, RefreshCw, Zap } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { byId } from "../data";
import { MENTOR_MATCHES, MENTOR_MATCHES_OPTIMIZED } from "../data-mentor";
import { MasteryLevel } from "../types";
import type { MentorMatch } from "../types-gelisim";
import { PersonAvatar } from "../components/PersonAvatar";
import { ConfidenceDots } from "../components/ConfidenceDots";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const DAYS = ["Dün", "Bugün", "Yarın"];

/**
 * Usta Yolu — mentor↔mentee eşleştirme. Yetkinlik boşluğu + vardiya çakışması →
 * gerekçeli eşleşme; koç onaylar/düzenler. "Yeniden optimize" model öğrenmesini
 * canlandırır. Eğitimcinin eğitimi: koç da mentee olabilir. MATCH-SCORE % YOK.
 */
export function UstaYolu() {
  const [day, setDay] = useState("Bugün");
  const [matches, setMatches] = useState<MentorMatch[]>(MENTOR_MATCHES);
  const [optimizing, setOptimizing] = useState(false);

  const optimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setMatches(MENTOR_MATCHES_OPTIMIZED);
      setOptimizing(false);
    }, 1300);
  };

  return (
    <div className="pusula-usta">
      <div className="pusula-place-head">
        <div>
          <Headline ital="Usta" roman="Yolu" size={32} />
          <div className="pusula-sub">
            Yetkinlik boşluğu + o günkü vardiya çakışması → gerekçeli mentor eşleşmesi. Model zamanla öğrenir.
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

      <div className="pusula-usta-grid">
        <AnimatePresence mode="popLayout">
          {matches.map((m, i) => {
            const mentor = byId(m.mentorId);
            const mentee = byId(m.menteeId);
            return (
              <motion.div
                key={m.id}
                layout
                className="pusula-match"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.08, ease: EASE }}
              >
                <div className="pusula-match-head">
                  <div>
                    <span className="pusula-match-shift">
                      <Calendar size={12} /> {m.shift}
                    </span>
                    <div className="pusula-match-focus">{m.focus}</div>
                  </div>
                  {m.aiSuggested && (
                    <span className="pusula-match-ai">
                      <BrainCircuit size={12} /> Model önerisi
                      <ConfidenceDots level={m.confidence} />
                    </span>
                  )}
                </div>

                <div className="pusula-match-pair">
                  <PersonAvatar name={mentor?.name ?? "?"} dark={mentor?.level === MasteryLevel.Coach} size={34} />
                  <div className="pusula-match-who">
                    <span>Mentor</span>
                    <strong>{mentor?.name ?? "—"}</strong>
                  </div>
                  <ArrowRight size={16} className="pusula-match-arrow" />
                  <div className="pusula-match-who right">
                    <span>Öğrenen</span>
                    <strong>{mentee?.name ?? "—"}</strong>
                  </div>
                  <PersonAvatar name={mentee?.name ?? "?"} dark={mentee?.level === MasteryLevel.Coach} size={34} />
                </div>

                <div className="pusula-match-reason">
                  <Zap size={14} strokeWidth={1.6} />
                  <p>{m.reason}</p>
                </div>

                <div className="pusula-match-actions">
                  <button className="pusula-match-yes">Eşleşmeyi onayla</button>
                  <button className="pusula-match-edit">Düzenle / değiştir</button>
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
            Her onay veya revizyonda Pusula saha dinamiklerini (kimin kiminle uyumlu çalıştığı, yetkinlik artışı,
            vardiya yoğunluğu) biraz daha iyi öğrenir; sonraki eşleşmelerin <em>güveni</em> yükselir. Kanıt birikimi
            soft güven göstergesine yansır — sert skor değil.
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
