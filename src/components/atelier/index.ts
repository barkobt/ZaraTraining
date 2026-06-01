/**
 * Atelier primitives — design system kit for ZARA · Atelye.
 *
 * Re-export of small, framework-agnostic visual atoms. SoftButton and
 * CornerVignette live one level up in src/components/ for historical
 * reasons; everything else atelier-coded sits here.
 */
export { Eyebrow } from "./Eyebrow";
export { SectionMarker } from "./SectionMarker";
export { LiveDot } from "./LiveDot";
export { Marquee } from "./Marquee";

// editorial -3 primitive'leri (editorial.css ile eşleşir)
export { Panel } from "./Panel";
export { SectionBar } from "./SectionBar";
export { StatCards, type Stat } from "./StatCards";
export { Badge } from "./Badge";
export { AreaGlyph } from "./AreaGlyph";
export { AREA_VISUAL, areaVisual, type AreaGlyphShape } from "./area-visual";
