/**
 * ZMark — yeni ZT monogram (altın + krem ZT logo).
 * /public/zara-icon-*.png varyantlarından boyuta göre en yakını seçilir
 * (sharp rendering için).
 */
export function ZMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  // Yüksek-DPI ekranlarda netlik için boyuta göre en yakın PNG variant'ı seç.
  // Asset boyutları: 32 / 64 / 180 / 192 / 512.
  const pick = (() => {
    if (size <= 32) return "/zara-icon-32.png";
    if (size <= 64) return "/zara-icon-64.png";
    if (size <= 180) return "/zara-icon-180.png";
    if (size <= 192) return "/zara-icon-192.png";
    return "/zara-icon-512.png";
  })();
  return (
    <img
      src={pick}
      alt="ZARA Atelye"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ display: "block", userSelect: "none" }}
    />
  );
}
