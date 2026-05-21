import { Eyebrow } from "./Eyebrow";

/**
 * LiveDot — emerald pulsing dot + LIVE label.
 *
 * Emerald is reserved ONLY for this dot — never used for fills or text
 * elsewhere in the system. Pulse rhythm is slow (2.4s, opacity 0.55 ↔ 1).
 */
export function LiveDot({
  label = "LIVE",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="w-1.5 h-1.5 rounded-full animate-glow"
        style={{ background: "var(--zara-emerald)" }}
      />
      <Eyebrow>{label}</Eyebrow>
    </div>
  );
}
