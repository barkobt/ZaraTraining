import { motion } from "framer-motion";
import { Eye, GraduationCap, Award, Clock } from "lucide-react";
import { trainingKindLabel, type Training } from "../data-profile";
import { pick } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const KIND_ICON: Record<Training["kind"], typeof Eye> = {
  shadow: Eye,
  micro: GraduationCap,
  transfer: Award,
};

/**
 * Yaklaşan eğitimler — kişinin gelişim arkından türeyen sıradaki adımlar
 * (odak · ne zaman · kiminle). Drawer ve derin profilde paylaşılır.
 */
export function UpcomingTrainings({ items, compact = false }: { items: Training[]; compact?: boolean }) {
  return (
    <div className={`pusula-train ${compact ? "compact" : ""}`}>
      {items.map((t, i) => {
        const KIcon = KIND_ICON[t.kind];
        return (
          <motion.div
            key={i}
            className={`pusula-train-row ${t.kind}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, ease: EASE }}
          >
            <span className="pusula-train-icon"><KIcon size={14} strokeWidth={1.7} /></span>
            <div className="pusula-train-body">
              <div className="pusula-train-focus">{t.focus}</div>
              <div className="pusula-train-meta">
                <span className="pusula-train-kind">{trainingKindLabel(t.kind)}</span>
                <span className="pusula-train-when"><Clock size={10} strokeWidth={1.8} /> {t.when}</span>
                {t.withWhom && (
                  <span className="pusula-train-with">{pick({ tr: "ile", en: "with", es: "con" })} {t.withWhom}</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
