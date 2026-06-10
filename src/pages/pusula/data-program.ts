// src/pages/pusula/data-program.ts
// 8-haftalık programın kişiye özel parçaları — kişinin GERÇEK yetkinlik profilinden
// TÜRETİLİR (el ile 30× yazılmaz, hep tutarlı). Yetkinlik 0–5 ekranda ETİKETLE
// gösterilir (sayı basılmaz). Dönem aksiyonu + final rapor da profilden çıkar.

import { COMPETENCIES } from "./data-gelisim";
import { STAFF_COMP, STAFF_ROLES } from "./data-staff";
import { MasteryLevel, type Employee } from "./types";
import type { AreaSignal, CompetencyRow, FinalReport, PeriodAction } from "./types-gelisim";

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
  const prioIdx = h % COMPETENCIES.length;
  const plusIdx = (h + 2) % COMPETENCIES.length;
  return COMPETENCIES.map((name, i) => {
    const delta = i === prioIdx ? -1 : i === plusIdx ? 1 : 0;
    return { name, priority: i === prioIdx, periods: base.map((v) => clamp(v + delta)) };
  });
}

function firstName(emp: Employee) {
  return emp.name.split(" ")[0];
}

function rolesByComp(emp: Employee, dir: "desc" | "asc") {
  const c = STAFF_COMP[emp.id] ?? ({} as Record<string, number>);
  return [...STAFF_ROLES]
    .filter((r) => r !== "Sprinter")
    .sort((a, b) => (dir === "desc" ? c[b] - c[a] : c[a] - c[b]));
}

/** 4 dönem aksiyon planı (Hafta 2/4/6/8) — gelişim arkına göre kişiselleşir. */
export function periodActions(emp: Employee): PeriodAction[] {
  const fn = firstName(emp);
  const strongRole = rolesByComp(emp, "desc")[0];
  const weakRole = rolesByComp(emp, "asc")[0];
  return [
    {
      week: "Hafta 2",
      priorities: ["Oryantasyon & rol beklentileri", "Mağaza düzeni ve tempo"],
      goal: "Sahaya güvenli giriş; temel akışları tanıma.",
      action: `${fn} ilk hafta kıdemli eşliğinde gözlem (shadowing).`,
    },
    {
      week: "Hafta 4",
      priorities: [`${weakRole} temel akışı`, "Müşteri yaklaşımı"],
      goal: `${weakRole}'de desteksiz ilk denemeler.`,
      action: "Gölge seansı + birebir geri bildirim; küçük başarıları kutla.",
    },
    {
      week: "Hafta 6",
      priorities: ["Bağımsız ön cephe", "Tepe-saat dayanıklılığı"],
      goal: "Yoğunlukta ritmi koruma; tek başına ön cephe.",
      action: "Kontrollü tepe-saat maruziyeti; kıdemli yakın destekte.",
    },
    {
      week: "Hafta 8",
      priorities: [`${strongRole} derinleşme`, "Usta aktarımına hazırlık"],
      goal: "Bir konuyu başkasına öğretebilir seviye.",
      action: "Değerlendirme + sonraki dönem aksiyon planı.",
    },
  ];
}

function lvl(v: number): AreaSignal["level"] {
  return v >= 3 ? "strong" : v === 2 ? "developing" : v === 1 ? "neutral" : "none";
}
function evid(v: number): string {
  return v === 0 ? "veri yok" : v >= 3 ? "n≈14" : v === 2 ? "n≈6" : "n≈2";
}

/**
 * Alan-spesifik dinamik sinyaller — her alanın GERÇEK çıktısından güncellenir.
 * Yetkinlik 0 → o alanda bulunmamış → veri yok → keşif (yargı değil).
 */
export function areaSignals(emp: Employee): AreaSignal[] {
  const c = (STAFF_COMP[emp.id] ?? {}) as Record<string, number>;
  const zoneAvg = Math.round(((c["Zone 2"] ?? 0) + (c["Zone 3"] ?? 0) + (c["Zone 4"] ?? 0) + (c["Zone 5"] ?? 0)) / 4);
  return [
    { area: "Tepe-saat kapatma", source: "Kabin → kasada satın alınan ürün", level: lvl(c["Kabin"] ?? 0), evidence: evid(c["Kabin"] ?? 0) },
    { area: "Karşılama & yönlendirme", source: "Welcome → ilgilenme + QR yönlendirme", level: lvl(c["Welcome"] ?? 0), evidence: evid(c["Welcome"] ?? 0) },
    { area: "Reyon hakimiyeti", source: "Zone → vardiya-içi sell-through", level: lvl(zoneAvg), evidence: evid(zoneAvg) },
    { area: "Kayıp önleme", source: "Kabin Welcomer → düşen ürün geri kazanımı", level: lvl(c["Kabin Welcomer"] ?? 0), evidence: evid(c["Kabin Welcomer"] ?? 0) },
  ];
}

/** Pusula'nın üretilmiş okuması — kanıta dayalı, belirsizlik-farkında, kişi hakkında. */
export function pusulaReading(emp: Employee): string {
  const sig = areaSignals(emp);
  const strong = sig.find((s) => s.level === "strong");
  const none = sig.find((s) => s.level === "none");
  const fn = emp.name.split(" ")[0];
  const parts: string[] = [];
  if (strong) parts.push(`${strong.area.toLowerCase()} kanıtlı (güçlü, ${strong.evidence})`);
  else parts.push(`temel akışlar oturuyor`);
  if (none) parts.push(`${none.area.toLowerCase()} alanında veri yok — yargı değil, **keşif** öneriliyor`);
  const tail =
    emp.level === MasteryLevel.Coach
      ? "Koç: kendi gelişimi mentee lifti üzerinden okunuyor."
      : emp.level === MasteryLevel.Master
        ? "Usta: aktarıma hazır."
        : emp.level === MasteryLevel.Competent
          ? "Yetkin: tepe-saat dayanıklılığı evresinde."
          : "Yeni: gelişim eğrisi yukarı, kıdemli eşliğinde.";
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
  const c = (STAFF_COMP[emp.id] ?? {}) as Record<string, number>;
  const zoneAvg = Math.round(((c["Zone 2"] ?? 0) + (c["Zone 3"] ?? 0) + (c["Zone 4"] ?? 0) + (c["Zone 5"] ?? 0)) / 4);
  // Herkesin enerjisi 3'ten biri: Approacher / Welcomer / Mix&Match (argmax).
  const scores: Record<"approacher" | "welcomer" | "mixmatch", number> = {
    approacher: c["Welcome"] ?? 0,
    welcomer: c["Kabin Welcomer"] ?? 0,
    mixmatch: Math.max(zoneAvg, c["Kabin"] ?? 0),
  };
  const winner = (Object.keys(scores) as Array<keyof typeof scores>).sort((a, b) => scores[b] - scores[a])[0];
  const MAP: Record<keyof typeof scores, { label: string; cx: string; action: string; live: string }> = {
    approacher: {
      label: "Approacher · Yaklaşan",
      cx: "İlk teması güçlü — proaktif yaklaşır, 'karşılama → ilgilenme' dönüşümünü açar.",
      action: "Welcome/Giriş'te konumlandır; conversion'ın başını o tutar.",
      live: "Welcome'da ilgilenme→satış dönüşümü (CX) ile güncellenir.",
    },
    welcomer: {
      label: "Welcomer · Karşılayan",
      cx: "Sıcak, sakin karşılama; bekleme stresini düşürür, düşen ürünü akışa geri kazandırır.",
      action: "Kabin Welcomer / kayıp önleme hattında en değerli.",
      live: "Karşılama→ilgilenme + düşen ürün geri kazanımı ile güncellenir.",
    },
    mixmatch: {
      label: "Mix&Match · Stilist",
      cx: "Kombin ve alternatif önerisiyle UPT/ATV'yi büyütür; kararsızı kabinde kapatır.",
      action: "Reyon + kombin köşesi ve tepe-saat kabininde; sepeti derinleştirir.",
      live: "Sepet UPT/ATV + FR→satış dönüşümü ile güncellenir.",
    },
  };
  const { label, cx, action, live } = MAP[winner];
  const energy =
    emp.level === MasteryLevel.Coach
      ? "ekip enerjisini dengeleyen · yön veren"
      : emp.level === MasteryLevel.Master
        ? "sakin · yoğunlukta istikrarlı"
        : emp.level === MasteryLevel.Competent
          ? "istikrarlı · özgüveni artan"
          : "öğrenmeye aç · hareketli";
  return { label, energy, cx, action, live };
}

/** Final/dönem raporu — güçlü yönler · gelişim alanları · sonuç. */
export function finalReport(emp: Employee): FinalReport {
  const c = (STAFF_COMP[emp.id] ?? {}) as Record<string, number>;
  const strong = rolesByComp(emp, "desc")
    .filter((r) => c[r] >= 3)
    .slice(0, 3)
    .map((r) => `${r}'de güçlü`);
  const growthRoles = ["Welcome", "Kabin", "Kabin Welcomer"]
    .filter((r) => (c[r] ?? 0) <= 1)
    .slice(0, 2)
    .map((r) => `${r} kademeli geliştirilmeli`);
  const result: Record<MasteryLevel, string> = {
    [MasteryLevel.New]: "Temeller oturuyor; ön cephe için kademeli ve kıdemli eşliğinde ilerliyor.",
    [MasteryLevel.Competent]: "Bağımsız çalışıyor; uzmanlaşma ve tepe-saat dayanıklılığı evresinde.",
    [MasteryLevel.Master]: "Usta seviyede; bir alanı başkasına aktarmaya (öğretmeye) hazır.",
    [MasteryLevel.Coach]: "Koç; ekibi geliştiriyor — kendi gelişimi de (eğitimcinin eğitimi) sürüyor.",
  };
  return {
    strengths: strong.length ? strong : ["Öğrenmeye hevesli", "Tempoya hızlı uyum"],
    growth: growthRoles.length ? [...growthRoles, emp.growthEdge] : [emp.growthEdge],
    result: result[emp.level],
  };
}
