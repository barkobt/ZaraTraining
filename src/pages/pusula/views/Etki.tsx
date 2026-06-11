import { motion } from "framer-motion";
import { Headline } from "../../brain/primitives";
import { HIT_RATE, impactCurve, impactNote, impactStats } from "../data-impact";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * ETKİ — gelişim → performans (people hikâyesinin kalbi, slayt 7/9'un ekranı).
 * Seviye ekseninde bireysel conversion: GELİŞEN eğri yükselir; GELİŞMEDEN-KALAN
 * düz çizgide kalır — aradaki fark insan gelişiminden gelir. Sayılar TEMSİLÎ.
 */
export function Etki() {
  const t = useT();
  const stages = impactCurve();
  const stats = impactStats();

  // eğri geometrisi
  const W = 640;
  const H = 250;
  const padX = 46;
  const padTop = 26;
  const padBot = 44;
  const yMin = 12;
  const yMax = 28;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (stages.length - 1);
  const y = (v: number) => padTop + (1 - (v - yMin) / (yMax - yMin)) * (H - padTop - padBot);
  const grownPath = stages.map((s, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(s.grown)}`).join(" ");
  const areaPath = `${grownPath} L${x(stages.length - 1)},${y(stages[0].flat)} L${x(0)},${y(stages[0].flat)} Z`;
  const gain = stages[stages.length - 1].grown - stages[stages.length - 1].flat;

  return (
    <div className="petki">
      <div className="pusula-place-head">
        <div>
          <Headline
            ital={pick({ tr: "Gelişim", en: "Growth", es: "Desarrollo" })}
            roman={pick({ tr: "Etkisi", en: "Impact", es: "Impacto" })}
            size={32}
          />
          <div className="pusula-sub">
            {pick({
              tr: "İnsan ana sahnedir; performans onun sonucudur — kişi geliştikçe bireysel conversion gelir.",
              en: "People are the main stage; performance is the result — as a person grows, individual conversion follows.",
              es: "La persona es el escenario principal; el rendimiento es su resultado.",
            })}
          </div>
          <div className="pv4-how">{t("how.etki")}</div>
        </div>
      </div>

      <div className="petki-grid">
        {/* ana eğri */}
        <motion.section
          className="petki-chart"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="pv3-eb">
            {pick({ tr: "Bireysel conversion · seviye ekseni", en: "Individual conversion · by stage", es: "Conversión individual · por etapa" })}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="petki-svg" role="img"
            aria-label={pick({ tr: "Gelişen kişi ile gelişmeden kalan kıyası", en: "Grown vs not-grown comparison", es: "Comparación crecido vs sin crecer" })}>
            {/* y kılavuzları */}
            {[16, 20, 24, 28].map((v) => (
              <g key={v}>
                <line x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
                <text x={padX - 10} y={y(v) + 3} textAnchor="end" className="petki-ax">%{v}</text>
              </g>
            ))}
            {/* kazanç alanı */}
            <motion.path d={areaPath} fill="rgba(0,0,0,0.05)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
            {/* gelişmeden-kalan: düz, kesik */}
            <line x1={x(0)} x2={x(stages.length - 1)} y1={y(stages[0].flat)} y2={y(stages[0].flat)}
              stroke="rgba(0,0,0,0.35)" strokeWidth={1.4} strokeDasharray="5 5" />
            <text x={x(stages.length - 1) + 8} y={y(stages[0].flat) + 3} className="petki-lab dim">
              {pick({ tr: "gelişmeden kalsaydı", en: "if never grown", es: "sin crecer" })}
            </text>
            {/* gelişen eğri */}
            <motion.path d={grownPath} fill="none" stroke="#0a0a0a" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />
            {stages.map((s, i) => (
              <g key={s.key}>
                <circle cx={x(i)} cy={y(s.grown)} r={3.4} fill="#0a0a0a" />
                <text x={x(i)} y={y(s.grown) - 10} textAnchor="middle" className="petki-val">%{s.grown}</text>
                <text x={x(i)} y={H - 18} textAnchor="middle" className="petki-stage">{s.label}</text>
              </g>
            ))}
            {/* +9 rozeti */}
            <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0, ease: EASE }}>
              <rect x={x(stages.length - 1) - 34} y={(y(stages[stages.length - 1].grown) + y(stages[0].flat)) / 2 - 13}
                width={68} height={24} fill="#141414" rx={2} />
              <text x={x(stages.length - 1)} y={(y(stages[stages.length - 1].grown) + y(stages[0].flat)) / 2 + 3}
                textAnchor="middle" className="petki-badge">
                +{gain} {pick({ tr: "puan", en: "pts", es: "ptos" })}
              </text>
            </motion.g>
          </svg>
          <div className="petki-note">{impactNote()}</div>
        </motion.section>

        {/* yan panel: isabet + göstergeler */}
        <motion.aside
          className="petki-side"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        >
          <div className="pv3-eb">
            {pick({ tr: "Öneri isabeti · dönem dönem", en: "Suggestion accuracy · by period", es: "Acierto de sugerencias · por periodo" })}
          </div>
          <div className="petki-hit">
            {HIT_RATE.map((v, i) => (
              <div key={i} className="petki-hit-col">
                <motion.i
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / 100) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: EASE }}
                  style={{ opacity: 0.35 + i * 0.2 }}
                />
                <em>%{v}</em>
                <span>D{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="petki-hit-p">
            {pick({
              tr: "Her kapanan döngü modeli keskinleştirir: koç onayı + gerçekleşen sonuç geri yazılır, isabet yükselir.",
              en: "Every closed loop sharpens the model: coach approvals + realized outcomes are written back, accuracy rises.",
              es: "Cada ciclo cerrado afina el modelo: aprobaciones y resultados reales se reescriben, el acierto sube.",
            })}
          </p>

          <div className="pusula-pulse petki-pulse">
            {stats.map((s) => (
              <div key={s.k} className="pusula-pulse-cell">
                <em>{s.v}</em>
                <span>{s.k}</span>
                <small>{s.s}</small>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>{pick({ tr: "Sonuç modele geri yazılır — döngü keskinleşir", en: "Outcomes are written back — the loop sharpens", es: "Los resultados se reescriben — el ciclo se afina" })}</span>
        <span>{pick({ tr: "Skor kişide değil, kanıt öneridedir", en: "No score on the person; evidence lives on the suggestion", es: "Sin puntaje en la persona; la evidencia vive en la sugerencia" })}</span>
      </div>
    </div>
  );
}
