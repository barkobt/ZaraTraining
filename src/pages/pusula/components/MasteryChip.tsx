import { MasteryLevel } from "../types";
import { pick } from "../i18n";

/**
 * Nitel ustalık çipi — MasteryLevel enum'unu kısa ada çevirir, renk token; RAKAM YOK.
 * Yeni / Yetkin / Usta / Koç (aktif dilde).
 */
const SHORT: Record<MasteryLevel, () => string> = {
  [MasteryLevel.New]: () => pick({ tr: "Yeni", en: "New", es: "Nuevo" }),
  [MasteryLevel.Competent]: () => pick({ tr: "Yetkin", en: "Proficient", es: "Competente" }),
  [MasteryLevel.Master]: () => pick({ tr: "Usta", en: "Master", es: "Maestro" }),
  [MasteryLevel.Coach]: () => pick({ tr: "Koç", en: "Coach", es: "Coach" }),
};

const TONE: Record<MasteryLevel, { bg: string; fg: string; bd: string }> = {
  [MasteryLevel.New]: { bg: "var(--zara-bg-alt)", fg: "var(--zara-ink-50)", bd: "var(--zara-line-strong)" },
  [MasteryLevel.Competent]: { bg: "var(--zara-bg-warm)", fg: "var(--zara-ink-2)", bd: "var(--zara-line-strong)" },
  [MasteryLevel.Master]: { bg: "var(--zara-gold-tint)", fg: "var(--zara-gold-deep)", bd: "var(--zara-gold-soft)" },
  [MasteryLevel.Coach]: { bg: "var(--zara-ink)", fg: "var(--zara-bg)", bd: "var(--zara-ink)" },
};

export function MasteryChip({ level }: { level: MasteryLevel }) {
  const label = SHORT[level]();
  const t = TONE[level];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--ff-mono)",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 3,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
      }}
    >
      {label}
    </span>
  );
}
