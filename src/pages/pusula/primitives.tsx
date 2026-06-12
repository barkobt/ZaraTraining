// Pusula'nın editorial temel bileşenleri.
// Brain modülünden devralındı (brain kaldırıldı); Pusula'nın kullandığı
// üç parça burada bağımsız yaşar: Headline · Eyebrow · LiveDot.
import type { CSSProperties, ReactNode } from "react";

const MUTED = "var(--zara-ink-50)";
const GOLD = "var(--zara-gold)";
const INK = "var(--zara-ink)";

export function Eyebrow({
  children,
  dot = true,
  gold = false,
  style,
}: {
  children: ReactNode;
  dot?: boolean;
  gold?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--ff-mono)",
        fontSize: 10,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: gold ? GOLD : MUTED,
        ...style,
      }}
    >
      {dot ? "· " : ""}
      {children}
    </div>
  );
}

export function Headline({
  ital,
  roman,
  size = 28,
  color = INK,
  style,
}: {
  ital?: string;
  roman: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: "var(--ff-display)",
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.01em",
        color,
        lineHeight: 1.08,
        ...style,
      }}
    >
      {ital && <em style={{ fontStyle: "italic", fontWeight: 300 }}>{ital} </em>}
      {roman}
    </h2>
  );
}

export function LiveDot({ label = "CANLI" }: { label?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--ff-mono)",
        fontSize: 9,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: MUTED,
      }}
    >
      <span
        className="brain-live-dot"
        style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--zara-emerald)" }}
      />
      {label}
    </span>
  );
}
