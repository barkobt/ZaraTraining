import { eq, asc } from "drizzle-orm";
import { getDb } from "./connection.js";
import { staff, competencies } from "../../../db/schema.js";

export type StaffWithCompetencies = {
  id: number;
  storeId: number | null;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  isBlacklisted: boolean;
  note: string | null;
  // Alan-bazlı v2: sabit çalışma alanı (null = atanmamış). v1 bunu yok sayar.
  homeArea: string | null;
  duty: string | null;        // COM | CX | COACH
  employment: string | null;  // FT | PT
  competencies: Record<string, number>;
};

export async function listStaff(storeId: number): Promise<StaffWithCompetencies[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(staff)
    .where(eq(staff.storeId, storeId))
    .orderBy(asc(staff.id));

  if (rows.length === 0) return [];

  const compRows = await db
    .select()
    .from(competencies);

  const compByStaff = new Map<number, Record<string, number>>();
  for (const c of compRows) {
    const m = compByStaff.get(c.staffId) ?? {};
    m[c.role] = c.level;
    compByStaff.set(c.staffId, m);
  }

  return rows.map((s) => ({
    id: s.id,
    storeId: s.storeId,
    fullName: s.fullName,
    shortName: s.shortName,
    tenureLevel: s.tenureLevel,
    isManager: s.isManager,
    isBlacklisted: s.isBlacklisted,
    note: s.note,
    homeArea: s.homeArea,
    duty: s.duty,
    employment: s.employment,
    competencies: compByStaff.get(s.id) ?? {},
  }));
}

export async function createStaff(data: {
  storeId: number;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager?: boolean;
  note?: string | null;
}) {
  const db = getDb();
  const [row] = await db.insert(staff).values(data).returning();
  return row ?? null;
}

export async function updateStaff(
  id: number,
  patch: Partial<{
    fullName: string;
    shortName: string;
    tenureLevel: string;
    isManager: boolean;
    isBlacklisted: boolean;
    note: string | null;
    homeArea: string | null;
    duty: string | null;
    employment: string | null;
  }>,
) {
  const db = getDb();
  const [row] = await db
    .update(staff)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(staff.id, id))
    .returning();
  return row ?? null;
}

export async function deleteStaff(id: number) {
  const db = getDb();
  await db.delete(staff).where(eq(staff.id, id));
}

export async function upsertCompetency(staffId: number, role: string, level: number) {
  const db = getDb();
  await db
    .insert(competencies)
    .values({ staffId, role, level })
    .onConflictDoUpdate({
      target: [competencies.staffId, competencies.role],
      set: { level, updatedAt: new Date() },
    });
}

export async function listCompetenciesFor(staffId: number) {
  const db = getDb();
  return db
    .select()
    .from(competencies)
    .where(eq(competencies.staffId, staffId));
}
