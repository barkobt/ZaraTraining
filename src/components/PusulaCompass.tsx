/**
 * Pusula'nın marka sembolü — editorial compass (krem/köz/altın).
 * "Pusula = yön" metaforu: bezel tikleri, kardinal harfler, altın iğne.
 * Referanstaki mavi UI yerine atölye paletine sadık; açık kart zemininde
 * (ink çizgi) ve koyu showcase zemininde (krem çizgi) çalışsın diye `dark`.
 *
 * Renkler currentColor üzerinden gelir → consumer `style={{ color }}` ile
 * nötr çizgi tonunu verir; altın vurgu sabit --zara-gold token'ı.
 */
export function PusulaCompass({
  className,
  dark = false,
  heading = 26, // derece — iğnenin baktığı yön (NNE)
}: {
  className?: string;
  dark?: boolean;
  heading?: number;
}) {
  const C = 160; // merkez (viewBox 320)
  const neutral = dark ? "rgba(245,241,234,0.55)" : "rgba(26,22,20,0.55)";
  const faint = dark ? "rgba(245,241,234,0.22)" : "rgba(26,22,20,0.20)";
  const gold = "var(--zara-gold)";
  const goldSoft = "var(--zara-gold-soft)";

  // Bezel tikleri: 60 adım, kardinal/interkardinaller uzun.
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const ang = (i / 60) * 360;
    const major = i % 5 === 0;
    const r2 = 150;
    const r1 = major ? 136 : 143;
    const rad = ((ang - 90) * Math.PI) / 180;
    return {
      x1: C + r1 * Math.cos(rad), y1: C + r1 * Math.sin(rad),
      x2: C + r2 * Math.cos(rad), y2: C + r2 * Math.sin(rad),
      major,
    };
  });

  const cardinals = [
    { l: "N", a: 0 }, { l: "E", a: 90 }, { l: "S", a: 180 }, { l: "W", a: 270 },
  ].map((c) => {
    const rad = ((c.a - 90) * Math.PI) / 180;
    return { ...c, x: C + 116 * Math.cos(rad), y: C + 116 * Math.sin(rad) };
  });

  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      style={{ color: neutral, overflow: "visible" }}
      aria-hidden
    >
      {/* dış halka */}
      <circle cx={C} cy={C} r={150} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />
      {/* iç kesik halka */}
      <circle cx={C} cy={C} r={100} fill="none" stroke={goldSoft} strokeWidth={1} strokeDasharray="2 7" opacity={0.7} />
      <circle cx={C} cy={C} r={62} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.25} />

      {/* bezel tikleri */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? "currentColor" : faint}
          strokeWidth={t.major ? 1.4 : 0.8}
          opacity={t.major ? 0.7 : 1}
        />
      ))}

      {/* kardinal harfler */}
      {cardinals.map((c) => (
        <text
          key={c.l}
          x={c.x} y={c.y}
          textAnchor="middle" dominantBaseline="central"
          style={{ font: "600 15px var(--ff-mono)", letterSpacing: "0.05em" }}
          fill={c.l === "N" ? gold : "currentColor"}
          opacity={c.l === "N" ? 1 : 0.55}
        >
          {c.l}
        </text>
      ))}

      {/* iğne — kuzey altın, güney nötr; heading kadar döner */}
      <g transform={`rotate(${heading} ${C} ${C})`}>
        <polygon points={`${C},${C - 86} ${C - 9},${C} ${C + 9},${C}`} fill={gold} />
        <polygon points={`${C},${C + 70} ${C - 9},${C} ${C + 9},${C}`} fill="currentColor" opacity={0.45} />
      </g>

      {/* merkez göbek */}
      <circle cx={C} cy={C} r={7} fill={dark ? "var(--zara-ink)" : "var(--zara-bg)"} stroke={gold} strokeWidth={1.5} />
      <circle cx={C} cy={C} r={2.2} fill={gold} />
    </svg>
  );
}
