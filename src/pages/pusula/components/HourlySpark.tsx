import { hourly } from "../data";

/**
 * #4 — gerçek saatlik örüntü (Export.xlsx 2025): trafik bar'ları + conversion
 * çizgisi. Akşam cebi (17–19) gölgeli. "Çok insan giriyor, conversion düşüyor"
 * görsel olarak okunur — yerleşimin neden bu cebe odaklandığını anlatır.
 */
export function HourlySpark() {
  const W = 320;
  const H = 96;
  const padX = 6;
  const padTop = 10;
  const padBot = 20;
  const n = hourly.length;
  const maxT = Math.max(...hourly.map((h) => h.traffic));
  const maxC = Math.max(...hourly.map((h) => h.conv));
  const bw = (W - padX * 2) / n;

  const cx = (i: number) => padX + bw * i + bw / 2;
  const cy = (v: number) => padTop + (1 - v / maxC) * (H - padTop - padBot);

  const line = hourly.map((h, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${cy(h.conv).toFixed(1)}`).join(" ");
  // cep penceresi (17–19) — başlangıç saati 17 veya 18 olan dilimler
  const pocketIdx = hourly.map((h, i) => ({ i, peak: /^1[78]:/.test(h.hour) })).filter((x) => x.peak).map((x) => x.i);
  const pStart = pocketIdx.length ? padX + bw * Math.min(...pocketIdx) : 0;
  const pWidth = pocketIdx.length ? bw * pocketIdx.length : 0;

  return (
    <div className="pusula-spark">
      <div className="pusula-spark-head">
        <span className="pusula-pocket-eb">Saatlik akış · 15–21</span>
        <span className="pusula-spark-legend">
          <i className="t" /> trafik <i className="c" /> conversion
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="pusula-spark-svg">
        {pWidth > 0 && <rect x={pStart} y={padTop - 4} width={pWidth} height={H - padTop - padBot + 8} fill="var(--zara-gold-tint)" />}
        {hourly.map((h, i) => {
          const bh = (h.traffic / maxT) * (H - padTop - padBot);
          return (
            <rect
              key={h.hour}
              x={padX + bw * i + bw * 0.2}
              y={H - padBot - bh}
              width={bw * 0.6}
              height={bh}
              fill="var(--zara-line-strong)"
              opacity={0.5}
            />
          );
        })}
        <path d={line} fill="none" stroke="var(--zara-gold)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {hourly.map((h, i) => (
          <circle key={h.hour} cx={cx(i)} cy={cy(h.conv)} r={2.2} fill="var(--zara-gold-deep)" />
        ))}
        {hourly.map((h, i) => (
          <text key={h.hour} x={cx(i)} y={H - 6} textAnchor="middle" className="pusula-spark-x">
            {h.hour.slice(0, 2)}
          </text>
        ))}
      </svg>
      <div className="pusula-spark-foot">
        Tepe-saatte trafik zirvede, conversion dipte — kapatılan açık talep cebi.
      </div>
    </div>
  );
}
