import type { Employee } from "../types";

/**
 * Soluk güven göstergesi — SOFT seviye ("emerging|medium|high") → ince çubuklar.
 * Yüzde/rakam YOK ("sert rakam yok" kuralı). Kanıt kişide değil, öneride durur.
 */
const FILLED: Record<Employee["confidence"], number> = {
  emerging: 2,
  medium: 3,
  high: 5,
};

export function ConfidenceDots({ level }: { level: Employee["confidence"] }) {
  const filled = FILLED[level];
  return (
    <span
      style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
      aria-label={`güven düzeyi: ${level}`}
      title="Güven düzeyi — kanıt birikimi"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 9,
            borderRadius: 1,
            background: i < filled ? "var(--zara-gold-soft)" : "var(--zara-line-strong)",
          }}
        />
      ))}
    </span>
  );
}
