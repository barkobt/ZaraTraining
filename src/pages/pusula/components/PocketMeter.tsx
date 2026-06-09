import { motion } from "framer-motion";
import type { PocketState } from "../types";

/**
 * Akşam cebi göstergesi — KADEMELİ: fraction (0..1) arttıkça gergin→rahat yumuşar.
 * Soluk amber → soluk sage. Sert kırmızı→yeşil YOK; --zara-emerald dolgu YOK.
 * Rakam gösterilmez — yalnız nitel etiket + sakinleşen bar. Pencere KİLİTLİ.
 */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export function PocketMeter({ pocket, fraction }: { pocket: PocketState; fraction: number }) {
  const f = Math.max(0, Math.min(1, fraction));
  const eased = f > 0;
  const label = f === 0 ? "Akşam cebi gergin" : f >= 1 ? "Akşam cebi rahatladı" : "Akşam cebi rahatlıyor";
  const word = f === 0 ? "gergin" : f >= 1 ? "rahat" : "rahatlıyor";
  const fill = 0.3 + 0.46 * f;
  const color = eased ? "var(--zara-sage)" : "rgba(191, 149, 80, 0.45)";

  return (
    <div className="pusula-pocket">
      <div className="pusula-pocket-head">
        <span className="pusula-pocket-eb">Akşam Cebi · {pocket.window}</span>
        <span className={`pusula-pocket-state ${eased ? "eased" : "tense"}`}>{label}</span>
      </div>
      <div className="pusula-pocket-track" style={{ background: "var(--zara-bg-alt)" }}>
        <motion.div
          className="pusula-pocket-fill"
          style={{ background: color }}
          animate={{ width: `${Math.round(fill * 100)}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>
      <div className="pusula-pocket-foot">
        Tepe trafik · düşük conversion. Dayanıklı/usta eller öne alınınca akış <em>{word}</em>.
      </div>
    </div>
  );
}
