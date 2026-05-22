/**
 * DB row formatından FastAPI solver şemasına dönüştürme.
 *
 * DB rol etiketleri ("Welcome", "Z3-Z4", "Z5") solver Role enum NAME'leriyle
 * ("WELCOME", "ZONE_3", "ZONE_4", "ZONE_5") farklı. Z3-Z4 tek bir seviye
 * tutulup hem ZONE_3 hem ZONE_4'e açılıyor.
 */
import type { StaffWithCompetencies } from "./queries/staff.js";
import type { SolverStaffInput } from "./solver-client.js";

const TENURE_TO_GROUP: Record<string, string> = {
  EXPERT: "CEKIRDEK",
  NEW_0_1: "YENI_NEW",
  NEW_1_3: "YENI_MID",
  NEW_3_6: "YENI_SAFE",
  NEW_6_PLUS: "YENI_SAFE",
};

function competenciesToSolver(row: StaffWithCompetencies): Record<string, number> {
  const c = row.competencies;
  return {
    WELCOME: c["Welcome"] ?? 0,
    KABIN: c["Kabin"] ?? 0,
    KABIN_WELCOMER: c["Kabin Welcomer"] ?? 0,
    SPRINTER: c["Sprinter"] ?? 0,
    ZONE_2: c["Zone 2"] ?? 0,
    ZONE_3: c["Zone 3"] ?? 0,
    ZONE_4: c["Zone 4"] ?? 0,
    ZONE_5: c["Zone 5"] ?? 0,
  };
}

function tenureToGroup(row: StaffWithCompetencies): string {
  if (row.isManager) {
    if (row.note && /müdür/i.test(row.note)) return "YONETICI";
    return "SAHA_YONETIM";
  }
  return TENURE_TO_GROUP[row.tenureLevel] ?? "CEKIRDEK";
}

export function staffRowsToSolverInput(rows: StaffWithCompetencies[]): SolverStaffInput[] {
  return rows
    .filter((r) => !r.isBlacklisted)
    .map((r) => ({
      short_name: r.shortName,
      full_name: r.fullName,
      group: tenureToGroup(r),
      competencies: competenciesToSolver(r),
    }));
}
