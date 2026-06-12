import { motion } from "framer-motion";
import { Headline } from "../primitives";
import { HIT_RATE, impactCurve, impactNote, impactStats, maturityStages } from "../data-impact";
import { peekSession } from "../session-store";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Bu OTURUMDA kapanan döngüler — gerçek tıklamalardan canlı sayılır
 *  (onaylanan aptitude + planlanan keşif + onaylanan eşleşme + işlenen örüntü +
 *  uygulanan öncelik + tamamlanan koçluk aksiyonu). */
function sessionClosedLoops(): number {
  const c = (o: Record<string, unknown>) => Object.values(o).filter(Boolean).length;
  return (
    c(peekSession("apt.approved", {})) +
    c(peekSession("disc.planned", {})) +
    c(peekSession("usta.confirmed", {})) +
    c(peekSession("hafiza.patterns", {})) +
    c(peekSession("defter.doneItems", {})) +
    c(peekSession("hafiza.dayq", {}))
  );
}

/**
 * ETKİ — geri-besleme döngüsünün yüzü. Sıralama fizibiliteye göre savunulabilirlik
 * sırasıdır: ① öneri isabeti (sistemin İÇ tutarlılığı — en sağlam iddia),
 * ② kapanan döngüler (süreç metriği; bu oturumdan CANLI), ③ gelişim→conversion
 * eğrisi (güven bandı + "modelin tahmini" etiketiyle — mutlak iddia ARKA planda),
 * ④ olgunlaşma şeridi (soğuk başlangıç dürüstlüğü). Sayılar TEMSİLÎ.
 */
export function Etki() {
  const t = useT();
  const stages = impactCurve();
  const stats = impactStats();
  const closed = sessionClosedLoops();

  // isabet çizgisi geometrisi
  const HW = 300;
  const HH = 150;
  const hx = (i: number) => 34 + (i * (HW - 60)) / (HIT_RATE.length - 1);
  const hy = (v: number) => 18 + (1 - (v - 50) / 45) * (HH - 52);
  const hitPath = HIT_RATE.map((v, i) => `${i === 0 ? "M" : "L"}${hx(i)},${hy(v)}`).join(" ");

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
  // güven bandı: kanıt biriktikçe daralır (başta ±2.2, sonda ±0.8)
  const bw = (i: number) => 2.2 - (i * 1.4) / (stages.length - 1);
  const bandTop = stages.map((s, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(s.grown + bw(i))}`).join(" ");
  const bandBot = [...stages].reverse().map((s, ri) => {
    const i = stages.length - 1 - ri;
    return `L${x(i)},${y(s.grown - bw(i))}`;
  }).join(" ");
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
              tr: "Sistemin BU mağazaya kattıkları — öneri → koç kararı → gerçekleşen sonuç geri yazılır.",
              en: "What the system adds to THIS store — suggestion → coach decision → outcome written back.",
              es: "Lo que el sistema aporta a ESTA tienda — sugerencia → decisión → resultado reescrito.",
            })}
          </div>
          <div className="pv4-how">{t("how.etki")}</div>
          <span className="petki-store">ZARA · BORNOVA 3643 · {pick({ tr: "PİLOT MAĞAZA", en: "PILOT STORE", es: "TIENDA PILOTO" })}</span>
        </div>
        {/* canlı: bu oturumda kapanan döngüler */}
        <div className="petki-live">
          <em>{closed}</em>
          <span>{pick({ tr: "kapanan döngü · bu oturum", en: "closed loops · this session", es: "ciclos cerrados · esta sesión" })}</span>
          <small>{pick({ tr: "onay + plan + işlenen örüntü — gerçek tıklamalardan", en: "approvals + plans + patterns — from real clicks", es: "vistos + planes + patrones — de clics reales" })}</small>
        </div>
      </div>

      <div className="petki-grid">
        {/* ① ÖNERİ İSABETİ — başköşe (savunulabilirliğin tepesi) */}
        <motion.section
          className="petki-hitcard"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="pv3-eb">
            {pick({ tr: "Öneri isabeti · dönem dönem (geriye dönük test)", en: "Suggestion accuracy · by period (backtest)", es: "Acierto de sugerencias · por periodo (backtest)" })}
          </div>
          <svg viewBox={`0 0 ${HW} ${HH}`} width="100%" className="petki-hitsvg" role="img"
            aria-label={pick({ tr: "İsabet eğrisi", en: "Accuracy curve", es: "Curva de acierto" })}>
            {[60, 70, 80, 90].map((v) => (
              <line key={v} x1={34} x2={HW - 26} y1={hy(v)} y2={hy(v)} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
            ))}
            <motion.path d={hitPath} fill="none" stroke="#0a0a0a" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }} />
            {HIT_RATE.map((v, i) => (
              <g key={i}>
                <circle cx={hx(i)} cy={hy(v)} r={i === HIT_RATE.length - 1 ? 3.6 : 2.6} fill="#0a0a0a" />
                <text x={hx(i)} y={hy(v) - 9} textAnchor="middle" className="petki-val">%{v}</text>
                <text x={hx(i)} y={HH - 10} textAnchor="middle" className="petki-stage">D{i + 1}</text>
              </g>
            ))}
          </svg>
          <p className="petki-hit-p">
            {pick({
              tr: "Her kapanan döngü modeli keskinleştirir — bu mağazanın isabeti dört dönemde 62'den 86'ya.",
              en: "Every closed loop sharpens the model — this store's accuracy rose from 62 to 86 in four periods.",
              es: "Cada ciclo cerrado afina el modelo — el acierto de esta tienda subió de 62 a 86 en cuatro periodos.",
            })}
          </p>
        </motion.section>

        {/* ④ OLGUNLAŞMA — dürüstlük özelliktir */}
        <motion.section
          className="petki-mat"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <div className="pv3-eb">
            {pick({ tr: "Olgunlaşma · sistem ilk hafta emin değildir", en: "Maturing · the system isn't sure in week one", es: "Maduración · el sistema no está seguro la primera semana" })}
          </div>
          <div className="petki-mat-track">
            {maturityStages().map((m, i) => (
              <div key={m.span} className="petki-mat-step" style={{ opacity: 0.55 + i * 0.15 }}>
                <span className="s">{m.span}</span>
                <em>{m.word}</em>
                <small>{m.detail}</small>
              </div>
            ))}
          </div>
          <p className="petki-hit-p">
            {pick({
              tr: "Kanıt biriktikçe öneriler kişiselleşir — sınır saklanmaz, özelliktir.",
              en: "As evidence accrues, suggestions personalize — the limit isn't hidden; it's a feature.",
              es: "Al acumular evidencia, las sugerencias se personalizan — el límite no se oculta.",
            })}
          </p>
        </motion.section>

        {/* ③ GELİŞİM→CONVERSION — güven bandı + dürüstlük etiketiyle, arka planda */}
        <motion.section
          className="petki-chart"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
        >
          <div className="pv3-eb petki-eb-row">
            <span>{pick({ tr: "Bireysel conversion · seviye ekseni", en: "Individual conversion · by stage", es: "Conversión individual · por etapa" })}</span>
            <span className="petki-rep">{pick({ tr: "temsilî pilot hedefi", en: "representative pilot target", es: "objetivo piloto representativo" })}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="petki-svg" role="img"
            aria-label={pick({ tr: "Gelişen kişi ile gelişmeden kalan kıyası", en: "Grown vs not-grown comparison", es: "Comparación crecido vs sin crecer" })}>
            {[16, 20, 24, 28].map((v) => (
              <g key={v}>
                <line x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
                <text x={padX - 10} y={y(v) + 3} textAnchor="end" className="petki-ax">%{v}</text>
              </g>
            ))}
            {/* güven bandı — kanıt biriktikçe daralır */}
            <motion.path d={`${bandTop} ${bandBot} Z`} fill="rgba(0,0,0,0.07)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
            {/* gelişmeden-kalan: modelin tahmini, gerçek değil */}
            <line x1={x(0)} x2={x(stages.length - 1)} y1={y(stages[0].flat)} y2={y(stages[0].flat)}
              stroke="rgba(0,0,0,0.35)" strokeWidth={1.4} strokeDasharray="5 5" />
            <text x={x(0)} y={y(stages[0].flat) + 14} className="petki-lab dim">
              {pick({ tr: "gelişmeden kalsaydı — modelin tahmini, gerçek değil", en: "if never grown — the model's estimate, not reality", es: "sin crecer — estimación del modelo, no realidad" })}
            </text>
            <motion.path d={grownPath} fill="none" stroke="#0a0a0a" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: EASE }} />
            {stages.map((s, i) => (
              <g key={s.key}>
                <circle cx={x(i)} cy={y(s.grown)} r={3.4} fill="#0a0a0a" />
                <text x={x(i)} y={y(s.grown) - 10 - bw(i) * 4} textAnchor="middle" className="petki-val">%{s.grown}</text>
                <text x={x(i)} y={H - 18} textAnchor="middle" className="petki-stage">{s.label}</text>
              </g>
            ))}
            {/* +9 rozeti — outline (dolu siyah veri bloğu değil) */}
            <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0, ease: EASE }}>
              <rect x={x(stages.length - 1) - 36} y={(y(stages[stages.length - 1].grown) + y(stages[0].flat)) / 2 - 13}
                width={72} height={24} fill="#fff" stroke="#0a0a0a" strokeWidth={1.2} rx={2} />
              <text x={x(stages.length - 1)} y={(y(stages[stages.length - 1].grown) + y(stages[0].flat)) / 2 + 3}
                textAnchor="middle" className="petki-badge ink">
                +{gain} {pick({ tr: "puan", en: "pts", es: "ptos" })}
              </text>
            </motion.g>
          </svg>
          <div className="petki-note">{impactNote()}</div>
        </motion.section>

        {/* ② PİLOT HEDEFLERİ — önce/sonra çubuklarıyla GRAFİK figürler */}
        <motion.aside
          className="petki-side"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
        >
          <div className="pv3-eb petki-eb-row">
            <span>{pick({ tr: "Pilot hedefleri · önce → sonra", en: "Pilot targets · before → after", es: "Objetivos piloto · antes → después" })}</span>
            <span className="petki-rep">{pick({ tr: "temsilî", en: "representative", es: "representativo" })}</span>
          </div>
          <div className="petki-figs">
            {([
              {
                v: stats[0].v, k: stats[0].k,
                a: { w: 64, l: pick({ tr: "yeni · %16", en: "new · 16%", es: "nuevo · 16%" }) },
                b: { w: 100, l: pick({ tr: "öğretebilir · %25", en: "can teach · 25%", es: "enseña · 25%" }) },
              },
              {
                v: stats[1].v, k: stats[1].k,
                a: { w: 100, l: pick({ tr: "önce · 8 hafta", en: "before · 8 weeks", es: "antes · 8 sem." }) },
                b: { w: 75, l: pick({ tr: "pilot · 6 hafta", en: "pilot · 6 weeks", es: "piloto · 6 sem." }) },
              },
              {
                v: stats[2].v, k: stats[2].k,
                a: { w: 100, l: pick({ tr: "önce · elle hazırlık", en: "before · manual prep", es: "antes · manual" }) },
                b: { w: 60, l: pick({ tr: "pilot · taslak hazır", en: "pilot · drafts ready", es: "piloto · borradores" }) },
              },
              {
                v: stats[3].v, k: stats[3].k,
                a: { w: 28, l: pick({ tr: "usta ayrılınca · kayıp", en: "master leaves · lost", es: "se va · perdido" }) },
                b: { w: 100, l: pick({ tr: "Pusula ile · kurumda kalır", en: "with Pusula · retained", es: "con Pusula · queda" }) },
              },
            ] as const).map((f) => (
              <div key={f.k} className="petki-fig">
                <div className="petki-fig-head">
                  <em>{f.v}</em>
                  <span>{f.k}</span>
                </div>
                <div className="petki-fig-bars">
                  <div className="r">
                    <i className="a" style={{ width: `${f.a.w}%` }} />
                    <label>{f.a.l}</label>
                  </div>
                  <div className="r">
                    <motion.i
                      className="b"
                      initial={{ width: 0 }}
                      animate={{ width: `${f.b.w}%` }}
                      transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
                    />
                    <label>{f.b.l}</label>
                  </div>
                </div>
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
