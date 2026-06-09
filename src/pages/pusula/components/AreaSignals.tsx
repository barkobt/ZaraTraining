import { Compass } from "lucide-react";
import type { AreaSignal } from "../types-gelisim";

/**
 * Alan-spesifik dinamik sinyaller — her boyut o alanın GERÇEK çıktısından güncellenir,
 * belirsizlikle (n) gelir. "Veri yok" = o alanda bulunmamış → YARGI DEĞİL: keşif önerilir
 * (buddy eşliğinde 1 vardiya hem geliştirir hem sinyal toplar). Sert skor yok.
 */
const TONE: Record<AreaSignal["level"], { w: string; c: string; word: string }> = {
  strong: { w: "86%", c: "var(--zara-gold)", word: "güçlü" },
  developing: { w: "54%", c: "var(--zara-gold-soft)", word: "gelişiyor" },
  neutral: { w: "30%", c: "var(--zara-line-strong)", word: "başlangıç" },
  none: { w: "0%", c: "transparent", word: "veri yok" },
};

export function AreaSignals({ signals }: { signals: AreaSignal[] }) {
  return (
    <div className="pusula-areasigs">
      {signals.map((s) => {
        const t = TONE[s.level];
        const noData = s.level === "none";
        return (
          <div key={s.area} className="pusula-areasig">
            <div className="pusula-areasig-head">
              <span className="pusula-areasig-area">{s.area}</span>
              {noData ? (
                <span className="pusula-areasig-explore">
                  <Compass size={11} strokeWidth={1.8} /> keşif öner
                </span>
              ) : (
                <span className="pusula-areasig-word">
                  {t.word} <em>· {s.evidence}</em>
                </span>
              )}
            </div>
            {noData ? (
              <div className="pusula-areasig-nodata">
                Bu alanda veri yok — başarısız değil. Buddy eşliğinde 1 vardiya: hem gelişim hem sinyal.
              </div>
            ) : (
              <div className="pusula-areasig-track">
                <span className="pusula-areasig-fill" style={{ width: t.w, background: t.c }} />
              </div>
            )}
            <div className="pusula-areasig-src">{s.source}</div>
          </div>
        );
      })}
    </div>
  );
}
