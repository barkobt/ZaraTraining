/**
 * Alan görsel kimliği — geometrik glyph + editorial renk.
 *
 * `constants.ts`'teki AREAS verisinin (id/label/sub) GÖRSEL karşılığı; oranın
 * doygun renkleri (#db2777 vb.) yerine design-system -3'ün yumuşak editorial
 * paletini ve her alana bir geometrik sembol atar. constants.ts'e dokunmadan
 * (solver verisi sabit) sadece sunum katmanını besler.
 *
 * Kaynak: ZARA · Atelye Design System -3 → shift/store.jsx (SO_AREAS).
 */
import type { AreaId } from "@/pages/shift-organizer/constants";

export type AreaGlyphShape =
  | "circle"
  | "square"
  | "triDown"
  | "triUp"
  | "diamond"
  | "ring";

export const AREA_VISUAL: Record<AreaId, { glyph: AreaGlyphShape; color: string }> = {
  WOMAN: { glyph: "circle", color: "#C25A7C" },
  BASIC: { glyph: "square", color: "#3F66A8" },
  TRF: { glyph: "triDown", color: "#C67D33" },
  FITTING_ROOM: { glyph: "diamond", color: "#875BA6" },
  SPRINTER: { glyph: "triUp", color: "#5B9355" },
  RUNNER_360: { glyph: "ring", color: "#2F8595" },
};

/** Bilinmeyen / null alan için nötr görsel. */
export const AREA_VISUAL_FALLBACK = { glyph: "circle" as AreaGlyphShape, color: "var(--zara-ink-30)" };

export function areaVisual(area: string | null | undefined) {
  if (area && area in AREA_VISUAL) return AREA_VISUAL[area as AreaId];
  return AREA_VISUAL_FALLBACK;
}
