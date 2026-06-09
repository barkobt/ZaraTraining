import { MasteryLevel } from "../types";

/**
 * Nitel ustalık çipi — MasteryLevel enum'unu kısa ada çevirir, renk token; RAKAM YOK.
 * Yeni / Yetkin / Usta / Koç.
 */
const SHORT: Record<MasteryLevel, "Yeni" | "Yetkin" | "Usta" | "Koç"> = {
  [MasteryLevel.New]: "Yeni",
  [MasteryLevel.Competent]: "Yetkin",
  [MasteryLevel.Master]: "Usta",
  [MasteryLevel.Coach]: "Koç",
};

const TONE: Record<string, { bg: string; fg: string; bd: string }> = {
  Yeni: { bg: "var(--zara-bg-alt)", fg: "var(--zara-ink-50)", bd: "var(--zara-line-strong)" },
  Yetkin: { bg: "var(--zara-bg-warm)", fg: "var(--zara-ink-2)", bd: "var(--zara-line-strong)" },
  Usta: { bg: "var(--zara-gold-tint)", fg: "var(--zara-gold-deep)", bd: "var(--zara-gold-soft)" },
  Koç: { bg: "var(--zara-ink)", fg: "var(--zara-bg)", bd: "var(--zara-ink)" },
};

export function MasteryChip({ level }: { level: MasteryLevel }) {
  const label = SHORT[level];
  const t = TONE[label];
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
