import type { HTMLAttributes } from "react";
import { Eyebrow } from "./Eyebrow";

/**
 * SectionMarker — `BÖLÜM 01 ─────── 04 PARÇA` motif.
 *
 * Eyebrow + hairline + (opsiyonel) Eyebrow, editorial bölüm ayıracı.
 * Sol taraf isteğe bağlı `gold` (seçili / güncel bölüm); sağ taraf bir
 * meta sayaç/işaret (örn. "04 PARÇA", "MMXXVI") — verilmezse çizilmez.
 */
export function SectionMarker({
  left,
  right,
  leftGold = false,
  className = "",
  ...rest
}: {
  left: string;
  right?: string;
  leftGold?: boolean;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-4 py-2 ${className}`} {...rest}>
      <Eyebrow gold={leftGold}>{left}</Eyebrow>
      <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
      {right ? <Eyebrow>{right}</Eyebrow> : null}
    </div>
  );
}
