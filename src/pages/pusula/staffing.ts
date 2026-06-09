// src/pages/pusula/staffing.ts
// Trafiğe göre GERÇEK kadro hesabı + SURPLUS yönetimi.
// Tepe-saatte kaç kişi gerekir? Vardiyada kaç var? Boşta kalan kim? Pusula düşük/orta
// yetkinli "esnek" kişileri ekstra işe (Backstock/25R/Tara) yönlendirir → prod artar,
// fazla kadroda chartı sürekli elle reviz etme derdi biter. Sayılar temsîlî.

import { CREW } from "./placement";
import { STAFF_COMP, STAFF_ROLES, byId } from "./data-staff";

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

export const EXTRA_TASKS = ["Backstock toplama", "25R Correction", "Tara · poşet-askı", "Reyon düzeni", "Albarán kontrol"];

function overall(id: string): number {
  const c = STAFF_COMP[id];
  if (!c) return 0;
  return STAFF_ROLES.filter((r) => r !== "Sprinter").reduce((a, r) => a + (c[r] ?? 0), 0);
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
    task: EXTRA_TASKS[i % EXTRA_TASKS.length],
    reason: "ön cephede kritik değil — ekstra işte prod'a katkı",
  }));
}
