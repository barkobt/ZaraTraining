/**
 * ZMark — ZT monogram. İki varyant:
 *   - variant="bw"  (default): siyah-beyaz tab/favicon tarzı (header, footer, küçük)
 *   - variant="gold": altın ZT (Hero ana ekran logosu, büyük)
 *
 * BW boyuta göre yakın favicon PNG variant'ını seçer (sharper rendering).
 * Gold tek bir 1024px transparent PNG.
 */
export function ZMark({
  size = 48,
  variant = "bw",
  className = "",
}: {
  size?: number;
  variant?: "bw" | "gold";
  className?: string;
}) {
  const src =
    variant === "gold"
      ? "/zara-logo-gold.png"
      : size <= 32
        ? "/zara-icon-32.png"
        : size <= 64
          ? "/zara-icon-64.png"
          : size <= 180
            ? "/zara-icon-180.png"
            : size <= 192
              ? "/zara-icon-192.png"
              : "/zara-icon-512.png";
  return (
    <img
      src={src}
      alt="ZARA Training"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ display: "block", userSelect: "none" }}
    />
  );
}
