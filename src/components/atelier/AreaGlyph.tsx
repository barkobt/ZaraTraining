import { areaVisual, type AreaGlyphShape } from "./area-visual";

/**
 * AreaGlyph — alanın geometrik sembolü (circle/square/triangle/diamond/ring),
 * alan rengiyle. Design-system -3 shift/ui.jsx → AreaGlyph port'u.
 *
 * `filled` false → sadece kontur (sembol referansı / swatch içi kullanım).
 */
export function AreaGlyph({
  area,
  size = 14,
  filled = true,
}: {
  area: string | null | undefined;
  size?: number;
  filled?: boolean;
}) {
  const { glyph, color } = areaVisual(area);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flex: "0 0 auto" }}
      aria-hidden
    >
      {renderShape(glyph, size, color, filled)}
    </svg>
  );
}

function renderShape(glyph: AreaGlyphShape, s: number, c: string, filled: boolean) {
  const h = s / 2;
  const stroke = filled ? "none" : c;
  const fill = filled ? c : "none";
  const sw = 1.8;
  switch (glyph) {
    case "square":
      return <rect x="2" y="2" width={s - 4} height={s - 4} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "triDown":
      return <path d={`M2 3 H${s - 2} L${h} ${s - 2} Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    case "triUp":
      return <path d={`M${h} 2 L${s - 2} ${s - 3} H2 Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    case "diamond":
      return <path d={`M${h} 1.5 L${s - 1.5} ${h} L${h} ${s - 1.5} L1.5 ${h} Z`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
    case "ring":
      return (
        <>
          <circle cx={h} cy={h} r={h - 1.5} fill="none" stroke={c} strokeWidth={2.4} />
          <circle cx={h} cy={h} r={h - 5.5} fill={c} />
        </>
      );
    case "circle":
    default:
      return <circle cx={h} cy={h} r={h - 1.5} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}
