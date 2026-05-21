/**
 * ZaraLogo — şampanya gradientli lüks Z monogramı.
 * /public/zara-icon.svg dosyasını <img> ile yükler (gradient + filter
 * korunur, currentColor kullanmaz). Header'da küçük, hero'da büyük.
 */
export function ZMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/zara-icon.svg"
      alt="ZARA Atelye"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ display: "block", userSelect: "none" }}
    />
  );
}
