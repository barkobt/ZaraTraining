import type { ReactNode } from "react";

/**
 * Badge — durum rozeti (editorial.css `.badge`).
 *   ok    → emerald (OPTIMAL)
 *   draft → gold    (KABUL / taslak)
 *   bad   → destructive (INFEASIBLE / hata)
 * `dot` true → currentColor noktası önde gösterilir.
 */
export function Badge({
  tone = "draft",
  dot = true,
  children,
  className = "",
}: {
  tone?: "ok" | "draft" | "bad";
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge ${tone} ${className}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
