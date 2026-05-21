import { Eyebrow } from "./Eyebrow";

/**
 * SectionMarker — `BÖLÜM 01 ─────── 04 PARÇA` motif.
 *
 * Eyebrow + hairline + Eyebrow, used as the editorial section divider.
 * Left side optionally `gold` (selected / current chapter); right side
 * is a meta count or mark (e.g. "04 PARÇA", "ISSUE 02", "MMXXVI").
 */
export function SectionMarker({
  left,
  right,
  leftGold = false,
  className = "",
}: {
  left: string;
  right: string;
  leftGold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3.5 py-2 ${className}`}>
      <Eyebrow gold={leftGold}>{left}</Eyebrow>
      <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
      <Eyebrow>{right}</Eyebrow>
    </div>
  );
}
