import type { ReactNode } from "react";

/**
 * Eyebrow — the most-used motif in the system.
 *
 * UPPERCASE + wide-tracked JetBrains Mono, sat above headlines, beside
 * hairlines, on top of cards. Default tone is ink/50; `gold` lights it up
 * for selected / featured / "in residence" markers.
 *
 * Sizes:
 *   sm → 9px / 0.25em tracking (chips, tiny meta)
 *   md → 10px / 0.30em tracking (the default — section headers)
 *   lg → 11px / 0.32em tracking (carousel chapter labels)
 */
export function Eyebrow({
  children,
  gold = false,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  gold?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizing =
    size === "sm"
      ? "text-[9px] tracking-[0.25em]"
      : size === "lg"
        ? "text-[11px] tracking-[0.32em]"
        : "text-[10px] tracking-[0.30em]";
  return (
    <span
      className={`font-mono uppercase ${sizing} ${className}`}
      style={{ color: gold ? "var(--zara-gold)" : "var(--zara-ink-50)" }}
    >
      {children}
    </span>
  );
}
