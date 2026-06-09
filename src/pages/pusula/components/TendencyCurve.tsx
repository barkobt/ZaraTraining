/**
 * Küçük SVG gelişim eğrisi — "gelişiyor" hissi. Eksen/rakam yok, yalnız yumuşak
 * yükselen çizgi + son noktada nazik vurgu. Girdi 0–4 ölçeğinde; /4 normalize edilir.
 */
export function TendencyCurve({ points }: { points: number[] }) {
  const W = 180;
  const H = 48;
  const pad = 4;
  const n = points.length;
  if (n < 2) return null;

  const norm = points.map((v) => Math.max(0, Math.min(1, v / 4)));
  const xs = (i: number) => pad + (i * (W - pad * 2)) / (n - 1);
  const ys = (v: number) => H - pad - v * (H - pad * 2);
  const d = norm.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(" ");
  const area = `${d} L${xs(n - 1).toFixed(1)},${H - pad} L${xs(0).toFixed(1)},${H - pad} Z`;
  const last = norm[n - 1];

  return (
    <svg className="pusula-curve" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <path d={area} fill="var(--zara-gold-tint)" stroke="none" />
      <path d={d} fill="none" stroke="var(--zara-gold)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs(n - 1)} cy={ys(last)} r={3} fill="var(--zara-gold-deep)" />
    </svg>
  );
}
