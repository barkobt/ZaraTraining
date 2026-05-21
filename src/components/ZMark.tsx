import type { CSSProperties } from "react";

/**
 * ZMark — ZT monogram. Üç varyant (design system spec):
 *   - "icon" (default): zt-icon.png — siyah çerçeveli, embossed beyaz kağıt
 *     üzerinde ZT. Favicon / tab / mini avatar. Boyuta göre yakın PNG seçilir.
 *   - "ink":  zt-mark-ink.png  — çıplak siyah ZT glyph (transparent BG).
 *     Açık zemin üzerinde "type" gibi okunur — printed material, dark-on-light.
 *   - "gold": zt-mark-gold.png — iki-ton altın ZT (transparent BG). Hero'da
 *     merkez nesne. Atelye "leaf-gold" hissi için drop-shadow ile sun.
 */
export function ZMark({
  size = 48,
  variant = "icon",
  className = "",
  style,
}: {
  size?: number;
  variant?: "icon" | "ink" | "gold";
  className?: string;
  style?: CSSProperties;
}) {
  let src: string;
  if (variant === "gold") {
    src = "/zt-mark-gold.png";
  } else if (variant === "ink") {
    src = "/zt-mark-ink.png";
  } else {
    // icon — favicon-style framed; boyuta göre PNG variant
    src =
      size <= 32
        ? "/zara-icon-32.png"
        : size <= 64
          ? "/zara-icon-64.png"
          : size <= 180
            ? "/zara-icon-180.png"
            : size <= 192
              ? "/zara-icon-192.png"
              : "/zara-icon-512.png";
  }
  return (
    <img
      src={src}
      alt="ZARA Atelye"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ display: "block", userSelect: "none", ...style }}
    />
  );
}
