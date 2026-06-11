// src/pages/pusula/data-profile.ts
// İnsan profili — kişiye ÖZEL tahmin/metrik katmanı. Her şey kişinin 6'lı KANIT
// vektöründen (data-competency, kanal: sayaç/kesişim/kitapçık/EAS/koç) + yaşam
// evresinden türetilir; iki kişi asla aynı görünmez. Skor BİREYİN gelişimi içindir —
// kişiler arası sıralama DEĞİL.
//   · asaScores        → 4 ASA'nın güç barı + trend + bu dönem artış (yörünge girdisi)
//   · growthTrajectory → geçmiş 4 hafta + 2 hafta TAHMİN (forecast) + eşik ETA'sı
//   · upcomingTrainings→ yaklaşan eğitimler (odak · ne zaman · kiminle) + KEŞİF

import { compLabel, compRaw, discoveryFor, personCompetencies, growthEdgeOf } from "./data-competency";
import { MasteryLevel, type Employee } from "./types";
import { pick } from "./i18n";

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const firstName = (emp: Employee) => emp.name.split(" ")[0];

// ── ASA güç dağılımı (yörünge girdisi; kişiye özel) ─────────
export interface AsaScore {
  key: string;
  label: string;
  score: number; // 0–100 iç değer (bireysel gelişim görseli)
  trend: "up" | "flat";
  delta: number; // bu dönem +puan
  metric: string; // kanıt KPI (kısa)
}

export function asaScores(emp: Employee): AsaScore[] {
  const g = hash(emp.id);
  const servis = compRaw(emp.id, "karsilama");
  const satis = Math.max(compRaw(emp.id, "kabin"), compRaw(emp.id, "urun"));
  const ops = (compRaw(emp.id, "dolum") + compRaw(emp.id, "sellthrough")) / 2;
  const selfBase =
    emp.level === MasteryLevel.Coach ? 3.7 : emp.level === MasteryLevel.Master ? 3.3 : emp.level === MasteryLevel.Competent ? 2.7 : 2.0;

  const toScore = (v: number, salt: number) => clamp100((v / 4) * 100 + (((g + salt) % 7) - 3)); // doğal küçük varyans
  const mk = (key: string, label: string, v: number, salt: number, metric: string): AsaScore => {
    const score = toScore(v, salt);
    // gelişmekte olan alan daha hızlı artar; oturmuş alan az/sabit
    const delta = v >= 3.2 ? ((g + salt) % 2) : v >= 2 ? 3 + ((g + salt) % 4) : 1 + ((g + salt) % 3);
    return { key, label, score, trend: delta > 0 ? "up" : "flat", delta, metric };
  };

  return [
    mk("servis", pick({ tr: "Müşteri Servisi", en: "Customer Service", es: "Servicio al Cliente" }), servis, 1,
      pick({ tr: "Welcome saatleri conversion'ı · vardiya-kesişim", en: "Welcome-hours conversion · shift-overlap", es: "conversión en horas de Welcome · cruce de turnos" })),
    mk("satis", pick({ tr: "Satış", en: "Sales", es: "Ventas" }), satis, 3,
      pick({ tr: "FR→satış (kabin sayacı) · UPT", en: "FR→sale (fitting counter) · UPT", es: "FR→venta (contador) · UPT" })),
    mk("ops", pick({ tr: "Mağaza İçi Operasyonu", en: "In-store Operations", es: "Operaciones en Tienda" }), ops, 5,
      pick({ tr: "iade→raf devri · sell-through", en: "returns→shelf turnover · sell-through", es: "rotación devolución→estante · sell-through" })),
    mk("gelisim", pick({ tr: "Kendini Geliştirme", en: "Self-development", es: "Autodesarrollo" }), selfBase, 7,
      pick({ tr: "eğitim tamamlama · öğrenme çevikliği", en: "training completion · learning agility", es: "compleción de formación · agilidad de aprendizaje" })),
  ];
}

// ── Gelişim yörüngesi (geçmiş + tahmin) ─────────────────────
export interface TrajPoint { w: string; v: number; forecast: boolean; }
export interface Trajectory { points: TrajPoint[]; prediction: string; etaWeeks: number; nowIndex: number; }

export function growthTrajectory(emp: Employee): Trajectory {
  const scores = asaScores(emp);
  const current = clamp100(scores.reduce((a, s) => a + s.score, 0) / scores.length);
  const g = hash(emp.id);
  const slope =
    (emp.level === MasteryLevel.New ? 7 : emp.level === MasteryLevel.Competent ? 6 : emp.level === MasteryLevel.Master ? 4 : 3) + (g % 3);

  const past = [current - 3 * slope, current - 2 * slope, current - Math.round(1.5 * slope), current - slope, current].map(clamp100);
  const fc = [clamp100(current + slope), clamp100(current + Math.round(1.8 * slope))];

  const wAgo = (n: number) => pick({ tr: `−${n}h`, en: `−${n}w`, es: `−${n}s` });
  const wFwd = (n: number) => pick({ tr: `+${n}h`, en: `+${n}w`, es: `+${n}s` });
  const now = pick({ tr: "şimdi", en: "now", es: "ahora" });
  const points: TrajPoint[] = [
    { w: wAgo(4), v: past[0], forecast: false },
    { w: wAgo(3), v: past[1], forecast: false },
    { w: wAgo(2), v: past[2], forecast: false },
    { w: wAgo(1), v: past[3], forecast: false },
    { w: now, v: past[4], forecast: false },
    { w: wFwd(1), v: fc[0], forecast: true },
    { w: wFwd(2), v: fc[1], forecast: true },
  ];

  const target = 85;
  const etaWeeks = current >= target ? 0 : Math.max(1, Math.ceil((target - current) / Math.max(1, slope)));
  const prediction =
    emp.level === MasteryLevel.New
      ? pick({ tr: `Tahmin: bağımsız ön cepheye ~${etaWeeks} hafta`, en: `Forecast: ~${etaWeeks} weeks to independent front of house`, es: `Pronóstico: ~${etaWeeks} semanas para frente autónomo` })
      : emp.level === MasteryLevel.Competent
        ? pick({ tr: `Tahmin: Usta eşiğine ~${etaWeeks} hafta`, en: `Forecast: ~${etaWeeks} weeks to Master threshold`, es: `Pronóstico: ~${etaWeeks} semanas al umbral Maestro` })
        : emp.level === MasteryLevel.Master
          ? pick({ tr: "Tahmin: Usta Aktarımına hazır — koçluğa geçiş", en: "Forecast: ready for Mastery Transfer — moving to coaching", es: "Pronóstico: listo para Transferencia de Maestría — pasando a coaching" })
          : pick({ tr: "Tahmin: eğitimcinin eğitimi — mentee lifti izleniyor", en: "Forecast: training the trainer — mentee lift tracked", es: "Pronóstico: formar al formador — lift del mentee en seguimiento" });

  return { points, prediction, etaWeeks, nowIndex: current };
}

// ── Yaklaşan eğitimler (keşif-farkındalıklı) ────────────────
export interface Training { focus: string; when: string; withWhom?: string; kind: "shadow" | "micro" | "transfer"; }
export function upcomingTrainings(emp: Employee): Training[] {
  const out: Training[] = [];
  const fn = firstName(emp);
  const pcs = personCompetencies(emp.id);

  // 1) Keşfedilmemiş alan varsa İLK sıraya keşif vardiyası (boş bar değil, aksiyon)
  const disc = discoveryFor(emp.id);
  if (disc) {
    out.push({
      focus: pick({
        tr: `Keşif · ${compLabel(disc.comp)}`,
        en: `Discovery · ${compLabel(disc.comp)}`,
        es: `Descubrimiento · ${compLabel(disc.comp)}`,
      }),
      when: pick({ tr: "Yarın · 15–16 (sakin saat)", en: "Tomorrow · 15–16 (calm hour)", es: "Mañana · 15–16 (hora tranquila)" }),
      withWhom: disc.buddyName,
      kind: "shadow",
    });
  } else {
    // 2) Keşif yoksa: sinyali az (emerging) ilk alan için gölge seansı
    const emerging = pcs.find((p) => p.state.kind === "emerging");
    if (emerging) {
      out.push({
        focus: pick({
          tr: `${compLabel(emerging.comp)} · temel akış`,
          en: `${compLabel(emerging.comp)} · core flow`,
          es: `${compLabel(emerging.comp)} · flujo básico`,
        }),
        when: pick({ tr: "Yarın 15:30", en: "Tomorrow 15:30", es: "Mañana 15:30" }),
        withWhom: "Fatma",
        kind: "shadow",
      });
    }
  }

  out.push({
    focus: growthEdgeOf(emp),
    when: pick({ tr: "Çarşamba · sakin slot", en: "Wednesday · calm slot", es: "Miércoles · franja tranquila" }),
    kind: "micro",
  });

  const teach = pcs.find((p) => p.state.kind === "proven" && p.state.teachable);
  if (teach) {
    out.push({
      focus: pick({
        tr: `Usta Aktarımı · ${compLabel(teach.comp)}`,
        en: `Mastery Transfer · ${compLabel(teach.comp)}`,
        es: `Transferencia de Maestría · ${compLabel(teach.comp)}`,
      }),
      when: pick({ tr: "Cuma · 12:30", en: "Friday · 12:30", es: "Viernes · 12:30" }),
      withWhom: "Sevim",
      kind: "transfer",
    });
  } else if (emp.level === MasteryLevel.New) {
    out.push({
      focus: pick({ tr: `Oryantasyon pekiştirme`, en: `Orientation reinforcement`, es: `Refuerzo de orientación` }),
      when: pick({ tr: "Perşembe", en: "Thursday", es: "Jueves" }),
      withWhom: "Şeyma",
      kind: "shadow",
    });
  }

  // fn kullanımı (lint) — hiç eğitim çıkmazsa kişiselleştirilmiş keşif
  if (!out.length) out.push({ focus: pick({ tr: `${fn} için keşif vardiyası`, en: `Discovery shift for ${fn}`, es: `Turno de descubrimiento para ${fn}` }), when: pick({ tr: "Bu hafta", en: "This week", es: "Esta semana" }), kind: "micro" });

  return out.slice(0, 3);
}

/** Eğitim türü etiketi — aktif dilde. */
export const trainingKindLabel = (k: Training["kind"]): string =>
  k === "shadow"
    ? pick({ tr: "Gölge seansı", en: "Shadow session", es: "Sesión de acompañamiento" })
    : k === "micro"
      ? pick({ tr: "Mikro-eğitim", en: "Micro-training", es: "Micro-formación" })
      : pick({ tr: "Usta Aktarımı", en: "Mastery Transfer", es: "Transferencia de Maestría" });
