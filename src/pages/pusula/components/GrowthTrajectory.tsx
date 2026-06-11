import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Trajectory } from "../data-profile";

/**
 * Gelişim yörüngesi — geçmiş 4 hafta (dolu çizgi) + "şimdi" + 2 hafta TAHMİN
 * (kesik çizgi, soluk alan). Eksen bağlamı (0–100 gelişim endeksi), tahmin başlığı
 * ve eşik ETA'sı ile anlamlı. Sayı bireyin yörüngesi içindir — sıralama değil.
 */
export function GrowthTrajectory({ traj }: { traj: Trajectory }) {
  const W = 260, H = 96, padX = 10, padTop = 12, padBot = 22;
  const pts = traj.points;
  const n = pts.length;
  const nowIdx = pts.findIndex((p) => p.forecast) - 1; // son geçmiş nokta = "şimdi"
  const x = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  const y = (v: number) => padTop + (1 - v / 100) * (H - padTop - padBot);

  const solid = pts.filter((p) => !p.forecast);
  const dashStart = Math.max(0, nowIdx);
  const dashed = pts.slice(dashStart);

  const path = (arr: { v: number }[], offset: number) =>
    arr.map((p, i) => `${i === 0 ? "M" : "L"}${x(offset + i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");

  // forecast alanı (soluk dolgu)
  const areaPath =
    `M${x(dashStart)},${y(dashed[0].v)} ` +
    dashed.map((p, i) => `L${x(dashStart + i)},${y(p.v)}`).join(" ") +
    ` L${x(n - 1)},${H - padBot} L${x(dashStart)},${H - padBot} Z`;

  return (
    <div className="pusula-traj">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="pusula-traj-svg">
        {/* yatay eşik çizgisi (Usta eşiği ~85) */}
        <line x1={padX} y1={y(85)} x2={W - padX} y2={y(85)} stroke="var(--zara-gold-soft)" strokeWidth={0.8} strokeDasharray="2 3" opacity={0.7} />
        <text x={W - padX} y={y(85) - 3} textAnchor="end" className="pusula-traj-thr">{traj.etaWeeks > 0 ? `~${traj.etaWeeks}h` : "✓"}</text>

        {/* tahmin alanı */}
        <path d={areaPath} fill="var(--zara-gold-tint)" opacity={0.6} />

        {/* geçmiş (dolu) */}
        <motion.path
          d={path(solid, 0)} fill="none" stroke="var(--zara-gold)" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
        />
        {/* tahmin (kesik) */}
        <path d={path(dashed, dashStart)} fill="none" stroke="var(--zara-gold-deep)" strokeWidth={1.4} strokeDasharray="3 3" strokeLinecap="round" opacity={0.85} />

        {/* noktalar */}
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.v)} r={i === nowIdx ? 3.2 : 2} fill={p.forecast ? "var(--zara-bg)" : "var(--zara-gold-deep)"} stroke={p.forecast ? "var(--zara-gold-deep)" : "none"} strokeWidth={1.2} />
        ))}
        {/* etiketler */}
        {pts.map((p, i) => (
          <text key={i} x={x(i)} y={H - 7} textAnchor="middle" className={`pusula-traj-x ${p.forecast ? "fc" : ""} ${i === nowIdx ? "now" : ""}`}>{p.w}</text>
        ))}
      </svg>
      <div className="pusula-traj-pred">
        <Sparkles size={12} strokeWidth={1.8} /> {traj.prediction}
      </div>
    </div>
  );
}
