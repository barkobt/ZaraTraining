import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Trajectory } from "../data-profile";

/**
 * Gelişim yörüngesi — geçmiş haftalar (DOLU İNK çizgi = gerçek/proven) +
 * "şimdi" + tahmin (KESİK ALTIN = projeksiyon). Renk semantiği sayfanın
 * geneliyle aynı: ink = gerçek veri, gold = projeksiyon/eşik. Sayı bireyin
 * kendi yörüngesidir — sıralama değil. Üniform ölçek (distorsiyon yok).
 */
export function GrowthTrajectory({ traj }: { traj: Trajectory }) {
  const W = 560, H = 168, padX = 18, padTop = 24, padBot = 38;
  const pts = traj.points;
  const n = pts.length;
  const nowIdx = pts.findIndex((p) => p.forecast) - 1; // son geçmiş nokta = "şimdi"
  const x = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  const y = (v: number) => padTop + (1 - v / 100) * (H - padTop - padBot);

  const solid = pts.filter((p) => !p.forecast);
  const dashStart = Math.max(0, nowIdx);
  const dashed = pts.slice(dashStart);
  const baseY = H - padBot;

  const path = (arr: { v: number }[], offset: number) =>
    arr.map((p, i) => `${i === 0 ? "M" : "L"}${x(offset + i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");

  const areaPath =
    `M${x(dashStart)},${y(dashed[0].v)} ` +
    dashed.map((p, i) => `L${x(dashStart + i)},${y(p.v)}`).join(" ") +
    ` L${x(n - 1)},${baseY} L${x(dashStart)},${baseY} Z`;

  return (
    <div className="pusula-traj">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="pusula-traj-svg" role="img">
        {/* taban ekseni */}
        <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke="var(--zara-line-strong)" strokeWidth={1} />
        {/* "şimdi" dikey kılavuzu */}
        {nowIdx >= 0 && (
          <line x1={x(nowIdx)} y1={padTop - 6} x2={x(nowIdx)} y2={baseY} stroke="var(--zara-line)" strokeWidth={1} />
        )}
        {/* usta eşiği (~85) — gold kesik + etiket */}
        <line x1={padX} y1={y(85)} x2={W - padX} y2={y(85)} stroke="var(--zara-gold-soft)" strokeWidth={1} strokeDasharray="3 4" />
        <text x={W - padX} y={y(85) - 5} textAnchor="end" className="pusula-traj-thr">
          {traj.etaWeeks > 0 ? `USTA EŞİĞİ · ~${traj.etaWeeks}H` : "USTA EŞİĞİ ✓"}
        </text>

        {/* tahmin alanı (soluk gold) */}
        <path d={areaPath} fill="var(--zara-gold-tint)" />
        {/* geçmiş — DOLU İNK (gerçek) */}
        <motion.path
          d={path(solid, 0)} fill="none" stroke="var(--zara-ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
        />
        {/* tahmin — KESİK GOLD (projeksiyon) */}
        <path d={path(dashed, dashStart)} fill="none" stroke="var(--zara-gold-deep)" strokeWidth={1.6} strokeDasharray="4 3" strokeLinecap="round" />

        {/* noktalar */}
        {pts.map((p, i) => {
          const now = i === nowIdx;
          return (
            <g key={i}>
              {now && <circle cx={x(i)} cy={y(p.v)} r={6} fill="var(--zara-ink)" opacity={0.1} />}
              <circle
                cx={x(i)} cy={y(p.v)} r={now ? 3.6 : 2.4}
                fill={p.forecast ? "var(--zara-bg)" : "var(--zara-ink)"}
                stroke={p.forecast ? "var(--zara-gold-deep)" : "none"} strokeWidth={1.4}
              />
            </g>
          );
        })}
        {/* x etiketleri */}
        {pts.map((p, i) => (
          <text key={i} x={x(i)} y={baseY + 16} textAnchor="middle" className={`pusula-traj-x ${p.forecast ? "fc" : ""} ${i === nowIdx ? "now" : ""}`}>{p.w}</text>
        ))}
      </svg>
      <div className="pusula-traj-pred">
        <Sparkles size={13} strokeWidth={1.8} /> {traj.prediction}
      </div>
    </div>
  );
}
