import type { CSSProperties, ReactNode, ElementType } from "react";
import { useReveal } from "@/hooks/useReveal";

type Variant = "fade-up" | "slide-l" | "slide-r" | "parallax" | "zoom" | "fade";

interface RevealOnScrollProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  once?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  "fade-up": "reveal-init",
  "slide-l": "reveal-init reveal-slide-l",
  "slide-r": "reveal-init reveal-slide-r",
  "parallax": "reveal-init reveal-parallax",
  "zoom": "reveal-init reveal-zoom",
  "fade": "reveal-init",
};

export function RevealOnScroll({
  children,
  variant = "fade-up",
  delay = 0,
  threshold = 0.15,
  className = "",
  style,
  as,
  once = true,
}: RevealOnScrollProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold, delay, once });
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
