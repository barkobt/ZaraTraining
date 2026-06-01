import type { ReactNode } from "react";

/**
 * SectionBar — `[01] Başlık · · · hint` panel başlığı (editorial.css `.sec-bar`).
 * Design-system -3 shift/ui.jsx → SOSectionBar muadili. Sağ tarafa buton/aksiyon
 * koymak için `children` (hint'in yerine geçmez, yanına gelir).
 */
export function SectionBar({
  idx,
  title,
  hint,
  children,
}: {
  idx: string;
  title: ReactNode;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="sec-bar">
      <span className="idx num">{idx}</span>
      <span className="ttl">{title}</span>
      {hint && !children && <span className="hint">{hint}</span>}
      {children && (
        <span className="hint" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          {hint && <span>{hint}</span>}
          {children}
        </span>
      )}
    </div>
  );
}
