import { hourly, pocket } from "../data";
import { pick } from "../i18n";

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

  // "ŞİMDİ" imleci — gerçek saat (rastgele veri değil). Aralık dışındaysa gizli.
  const now = new Date();
  const nowH = now.getHours();
  const nowMin = now.getMinutes();
  const firstH = parseInt(hourly[0].hour, 10);
  const lastH = parseInt(hourly[n - 1].hour, 10);
  const inRange = nowH >= firstH && nowH <= lastH;
  const nowX = inRange ? padX + bw * (nowH - firstH) + bw * (nowMin / 60) : null;
  // cep geri-sayımı — pocket.window "17:00–19:00"
  const pStartH = parseInt(pocket.window, 10);
  const pEndH = parseInt(pocket.window.split(/[–-]/)[1] ?? "", 10) || pStartH + 2;
  const nowT = nowH * 60 + nowMin;
  const pocketMsg =
    nowT < pStartH * 60
      ? (() => { const d = pStartH * 60 - nowT; return d >= 60 ? `cebe ${Math.floor(d / 60)} sa ${d % 60} dk` : `cebe ${d} dk`; })()
      : nowT <= pEndH * 60
        ? "cep şu an"
        : "cep geçti";

  return (
    <div className="pusula-spark">
      <div className="pusula-spark-head">
        <span className="pusula-pocket-eb">{pick({ tr: "Saatlik akış · 15–21", en: "Hourly flow · 15–21", es: "Flujo por hora · 15–21" })}</span>
        <span className="pusula-spark-legend">
          <i className="t" /> {pick({ tr: "trafik", en: "traffic", es: "tráfico" })} <i className="c" /> conversion
        </span>
      </div>
      {inRange && (
        <div className="pusula-spark-now">
          <span className="n">ŞİMDİ {String(nowH).padStart(2, "0")}:{String(nowMin).padStart(2, "0")}</span>
          <span className="p">{pocketMsg}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="pusula-spark-svg">
        {pWidth > 0 && <rect x={pStart} y={padTop - 4} width={pWidth} height={H - padTop - padBot + 8} rx={5} fill="var(--zara-gold)" opacity={0.07} />}
        {/* taban çizgisi */}
        <line x1={padX} y1={H - padBot} x2={W - padX} y2={H - padBot} stroke="var(--zara-line-strong)" strokeWidth={0.8} />
        {hourly.map((h, i) => {
          const bh = (h.traffic / maxT) * (H - padTop - padBot);
          return (
            <rect
              key={h.hour}
              x={padX + bw * i + bw * 0.26}
              y={H - padBot - bh}
              width={bw * 0.48}
              height={bh}
              rx={2.5}
              fill="var(--zara-ink)"
              opacity={0.12}
            />
          );
        })}
        <path d={line} fill="none" stroke="var(--zara-gold)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {hourly.map((h, i) => (
          <circle key={h.hour} cx={cx(i)} cy={cy(h.conv)} r={2.2} fill="var(--zara-gold-deep)" />
        ))}
        {/* "ŞİMDİ" dikey imleci — gerçek saate kilitli (SVG çizgi gerilmeye dayanıklı) */}
        {nowX != null && (
          <>
            <line x1={nowX} y1={padTop - 4} x2={nowX} y2={H - padBot} stroke="var(--zara-ink)" strokeWidth={0.9} strokeDasharray="2.5 2.5" opacity={0.7} />
            <circle cx={nowX} cy={padTop - 4} r={2} fill="var(--zara-ink)" />
          </>
        )}
        {hourly.map((h, i) => (
          <text key={h.hour} x={cx(i)} y={H - 6} textAnchor="middle" className="pusula-spark-x">
            {h.hour.slice(0, 2)}
          </text>
        ))}
      </svg>
      <div className="pusula-spark-foot">
        {pick({
          tr: "Tepe-saatte trafik zirvede, conversion dipte — kapatılan açık talep cebi.",
          en: "At peak, traffic spikes and conversion bottoms out — the open-demand pocket being closed.",
          es: "En el pico, el tráfico se dispara y la conversión cae — el hueco de demanda abierta que se cierra.",
        })}
      </div>
    </div>
  );
}
