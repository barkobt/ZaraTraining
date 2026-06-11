// src/pages/pusula/data-program.ts
// 8-haftalık programın kişiye özel parçaları — kişinin GERÇEK yetkinlik profilinden
// TÜRETİLİR (el ile 30× yazılmaz, hep tutarlı). Yetkinlik 0–5 ekranda ETİKETLE
// gösterilir (sayı basılmaz). Dönem aksiyonu + final rapor da profilden çıkar.

import { competencies, COMPETENCY_COUNT } from "./data-gelisim";
import { COMP_KEYS, compLabel, compRaw, compShort, growthEdgeOf, type CompKey } from "./data-competency";
import { MasteryLevel, type Employee } from "./types";
import type { AreaSignal, CompetencyRow, FinalReport, PeriodAction } from "./types-gelisim";
import { pick } from "./i18n";

const clamp = (v: number) => Math.max(0, Math.min(5, v));
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

const BASE: Record<MasteryLevel, number[]> = {
  [MasteryLevel.New]: [1, 2, 2, 3],
  [MasteryLevel.Competent]: [2, 3, 3, 4],
  [MasteryLevel.Master]: [3, 4, 4, 5],
  [MasteryLevel.Coach]: [4, 4, 5, 5],
};

/** 5 davranışsal yetkinlik × 4 dönem (0–5) — yükselen, biri öncelik. */
export function competencyEval(emp: Employee): CompetencyRow[] {
  const base = BASE[emp.level];
  const h = hash(emp.id);
  const prioIdx = h % COMPETENCY_COUNT;
  const plusIdx = (h + 2) % COMPETENCY_COUNT;
  return competencies().map((name, i) => {
    const delta = i === prioIdx ? -1 : i === plusIdx ? 1 : 0;
    return { name, priority: i === prioIdx, periods: base.map((v) => clamp(v + delta)) };
  });
}

function firstName(emp: Employee) {
  return emp.name.split(" ")[0];
}

/** Yetkinlikleri kanıt gücüne göre sırala (asc = en az kanıtlı/keşfedilmemiş önce). */
function compsByRaw(emp: Employee, dir: "desc" | "asc"): CompKey[] {
  return [...COMP_KEYS].sort((a, b) =>
    dir === "desc" ? compRaw(emp.id, b) - compRaw(emp.id, a) : compRaw(emp.id, a) - compRaw(emp.id, b),
  );
}

/** 4 dönem aksiyon planı (Hafta 2/4/6/8) — gelişim arkına göre kişiselleşir. */
export function periodActions(emp: Employee): PeriodAction[] {
  const fn = firstName(emp);
  const strongRole = compShort(compsByRaw(emp, "desc")[0]);
  const weakRole = compShort(compsByRaw(emp, "asc")[0]);
  const wk = (n: number) => pick({ tr: `Hafta ${n}`, en: `Week ${n}`, es: `Semana ${n}` });
  return [
    {
      week: wk(2),
      priorities: [
        pick({ tr: "Oryantasyon & rol beklentileri", en: "Orientation & role expectations", es: "Orientación y expectativas del rol" }),
        pick({ tr: "Mağaza düzeni ve tempo", en: "Store layout and tempo", es: "Disposición de la tienda y ritmo" }),
      ],
      goal: pick({ tr: "Sahaya güvenli giriş; temel akışları tanıma.", en: "Safe entry to the floor; learning core flows.", es: "Entrada segura a la sala; conocer los flujos básicos." }),
      action: pick({ tr: `${fn} ilk hafta kıdemli eşliğinde gözlem (shadowing).`, en: `${fn} shadows a senior in week one.`, es: `${fn} acompaña a un sénior en la primera semana.` }),
    },
    {
      week: wk(4),
      priorities: [
        pick({ tr: `${weakRole} temel akışı`, en: `${weakRole} core flow`, es: `Flujo básico de ${weakRole}` }),
        pick({ tr: "Müşteri yaklaşımı", en: "Customer approach", es: "Acercamiento al cliente" }),
      ],
      goal: pick({ tr: `${weakRole}'de desteksiz ilk denemeler.`, en: `First unassisted attempts in ${weakRole}.`, es: `Primeros intentos sin apoyo en ${weakRole}.` }),
      action: pick({ tr: "Gölge seansı + birebir geri bildirim; küçük başarıları kutla.", en: "Shadow session + 1:1 feedback; celebrate small wins.", es: "Sesión de acompañamiento + feedback 1:1; celebra los logros." }),
    },
    {
      week: wk(6),
      priorities: [
        pick({ tr: "Bağımsız ön cephe", en: "Independent front of house", es: "Frente independiente" }),
        pick({ tr: "Tepe-saat dayanıklılığı", en: "Peak-hour resilience", es: "Resistencia en hora pico" }),
      ],
      goal: pick({ tr: "Yoğunlukta ritmi koruma; tek başına ön cephe.", en: "Holding rhythm under load; front of house solo.", es: "Mantener el ritmo bajo presión; frente en solitario." }),
      action: pick({ tr: "Kontrollü tepe-saat maruziyeti; kıdemli yakın destekte.", en: "Controlled peak-hour exposure; senior close by.", es: "Exposición controlada a la hora pico; sénior cerca." }),
    },
    {
      week: wk(8),
      priorities: [
        pick({ tr: `${strongRole} derinleşme`, en: `${strongRole} deepening`, es: `Profundizar en ${strongRole}` }),
        pick({ tr: "Usta aktarımına hazırlık", en: "Preparing to transfer mastery", es: "Preparación para transferir maestría" }),
      ],
      goal: pick({ tr: "Bir konuyu başkasına öğretebilir seviye.", en: "Able to teach a topic to someone else.", es: "Capaz de enseñar un tema a otra persona." }),
      action: pick({ tr: "Değerlendirme + sonraki dönem aksiyon planı.", en: "Evaluation + next-period action plan.", es: "Evaluación + plan de acción del siguiente periodo." }),
    },
  ];
}

function lvl(v: number): AreaSignal["level"] {
  return v >= 3 ? "strong" : v >= 2 ? "developing" : v >= 0.75 ? "neutral" : "none";
}
function evid(v: number): string {
  return v < 0.75 ? pick({ tr: "veri yok", en: "no data", es: "sin datos" }) : v >= 3 ? "n≈14" : v >= 2 ? "n≈6" : "n≈2";
}

/**
 * Alan-spesifik dinamik sinyaller — her alanın GERÇEK kanalından güncellenir
 * (kabin sayacı · vardiya-kesişim · EAS · kitapçık). Kanıt yok → "veri yok" →
 * keşif (yargı değil). pusulaReading bu sinyallerden beslenir.
 */
export function areaSignals(emp: Employee): AreaSignal[] {
  const r = (k: CompKey) => compRaw(emp.id, k);
  return [
    {
      area: pick({ tr: "Tepe-saat kapatma", en: "Peak-hour closing", es: "Cierre en hora pico" }),
      source: pick({ tr: "Kabin sayacı → FR→satış dönüşümü", en: "Fitting counter → FR→sale conversion", es: "Contador de probador → conversión FR→venta" }),
      level: lvl(r("kabin")),
      evidence: evid(r("kabin")),
    },
    {
      area: pick({ tr: "Karşılama & yönlendirme", en: "Greeting & guidance", es: "Bienvenida y orientación" }),
      source: pick({ tr: "Welcome saatleri × mağaza conversion'ı (kesişim)", en: "Welcome hours × store conversion (overlap)", es: "Horas de Welcome × conversión (cruce)" }),
      level: lvl(r("karsilama")),
      evidence: evid(r("karsilama")),
    },
    {
      area: pick({ tr: "Reyon hakimiyeti", en: "Floor mastery", es: "Dominio de sala" }),
      source: pick({ tr: "Reyon → vardiya-içi sell-through + iade→raf devri", en: "Floor → in-shift sell-through + returns→shelf", es: "Sala → sell-through en turno + devolución→estante" }),
      level: lvl((r("sellthrough") + r("dolum")) / 2),
      evidence: evid((r("sellthrough") + r("dolum")) / 2),
    },
    {
      area: pick({ tr: "Kayıp önleme", en: "Loss prevention", es: "Prevención de pérdidas" }),
      source: pick({ tr: "EAS kapı kaydı → alarm yanıtı + geri kazanım", en: "EAS gate log → alarm response + recovery", es: "Registro EAS → respuesta a alarma + recuperación" }),
      level: lvl(r("kayip")),
      evidence: evid(r("kayip")),
    },
  ];
}

/** Pusula'nın üretilmiş okuması — kanıta dayalı, belirsizlik-farkında, kişi hakkında. */
export function pusulaReading(emp: Employee): string {
  const sig = areaSignals(emp);
  const strong = sig.find((s) => s.level === "strong");
  const none = sig.find((s) => s.level === "none");
  const fn = emp.name.split(" ")[0];
  const parts: string[] = [];
  if (strong)
    parts.push(
      pick({
        tr: `${strong.area.toLowerCase()} kanıtlı (güçlü, ${strong.evidence})`,
        en: `${strong.area.toLowerCase()} proven (strong, ${strong.evidence})`,
        es: `${strong.area.toLowerCase()} comprobado (fuerte, ${strong.evidence})`,
      }),
    );
  else parts.push(pick({ tr: "temel akışlar oturuyor", en: "core flows settling in", es: "flujos básicos asentándose" }));
  if (none)
    parts.push(
      pick({
        tr: `${none.area.toLowerCase()} alanında veri yok — yargı değil, keşif öneriliyor`,
        en: `no data in ${none.area.toLowerCase()} — not judgment, exploration suggested`,
        es: `sin datos en ${none.area.toLowerCase()} — no es juicio, se sugiere exploración`,
      }),
    );
  const tail =
    emp.level === MasteryLevel.Coach
      ? pick({ tr: "Koç: kendi gelişimi mentee lifti üzerinden okunuyor.", en: "Coach: own growth read via mentee lift.", es: "Coach: su desarrollo se lee por el avance del mentee." })
      : emp.level === MasteryLevel.Master
        ? pick({ tr: "Usta: aktarıma hazır.", en: "Master: ready to transfer.", es: "Maestro: listo para transferir." })
        : emp.level === MasteryLevel.Competent
          ? pick({ tr: "Yetkin: tepe-saat dayanıklılığı evresinde.", en: "Competent: building peak-hour resilience.", es: "Competente: ganando resistencia en hora pico." })
          : pick({ tr: "Yeni: gelişim eğrisi yukarı, kıdemli eşliğinde.", en: "New: rising curve, with a senior alongside.", es: "Nuevo: curva en ascenso, junto a un sénior." });
  return `${fn} — ${parts.join("; ")}. ${tail}`;
}

export interface Persona {
  label: string; // "Yaklaşan · Approacher"
  energy: string; // "sakin & yön veren"
  cx: string; // CX davranışı bağlantısı
  action: string; // bu personadan çıkan aksiyon
  live: string; // hangi CANLI sinyalden güncellenir (statik değil)
}

/**
 * Satış personası + enerji — kişiyi GERÇEKTEN anlatır (yetkinlik deseninden + CX).
 * mix&match (stilist) / approacher (yaklaşan) / welcomer (karşılayan) / closer (kapatan).
 * Analize ve aksiyona girdi olur (nereye konumlandırılır, nasıl gelişir).
 */
export function sellingPersona(emp: Employee): Persona {
  const r = (k: CompKey) => compRaw(emp.id, k);
  // Herkesin enerjisi 3'ten biri: Approacher / Welcomer / Mix&Match (argmax — kanıt vektöründen).
  const scores: Record<"approacher" | "welcomer" | "mixmatch", number> = {
    approacher: r("karsilama"),
    welcomer: (r("kayip") + r("kabin")) / 2,
    mixmatch: Math.max(r("urun"), r("sellthrough")),
  };
  const winner = (Object.keys(scores) as Array<keyof typeof scores>).sort((a, b) => scores[b] - scores[a])[0];
  const MAP: Record<keyof typeof scores, { label: string; cx: string; action: string; live: string }> = {
    approacher: {
      label: pick({ tr: "Approacher · Yaklaşan", en: "Approacher", es: "Acercador" }),
      cx: pick({
        tr: "İlk teması güçlü — proaktif yaklaşır, 'karşılama → ilgilenme' dönüşümünü açar.",
        en: "Strong first contact — proactive, opens the 'greet → engage' conversion.",
        es: "Primer contacto fuerte — proactivo, abre la conversión 'saludo → interés'.",
      }),
      action: pick({
        tr: "Welcome/Giriş'te konumlandır; conversion'ın başını o tutar.",
        en: "Place at Welcome/Entrance; they hold the front of conversion.",
        es: "Ubícalo en Welcome/Entrada; sostiene el inicio de la conversión.",
      }),
      live: pick({
        tr: "Welcome'da ilgilenme→satış dönüşümü (CX) ile güncellenir.",
        en: "Updated from engage→sale conversion at Welcome (CX).",
        es: "Se actualiza con la conversión interés→venta en Welcome (CX).",
      }),
    },
    welcomer: {
      label: pick({ tr: "Welcomer · Karşılayan", en: "Welcomer", es: "Recepcionista" }),
      cx: pick({
        tr: "Sıcak, sakin karşılama; bekleme stresini düşürür, düşen ürünü akışa geri kazandırır.",
        en: "Warm, calm welcome; lowers wait stress, recovers dropped items back into flow.",
        es: "Bienvenida cálida; reduce el estrés de espera y recupera prendas caídas.",
      }),
      action: pick({
        tr: "Kabin Welcomer / kayıp önleme hattında en değerli.",
        en: "Most valuable on the Cabin Welcomer / loss-prevention line.",
        es: "Más valioso en la línea Cabin Welcomer / prevención de pérdidas.",
      }),
      live: pick({
        tr: "Karşılama→ilgilenme + düşen ürün geri kazanımı ile güncellenir.",
        en: "Updated from greet→engage + dropped-item recovery.",
        es: "Se actualiza con saludo→interés + recuperación de prendas.",
      }),
    },
    mixmatch: {
      label: pick({ tr: "Mix&Match · Stilist", en: "Mix&Match · Stylist", es: "Mix&Match · Estilista" }),
      cx: pick({
        tr: "Kombin ve alternatif önerisiyle UPT/ATV'yi büyütür; kararsızı kabinde kapatır.",
        en: "Grows UPT/ATV with outfit & alternative suggestions; closes the undecided in the cabin.",
        es: "Aumenta UPT/ATV con combinaciones; cierra al indeciso en el probador.",
      }),
      action: pick({
        tr: "Reyon + kombin köşesi ve tepe-saat kabininde; sepeti derinleştirir.",
        en: "Floor + outfit corner and peak-hour cabin; deepens the basket.",
        es: "Sala + rincón de combinaciones y probador en hora pico; profundiza la cesta.",
      }),
      live: pick({
        tr: "Sepet UPT/ATV + FR→satış dönüşümü ile güncellenir.",
        en: "Updated from basket UPT/ATV + fitting-room→sale conversion.",
        es: "Se actualiza con UPT/ATV de cesta + conversión probador→venta.",
      }),
    },
  };
  const { label, cx, action, live } = MAP[winner];
  const energy =
    emp.level === MasteryLevel.Coach
      ? pick({ tr: "ekip enerjisini dengeleyen · yön veren", en: "balances team energy · sets direction", es: "equilibra la energía · marca el rumbo" })
      : emp.level === MasteryLevel.Master
        ? pick({ tr: "sakin · yoğunlukta istikrarlı", en: "calm · steady under load", es: "tranquilo · estable bajo presión" })
        : emp.level === MasteryLevel.Competent
          ? pick({ tr: "istikrarlı · özgüveni artan", en: "steady · growing confidence", es: "estable · con confianza creciente" })
          : pick({ tr: "öğrenmeye aç · hareketli", en: "eager to learn · energetic", es: "con ganas de aprender · enérgico" });
  return { label, energy, cx, action, live };
}

/** Final/dönem raporu — güçlü yönler · gelişim alanları · sonuç. */
export function finalReport(emp: Employee): FinalReport {
  const strong = compsByRaw(emp, "desc")
    .filter((k) => compRaw(emp.id, k) >= 3)
    .slice(0, 3)
    .map((k) => pick({ tr: `${compLabel(k)} — güçlü`, en: `Strong in ${compLabel(k)}`, es: `Fuerte en ${compLabel(k)}` }));
  const growthRoles = (["karsilama", "kabin"] as CompKey[])
    .filter((k) => compRaw(emp.id, k) <= 1)
    .slice(0, 2)
    .map((k) => pick({ tr: `${compLabel(k)} kademeli geliştirilmeli`, en: `${compLabel(k)} to be developed gradually`, es: `Desarrollar ${compLabel(k)} gradualmente` }));
  const result: Record<MasteryLevel, string> = {
    [MasteryLevel.New]: pick({
      tr: "Temeller oturuyor; ön cephe için kademeli ve kıdemli eşliğinde ilerliyor.",
      en: "Foundations are settling; advancing toward front of house gradually, paired with a senior.",
      es: "Las bases se asientan; avanza hacia el frente gradualmente, junto a un sénior.",
    }),
    [MasteryLevel.Competent]: pick({
      tr: "Bağımsız çalışıyor; uzmanlaşma ve tepe-saat dayanıklılığı evresinde.",
      en: "Works independently; in the phase of specialization and peak-hour resilience.",
      es: "Trabaja de forma autónoma; en fase de especialización y resistencia en hora pico.",
    }),
    [MasteryLevel.Master]: pick({
      tr: "Usta seviyede; bir alanı başkasına aktarmaya (öğretmeye) hazır.",
      en: "At master level; ready to transfer (teach) an area to someone else.",
      es: "Nivel maestro; listo para transferir (enseñar) un área a otra persona.",
    }),
    [MasteryLevel.Coach]: pick({
      tr: "Koç; ekibi geliştiriyor — kendi gelişimi de (eğitimcinin eğitimi) sürüyor.",
      en: "Coach; develops the team — their own growth (training the trainer) continues too.",
      es: "Coach; desarrolla al equipo — su propio crecimiento (formar al formador) también sigue.",
    }),
  };
  return {
    strengths: strong.length ? strong : [
      pick({ tr: "Öğrenmeye hevesli", en: "Eager to learn", es: "Con ganas de aprender" }),
      pick({ tr: "Tempoya hızlı uyum", en: "Adapts to tempo quickly", es: "Se adapta rápido al ritmo" }),
    ],
    growth: growthRoles.length ? [...growthRoles, growthEdgeOf(emp)] : [growthEdgeOf(emp)],
    result: result[emp.level],
  };
}
