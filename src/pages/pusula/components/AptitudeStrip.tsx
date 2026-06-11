import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { usePersistentState } from "../session-store";
import {
  channelLabel,
  compLabel,
  provenWord,
  type AptitudeSuggestion,
} from "../data-competency";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * Aptitude döngüsü — KANIT → ÖNERİ → ONAY. Orquest'teki aptitude'u bugün yönetici
 * kanaatle girer; Pusula kanıt birikince güncelleme ÖNERİSİ üretir, KOÇ onaylar
 * (extract-then-confirm'in aptitude hâli). Yazım NİTEL: "yapabiliyor → güçlü";
 * sayı yalnız kanıt hacmidir (n vardiya).
 */
export function AptitudeStrip({ items }: { items: AptitudeSuggestion[] }) {
  const t = useT();
  // onaylar görünüm/kişi değişiminde kaybolmasın (öneri id'si kişiyi içerir)
  const [approved, setApproved] = usePersistentState<Record<string, boolean>>("apt.approved", {});
  if (!items.length) return null;

  return (
    <div className="papt">
      {items.map((s, i) => {
        const ok = approved[s.id];
        return (
          <motion.div
            key={s.id}
            className={`papt-row ${ok ? "ok" : ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
          >
            <div className="papt-seg">
              <span className="papt-k">{t("l.evidence")}</span>
              <span className="papt-v">
                <em>{channelLabel(s.evidence.channel)}</em> {pick(s.evidence.line)}
              </span>
            </div>
            <div className="papt-seg">
              <span className="papt-k">Orquest</span>
              <span className="papt-v papt-sugg">
                {compLabel(s.comp)}: {provenWord(s.from)} <span className="papt-arrow">→</span> {provenWord(s.to)}
              </span>
            </div>
            <div className="papt-act">
              {ok ? (
                <span className="papt-done">
                  <Check size={12} strokeWidth={2} /> {t("l.aptApproved")}
                </span>
              ) : (
                <>
                  <span className="papt-pending">{t("l.pendingCoach")}</span>
                  <button
                    className="papt-approve"
                    onClick={() => setApproved((m) => ({ ...m, [s.id]: true }))}
                  >
                    <Check size={11} strokeWidth={2} /> {t("b.approveApt")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
