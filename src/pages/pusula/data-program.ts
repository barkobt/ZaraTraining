// src/pages/pusula/data-program.ts
// 8-haftalık programın kişiye özel parçaları — kişinin GERÇEK yetkinlik profilinden
// TÜRETİLİR (el ile 30× yazılmaz, hep tutarlı). Yetkinlik 0–5 ekranda ETİKETLE
// gösterilir (sayı basılmaz). Dönem aksiyonu + final rapor da profilden çıkar.

import { COMPETENCIES } from "./data-gelisim";
import { STAFF_COMP, STAFF_ROLES } from "./data-staff";
import { MasteryLevel, type Employee } from "./types";
import type { CompetencyRow, FinalReport, PeriodAction } from "./types-gelisim";

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
