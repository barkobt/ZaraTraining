// src/pages/pusula/placement.ts
// #3 GERÇEK VERİ KÖPRÜSÜ (adapter seam) + #2 KADEMELİ UYGULAMA motoru.
//
// Demo MOCK; ama şekil gerçek solver çıktısıyla birebir: SolveResponse.chart =
// Array<{ role, hour, persons[] }>. Gerçeğe geçişte tek yapılacak: aşağıdaki
// applyMoves yerine tRPC çağrısı koymak —
//   const res = await trpc.chart.generate.mutate({ shift_date, hours, staff, shifts, config });
//   return res.chart;  // aynı ChartState şekli
// Geri kalan UI (ShiftChart/PocketMeter) hiç değişmez.

import { chartBefore, recommendations } from "./data";
import type { ChartState, ZoneRole } from "./types";

/** Solver yanıtının chart alanıyla aynı şekil — köprü tipi. */
export type SolverShapedChart = ChartState;

const HOURS = Array.from(new Set(chartBefore.map((c) => c.hour)));

/** Her öneri → tek bir atama hareketi (kişi → hedef rol). */
const REC_MOVE: Record<string, { employeeId: string; toRole: ZoneRole }> = Object.fromEntries(
  recommendations.map((r) => [r.id, { employeeId: r.employeeId, toRole: r.toRole }]),
);

/**
 * Kabul edilen önerileri chartBefore üzerine KÜMÜLATİF uygular: her kabul, ilgili
 * kişiyi tüm cep saatlerinde hedef role taşır (eski hücreden çıkar). Hepsi kabul
 * edilince sonuç chartAfter ile örtüşür. Tek tek kabul → kademeli morph.
 */
export function applyMoves(acceptedIds: string[]): ChartState {
  const grid = new Map<string, Map<string, string[]>>();
  for (const c of chartBefore) {
    if (!grid.has(c.hour)) grid.set(c.hour, new Map());
    grid.get(c.hour)!.set(c.role, [...c.persons]);
  }

  for (const id of acceptedIds) {
    const mv = REC_MOVE[id];
    if (!mv) continue;
    for (const hour of HOURS) {
      const roles = grid.get(hour)!;
      for (const persons of roles.values()) {
        const idx = persons.indexOf(mv.employeeId);
        if (idx >= 0) persons.splice(idx, 1);
      }
      if (!roles.has(mv.toRole)) roles.set(mv.toRole, []);
      roles.get(mv.toRole)!.push(mv.employeeId);
    }
  }

  const out: ChartState = [];
  for (const [hour, roles] of grid) {
    for (const [role, persons] of roles) {
      if (persons.length) out.push({ role: role as ZoneRole, hour, persons });
    }
  }
  return out;
}
