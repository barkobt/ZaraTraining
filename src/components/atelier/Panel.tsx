import type { ReactNode, CSSProperties } from "react";

/**
 * Panel — beyaz yüzey + hairline + yumuşak panel gölgesi (editorial.css `.panel`).
 * Editorial bölümlerin temel kabı. İçine genelde <SectionBar> + içerik gelir.
 */
export function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`panel ${className}`} style={style}>
      {children}
    </div>
  );
}
