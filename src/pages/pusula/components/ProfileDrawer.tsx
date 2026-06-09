import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { MasteryLevel, type Employee } from "../types";
import { PersonAvatar } from "./PersonAvatar";
import { MasteryChip } from "./MasteryChip";
import { ConfidenceDots } from "./ConfidenceDots";
import { AsaBar } from "./AsaBar";

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
              <button className="pusula-drawer-x" onClick={onClose} aria-label="Kapat">
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>

            <div className="pusula-drawer-strong">{person.strongPoint}</div>

            <div className="pusula-drawer-conf">
              <span>Güven</span>
              <ConfidenceDots level={person.confidence} />
            </div>

            <div className="pusula-drawer-asa">
              {person.asaMap.map((a) => (
                <AsaBar key={a.label} asa={a} />
              ))}
            </div>

            <div className="pusula-drawer-foot">
              <button className="pusula-fulllink" onClick={onFull}>
                Tam profil →
              </button>
              <span className="pusula-drawer-note">Bu profili çalışan da görür.</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
