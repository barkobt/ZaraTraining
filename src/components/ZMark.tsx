/**
 * ZMark — Atelye monogram.
 * Serif italic "Z" + üst-sağda atelye nokta-işareti.
 * currentColor → header (ink) ve footer (büyük) için uyumlu.
 */
export function ZMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Atelye pin — üst sağda küçük dolu nokta */}
      <circle cx="26" cy="6" r="1.8" fill="currentColor" />

      {/* İtalik serif Z — üst, eğik diyagonal, alt serif terminaller */}
      {/* Üst yatay terminal (sağa eğik) */}
      <path
        d="M7 8 L23 8 L24 6 L8 6 Z"
        fill="currentColor"
      />
      {/* Eğik diyagonal (italic akış) */}
      <path
        d="M22 9 L9 23 L10 24 L23 10 Z"
        fill="currentColor"
      />
      {/* Alt yatay terminal */}
      <path
        d="M8 26 L24 26 L25 24 L9 24 Z"
        fill="currentColor"
      />

      {/* İnce serif aksan — üst ve altta küçük çentikler */}
      <path d="M7 6 L7 9" stroke="currentColor" strokeWidth="0.6" />
      <path d="M25 23 L25 26" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}
