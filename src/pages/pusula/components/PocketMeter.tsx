import { motion } from "framer-motion";
import type { PocketState } from "../types";
import { pick } from "../i18n";

/**
 * Akşam cebi göstergesi — KADEMELİ: fraction (0..1) arttıkça gergin→rahat yumuşar.
 * Soluk amber → soluk sage. Sert kırmızı→yeşil YOK; --zara-emerald dolgu YOK.
 * Rakam gösterilmez — yalnız nitel etiket + sakinleşen bar. Pencere KİLİTLİ.
 */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export function PocketMeter({ pocket, fraction }: { pocket: PocketState; fraction: number }) {
  const f = Math.max(0, Math.min(1, fraction));
  const eased = f > 0;
  const label =
    f === 0
      ? pick({ tr: "Akşam cebi gergin", en: "Evening pocket tense", es: "Hueco vespertino tenso" })
      : f >= 1
        ? pick({ tr: "Akşam cebi rahatladı", en: "Evening pocket eased", es: "Hueco vespertino relajado" })
        : pick({ tr: "Akşam cebi rahatlıyor", en: "Evening pocket easing", es: "Hueco vespertino relajándose" });
  const word =
    f === 0
      ? pick({ tr: "gergin", en: "tense", es: "tenso" })
      : f >= 1
        ? pick({ tr: "rahat", en: "calm", es: "tranquilo" })
        : pick({ tr: "rahatlıyor", en: "easing", es: "relajándose" });
  const fill = 0.3 + 0.46 * f;
  const color = eased ? "var(--zara-sage)" : "rgba(191, 149, 80, 0.45)";

  return (
    <div className="pusula-pocket">
      <div className="pusula-pocket-head">
        <span className="pusula-pocket-eb">{pick({ tr: "Akşam Cebi", en: "Evening Pocket", es: "Hueco Vespertino" })} · {pocket.window}</span>
        <span className={`pusula-pocket-state ${eased ? "eased" : "tense"}`}>{label}</span>
      </div>
      {/* gergin → rahat ölçeği — öncesi/sonrası MEKÂNSAL okunur (rakam yok):
          başlangıç kutbu (cep bazı, 30%) ve hedef kutbu (rahat, 76%). */}
      <div className="pusula-pocket-scale" aria-hidden>
        <span className="s-start" style={{ left: "30%" }}>{pick({ tr: "gergin", en: "tense", es: "tenso" })}</span>
        <span className="s-end" style={{ left: "76%" }}>{pick({ tr: "rahat", en: "calm", es: "tranquilo" })}</span>
      </div>
      <div className="pusula-pocket-track" style={{ background: "var(--zara-bg-alt)" }}>
        <motion.div
          className="pusula-pocket-fill"
          style={{ background: color }}
          animate={{ width: `${Math.round(fill * 100)}%` }}
          transition={{ duration: 0.7, ease: EASE }}
        />
        {/* başlangıç çentiği — "buradan başladık"; dolum bunu geçtikçe kazanılan rahatlama okunur */}
        <span className="pusula-pocket-notch" style={{ left: "30%" }} aria-hidden />
      </div>
      <div className="pusula-pocket-foot">
        {pick({
          tr: "Tepe trafik · düşük conversion. Dayanıklı/usta eller öne alınınca akış ",
          en: "Peak traffic · low conversion. As resilient/master hands come forward, the flow becomes ",
          es: "Tráfico pico · baja conversión. Cuando entran manos resistentes/maestras, el flujo se vuelve ",
        })}
        <em>{word}</em>.
      </div>
    </div>
  );
}
