import type { ReactNode, HTMLAttributes, ElementType } from "react";

/**
 * Eyebrow — the most-used motif in the system.
 *
 * UPPERCASE + wide-tracked JetBrains Mono, sat above headlines, beside
 * hairlines, on top of cards. Default tone is ink/50; `gold` lights it up
 * for selected / featured / "in residence" markers.
 *
 * Sizes (DS-kanonik · --fs-eyebrow = 11px, ağırlık medium 500):
 *   sm → 9px  / 0.24em (chips, tiny meta)
 *   md → 11px / 0.30em (default — section headers)
 *   lg → 12px / 0.32em (carousel chapter labels)
 */
export function Eyebrow({
  children,
  gold = false,
  size = "md",
  as: Tag = "span",
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  gold?: boolean;
  size?: "sm" | "md" | "lg";
  /** Render edilecek element. @default "span" */
  as?: ElementType;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  const sizing =
    size === "sm"
      ? "text-[9px] tracking-[0.24em]"
      : size === "lg"
        ? "text-[12px] tracking-[0.32em]"
        : "text-[11px] tracking-[0.30em]";
  return (
    <Tag
      className={`font-mono uppercase ${sizing} ${className}`}
      style={{ fontWeight: 500, color: gold ? "var(--zara-gold)" : "var(--zara-ink-50)", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
