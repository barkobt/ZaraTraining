/**
 * Pusula gülü — marka işareti (kullanıcının referans görselinden: iç içe
 * halkalar + dört tik + iki tonlu dikey ibre + merkez nokta). Monokrom;
 * currentColor üzerinden bağlama uyar.
 */
export function PusulaMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* dış halka + tikler */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <line x1="16" y1="0.5" x2="16" y2="4" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="16" y1="28" x2="16" y2="31.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="0.5" y1="16" x2="4" y2="16" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="28" y1="16" x2="31.5" y2="16" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      {/* iç halka */}
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
      {/* ibre — kuzey dolu, güney soluk */}
      <path d="M16 3.5 L13.6 16 L18.4 16 Z" fill="currentColor" />
      <path d="M16 28.5 L13.6 16 L18.4 16 Z" fill="currentColor" fillOpacity="0.28" />
      <circle cx="16" cy="16" r="2.1" fill="currentColor" />
    </svg>
  );
}
