import type { ASA, AsaStatus } from "../types";

/** Nitel ASA çubuğu — skor yok, yalnız ton + nitel uzunluk + (varsa) kanıt. */
const TONE: Record<AsaStatus, { w: string; color: string; word: string }> = {
  strong: { w: "84%", color: "var(--zara-gold)", word: "güçlü" },
  developing: { w: "52%", color: "var(--zara-gold-soft)", word: "gelişiyor" },
  neutral: { w: "30%", color: "var(--zara-line-strong)", word: "nötr" },
};

export function AsaBar({ asa }: { asa: ASA }) {
  const t = TONE[asa.status];
  return (
    <div className="pusula-asa">
      <div className="pusula-asa-head">
        <span className="pusula-asa-label">{asa.label}</span>
        <span className="pusula-asa-word">{t.word}</span>
      </div>
      <div className="pusula-asa-track">
        <span className="pusula-asa-fill" style={{ width: t.w, background: t.color }} />
      </div>
      {asa.provenBy && <div className="pusula-asa-proven">{asa.provenBy}</div>}
    </div>
  );
}
