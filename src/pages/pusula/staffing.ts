// src/pages/pusula/staffing.ts
// Trafiğe göre GERÇEK kadro hesabı + SURPLUS yönetimi.
// Tepe-saatte kaç kişi gerekir? Vardiyada kaç var? Boşta kalan kim? Pusula düşük/orta
// yetkinli "esnek" kişileri ekstra işe (Backstock/25R/Tara) yönlendirir → prod artar,
// fazla kadroda chartı sürekli elle reviz etme derdi biter. Sayılar temsîlî.

import { CREW } from "./placement";
import { byId } from "./data-staff";
import { COMP_KEYS, ROLE_NEEDS, compRaw, fitWord, personCompetencies, roleFit } from "./data-competency";
import { pick } from "./i18n";
import type { ZoneRole } from "./types";

/** Bugün vardiyada olanlar = chart ekibi (8) + 2 ekstra → 10 kişi (fazla kadro senaryosu). */
export const ROSTER_TODAY = [...CREW, "Fadime", "Saliha"];

/** Saatlik zemin ihtiyacı (trafikten türetilmiş gerekli kişi sayısı). */
export const FLOOR_NEED: Record<string, number> = {
  "15:00": 5,
  "16:00": 6,
  "17:00": 8,
  "18:00": 8,
  "19:00": 6,
  "20:00": 5,
};
export const PEAK_NEED = 8;

export const EXTRA_TASKS: (() => string)[] = [
  () => pick({ tr: "Backstock toplama", en: "Backstock pulling", es: "Recogida de backstock" }),
  () => "25R Correction",
  () => pick({ tr: "Tara · poşet-askı", en: "Tara · bags-hangers", es: "Tara · bolsas-perchas" }),
  () => pick({ tr: "Reyon düzeni", en: "Floor tidiness", es: "Orden de la sala" }),
  () => pick({ tr: "Albarán kontrol", en: "Albarán check", es: "Control de albarán" }),
];

function overall(id: string): number {
  // 6'lı kanıt vektörünün toplamı — iç sıralama (ekrana basılmaz)
  return COMP_KEYS.reduce((a, k) => a + compRaw(id, k), 0);
}

/** Saatlik denge: gerekli vs vardiyada → esnek (surplus) sayısı. */
export function balanceByHour(): { hour: string; need: number; flex: number }[] {
  return Object.entries(FLOOR_NEED).map(([hour, need]) => ({
    hour,
    need,
    flex: ROSTER_TODAY.length - need,
  }));
}

/**
 * Tepe-saatte bile boşta kalanlar (roster − tepe ihtiyacı). En düşük yetkinli
 * kişiler seçilir (yargı değil — ön cephede kritik değiller, ekstra işte değerliler).
 */
export function flexPeople(): { id: string; name: string; task: string; reason: string }[] {
  const ranked = [...ROSTER_TODAY].sort((a, b) => overall(a) - overall(b));
  const n = Math.max(0, ROSTER_TODAY.length - PEAK_NEED);
  return ranked.slice(0, n).map((id, i) => ({
    id,
    name: byId(id)?.name.split(" ")[0] ?? id,
    task: EXTRA_TASKS[i % EXTRA_TASKS.length](),
    reason: pick({
      tr: "ön cephede kritik değil — ekstra işte prod'a katkı",
      en: "not critical at the front — adds to prod in extra tasks",
      es: "no es crítico en el frente — aporta a la prod en tareas extra",
    }),
  }));
}

/** Bugün vardiyada boşta (flex) olanların id'leri. */
export function flexIds(): string[] {
  const ranked = [...ROSTER_TODAY].sort((a, b) => overall(a) - overall(b));
  return ranked.slice(0, Math.max(0, ROSTER_TODAY.length - PEAK_NEED));
}

/**
 * Bir zone rolüne EŞLENECEK müsait (boşta) kişi — surplus havuzundan, pozisyonun
 * TALEP ettiği yetkinliklere (talep × kanıt) en uygun olan. Çoktan ön cephede güçlü
 * atanmışları (excludeIds) hariç tutar. Yargı değil: boştaki eli yönlendirir.
 * TUTARLILIK: birincil talebi hiç KANITSIZ (unexplored) kişi "uygun" diye sunulmaz —
 * önce kanıtı olan aday tercih edilir; havuzda yalnız kanıtsız kaldıysa öneri
 * AÇIKÇA keşif olarak işaretlenir (discovery=true → UI keşif diliyle gösterir).
 */
export function bestFlexFor(
  role: ZoneRole,
  excludeIds: string[] = [],
): { id: string; name: string; fit: string; discovery: boolean } | null {
  const pool = flexIds().filter((id) => !excludeIds.includes(id));
  if (!pool.length) return null;
  const primary = [...ROLE_NEEDS[role]].sort((a, b) => b.weight - a.weight)[0]?.comp;
  const unexploredAt = (id: string) =>
    primary ? personCompetencies(id).find((p) => p.comp === primary)?.state.kind === "unexplored" : false;
  const sorted = [...pool].sort((a, b) => roleFit(b, role) - roleFit(a, role));
  const best = sorted.find((id) => !unexploredAt(id)) ?? sorted[0];
  return {
    id: best,
    name: byId(best)?.name.split(" ")[0] ?? best,
    fit: fitWord(best, role),
    discovery: unexploredAt(best),
  };
}
