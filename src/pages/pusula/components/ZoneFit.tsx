import { motion } from "framer-motion";
import { Star, Circle, Compass } from "lucide-react";
import { FLOOR_ZONES, zoneLabel, type FloorZone } from "../data-floor";
import {
  compShortCaps,
  personCompetencies,
  zoneFit,
  zoneFitReason,
} from "../data-competency";
import type { Employee } from "../types";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Kişinin durumuna göre keşif/gelişim fırsatı olan zone (birincil talebi kanıtsız). */
function growthZone(emp: Employee, exclude: FloorZone[]): FloorZone | null {
  const pcs = personCompetencies(emp.id);
  const weak = pcs.find((p) => p.state.kind === "unexplored") ?? pcs.find((p) => p.state.kind === "emerging");
  if (!weak) return null;
  return (
    FLOOR_ZONES.find(
      (z) =>
        z.area === "on" &&
        z.needs.length > 0 &&
        !exclude.includes(z) &&
        [...z.needs].sort((a, b) => b.weight - a.weight)[0].comp === weak.comp,
    ) ?? null
  );
}

/**
 * Nerede parlar — zone UYUMU: zone'un talebi (needs) × kişinin kanıtı.
 * En uyumlu 2–3 alan gerekçesiyle + 1 gelişim/keşif fırsatı. Kanıt öneride durur;
 * kişiye sayı basılmaz.
 */
export function ZoneFit({ emp }: { emp: Employee }) {
  const t = useT();
  const zones = FLOOR_ZONES.filter((z) => z.area === "on" && z.needs.length > 0)
    .sort((a, b) => zoneFit(emp.id, b.needs) - zoneFit(emp.id, a.needs))
    .slice(0, 3);
  const growth = growthZone(emp, zones);

  return (
    <div className="pfit">
      {zones.map((z, i) => {
        const reason = zoneFitReason(emp.id, z.needs);
        const Icon = i === 0 ? Star : Circle;
        return (
          <motion.div
            key={z.id}
            className={`pfit-row ${i === 0 ? "top" : ""}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
          >
            <span className="pfit-ico">
              <Icon size={13} strokeWidth={1.8} />
            </span>
            <div className="pfit-body">
              <span className="pfit-zone">{zoneLabel(z)}</span>
              <span className="pfit-why">
                {reason ??
                  pick({ tr: "talep × kanıt eşleşmesi", en: "demand × evidence match", es: "demanda × evidencia" })}
              </span>
            </div>
            <span className="pfit-needs">
              {[...z.needs]
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 2)
                .map((n) => compShortCaps(n.comp))
                .join(" · ")}
            </span>
          </motion.div>
        );
      })}

      {growth && (
        <motion.div
          className="pfit-row growth"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.24, duration: 0.4, ease: EASE }}
        >
          <span className="pfit-ico">
            <Compass size={13} strokeWidth={1.8} />
          </span>
          <div className="pfit-body">
            <span className="pfit-zone">{zoneLabel(growth)}</span>
            <span className="pfit-why">
              {pick({
                tr: "birincil talebi henüz kanıtsız — buddy'li deneme ile hem gelişim hem sinyal",
                en: "primary demand unproven yet — a buddied try builds growth and signal",
                es: "demanda principal sin evidencia — un intento con buddy crea desarrollo y señal",
              })}
            </span>
          </div>
          <span className="pfit-needs gold">{t("l.growthFit")}</span>
        </motion.div>
      )}
    </div>
  );
}
