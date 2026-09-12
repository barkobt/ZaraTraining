/**
 * roster-cleanup-2026-09-12.ts — Fadime'yi COM yap, COM hariç herkese 8 rolde
 * 3 yıldız (ANA) taban ver (mevcut 4 yıldız/⭐⭐⭐+ hücreler dokunulmaz),
 * Ramazan/Sude/Yağmur Dara'yı tamamen sil (Pusula geçmişleri dahil, cascade).
 *
 * NEDEN: Alan-bazlı sistemin soft-revert'iyle aynı felsefe — karmaşık,
 * parça parça yetkinlik matrisi yerine düz bir "herkes her yerde en az ANA"
 * tabanı + sadece gerçekten öne çıkanlar (mevcut ⭐⭐⭐+) ayrı kalsın.
 * COM etiketliler (ofis/kasa görevi) bu tabana dahil değil — floor rollerinde
 * değerlendirilmiyorlar.
 *
 * Salt-okunur DEĞİL. Çalıştırmadan önce ilgili tabloları JSON'a yedekler.
 *
 * Çalıştırmak için:
 *   npx tsx db/roster-cleanup-2026-09-12.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, or, inArray } from "drizzle-orm";
import { getDb } from "../api/_lib/queries/connection.js";
import {
  staff,
  competencies,
  pusulaPersonCompetency,
  pusulaEvidence,
  pusulaAptitudeSuggestions,
  pusulaGuidebookProgress,
  pusulaCompetencyEvals,
  pusulaPeriodActions,
  pusulaArchiveNotes,
  pusulaMentorMatches,
  pusulaReports,
} from "./schema.js";

const ROLES = [
  "Kabin",
  "Kabin Welcomer",
  "Sprinter",
  "Welcome",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
];

const DELETE_SHORT_NAMES = ["Ramazan", "Sude", "Yağmur D."];
const FADIME_SHORT_NAME = "Fadime";

async function main() {
  const db = getDb();

  const allStaff = await db.select().from(staff);
  const byShortName = new Map(allStaff.map((s) => [s.shortName, s]));

  const fadime = byShortName.get(FADIME_SHORT_NAME);
  if (!fadime) throw new Error(`${FADIME_SHORT_NAME} bulunamadı`);

  const toDelete = DELETE_SHORT_NAMES.map((n) => {
    const row = byShortName.get(n);
    if (!row) throw new Error(`${n} bulunamadı`);
    return row;
  });
  const deleteIds = toDelete.map((r) => r.id);

  // ─── 1. YEDEK ───
  const compRows = await db.select().from(competencies);
  const backupDir = join(process.cwd(), "db", "backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");

  const pusulaBackups: Record<string, unknown[]> = {};
  pusulaBackups.pusulaPersonCompetency = await db
    .select().from(pusulaPersonCompetency).where(inArray(pusulaPersonCompetency.staffId, deleteIds));
  pusulaBackups.pusulaEvidence = await db
    .select().from(pusulaEvidence).where(inArray(pusulaEvidence.staffId, deleteIds));
  pusulaBackups.pusulaAptitudeSuggestions = await db
    .select().from(pusulaAptitudeSuggestions).where(inArray(pusulaAptitudeSuggestions.staffId, deleteIds));
  pusulaBackups.pusulaGuidebookProgress = await db
    .select().from(pusulaGuidebookProgress).where(inArray(pusulaGuidebookProgress.staffId, deleteIds));
  pusulaBackups.pusulaCompetencyEvals = await db
    .select().from(pusulaCompetencyEvals).where(inArray(pusulaCompetencyEvals.staffId, deleteIds));
  pusulaBackups.pusulaPeriodActions = await db
    .select().from(pusulaPeriodActions).where(inArray(pusulaPeriodActions.staffId, deleteIds));
  pusulaBackups.pusulaArchiveNotes = await db
    .select().from(pusulaArchiveNotes).where(inArray(pusulaArchiveNotes.staffId, deleteIds));
  pusulaBackups.pusulaMentorMatches = await db
    .select().from(pusulaMentorMatches)
    .where(or(inArray(pusulaMentorMatches.mentorId, deleteIds), inArray(pusulaMentorMatches.menteeId, deleteIds)));
  pusulaBackups.pusulaReports = await db
    .select().from(pusulaReports).where(inArray(pusulaReports.staffId, deleteIds));

  const backupFile = join(backupDir, `roster-cleanup-before-${stamp}.json`);
  writeFileSync(
    backupFile,
    JSON.stringify(
      {
        _meta: { kind: "roster-cleanup-before", takenAt: new Date().toISOString() },
        staff: allStaff,
        competencies: compRows,
        deletedStaffShortNames: DELETE_SHORT_NAMES,
        pusula: pusulaBackups,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log("✅ Yedek yazıldı:", backupFile);

  // ─── 2. Fadime → COM ───
  await db.update(staff).set({ duty: "COM", updatedAt: new Date() }).where(eq(staff.id, fadime.id));
  console.log(`✅ ${FADIME_SHORT_NAME} → duty=COM`);

  // ─── 3. COM hariç herkese 8 rolde taban 3 (mevcut 4'ler dokunulmaz) ───
  const comShortNames = new Set(
    allStaff.filter((s) => s.duty === "COM").map((s) => s.shortName),
  );
  comShortNames.add(FADIME_SHORT_NAME); // az önce COM yaptık

  const deleteShortNames = new Set(DELETE_SHORT_NAMES);
  const eligible = allStaff.filter(
    (s) => !comShortNames.has(s.shortName) && !deleteShortNames.has(s.shortName),
  );

  const compByStaffRole = new Map<string, number>();
  for (const c of compRows) compByStaffRole.set(`${c.staffId}:${c.role}`, c.level);

  let inserted = 0;
  let updated = 0;
  let skippedPlus = 0;
  for (const s of eligible) {
    for (const role of ROLES) {
      const current = compByStaffRole.get(`${s.id}:${role}`);
      if (current === 4) {
        skippedPlus++;
        continue;
      }
      if (current === undefined) {
        await db.insert(competencies).values({ staffId: s.id, role, level: 3 });
        inserted++;
      } else if (current !== 3) {
        await db
          .update(competencies)
          .set({ level: 3, updatedAt: new Date() })
          .where(and(eq(competencies.staffId, s.id), eq(competencies.role, role)));
        updated++;
      }
    }
  }
  console.log(
    `✅ Yetkinlik tabanı: ${eligible.length} kişi × ${ROLES.length} rol — yeni eklenen ${inserted}, güncellenen ${updated}, mevcut ⭐⭐⭐+ korunan ${skippedPlus}`,
  );

  // ─── 4. Sil ───
  for (const row of toDelete) {
    await db.delete(staff).where(eq(staff.id, row.id));
    console.log(`✅ Silindi: ${row.shortName} (id ${row.id})`);
  }

  const remaining = await db.select({ id: staff.id }).from(staff);
  console.log(`Kalan personel sayısı: ${remaining.length}`);
}

main().catch((err) => {
  console.error("❌ Başarısız:", err);
  process.exit(1);
});
