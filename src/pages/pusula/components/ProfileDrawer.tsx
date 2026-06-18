import { AnimatePresence, motion } from "framer-motion";
import { X, CalendarRange } from "lucide-react";
import { useAtelyeNav } from "@/lib/atelye-nav";
import { MasteryLevel, type Employee } from "../types";
import { PersonAvatar } from "./PersonAvatar";
import { MasteryChip } from "./MasteryChip";
import { ConfidenceDots } from "./ConfidenceDots";
import { CompetencyCards } from "./CompetencyCards";
import { UpcomingTrainings } from "./UpcomingTrainings";
import { strongPointOf } from "../data-competency";
import { sellingPersona } from "../data-program";
import { upcomingTrainings } from "../data-profile";
import { useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * Sağdan açılan hızlı peek drawer. "Tam profil →" Profil tab'ine atlar.
 */
export function ProfileDrawer({
  person,
  onClose,
  onFull,
}: {
  person: Employee | null;
  onClose: () => void;
  onFull: () => void;
}) {
  const t = useT();
  const { openInShift } = useAtelyeNav();
  const pa = person ? sellingPersona(person) : null;
  const trainings = person ? upcomingTrainings(person) : [];
  return (
    <AnimatePresence>
      {person && (
        <>
          <motion.div
            className="pusula-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.aside
            className="pusula-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="pusula-drawer-head">
              <div className="pusula-drawer-id">
                <PersonAvatar name={person.name} dark={person.level === MasteryLevel.Coach} size={44} />
                <div>
                  <div className="pusula-drawer-name">{person.name}</div>
                  <MasteryChip level={person.level} />
                </div>
              </div>
              <button className="pusula-drawer-x" onClick={onClose} aria-label={t("a11y.close")}>
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            {pa && (
              <div className="pusula-drawer-persona">
                <span className="pusula-drawer-persona-label">{pa.label}</span>
                <span className="pusula-drawer-persona-energy">{pa.energy}</span>
              </div>
            )}

            <div className="pusula-drawer-strong">{strongPointOf(person)}</div>

            <div className="pusula-drawer-conf">
              <span>{t("l.confidence")}</span>
              <ConfidenceDots level={person.confidence} />
            </div>

            {trainings.length > 0 && (
              <div className="pusula-drawer-sec">
                <span className="pusula-drawer-eb">{t("e.upcoming")}</span>
                <UpcomingTrainings items={trainings.slice(0, 2)} compact />
              </div>
            )}

            <div className="pusula-drawer-sec">
              <span className="pusula-drawer-eb">{t("e.strongIn")}</span>
              <CompetencyCards personId={person.id} compact />
            </div>

            <div className="pusula-drawer-foot">
              <div className="pusula-drawer-actions">
                <button className="pusula-fulllink" onClick={onFull}>
                  {t("b.fullProfile")}
                </button>
                {/* Çapraz-link: kişiyi Shift Organizer matrisinde aç (?focus=İlkAd) */}
                <button
                  className="pusula-crosslink"
                  onClick={() => openInShift(person.name.split(" ")[0])}
                  title="Bu kişiyi Shift Organizer matrisinde aç"
                >
                  <CalendarRange size={13} strokeWidth={1.6} />
                  Shift'te göster
                </button>
              </div>
              <span className="pusula-drawer-note">{t("a.worker")}</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
