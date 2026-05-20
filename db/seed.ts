/**
 * Seed v2: 30 personel, yeni rol modeli (Kabin Welcomer dahil).
 *
 * Roller: Welcome · Kabin · Kabin Welcomer · Sprinter · Zone 2-5 (8 sütun)
 * Kaynak: Kullanıcının paylaştığı yetkinlik tablosu (2026-05-18).
 * Sprinter sütunu görselde yok → herkese default 1 (UI'dan düzenlenebilir).
 *
 * İdempotent: mevcut store için competencies + staff CASCADE silinir,
 * sonra yeniden eklenir. solver_config, forbidden_role_pairs, charts dokunulmaz.
 */
import { getDb } from "../api/_lib/queries/connection.js";
import { stores, staff, competencies, solverConfig } from "./schema.js";
import { sql, eq } from "drizzle-orm";

const ROLES = [
  "Welcome",
  "Kabin",
  "Kabin Welcomer",
  "Sprinter",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
] as const;
type Role = (typeof ROLES)[number];

type SeedRow = {
  name: string;
  short: string;
  tenure: string;
  isManager: boolean;
  note: string;
  c: Record<Role, number>;
};

// Yetkinlik (resimden, "+" = 4, "-" = 0)
// Sprinter görselde yok → varsayılan 1
const STAFF: SeedRow[] = [
  { name: "Ada Ozasci", short: "Ada", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 2, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Ahmet Baran Bozkurt", short: "Baran", tenure: "EXPERT", isManager: true, note: "Saha yöneticisi",
    c: { Welcome: 1, Kabin: 1, "Kabin Welcomer": 2, Sprinter: 2, "Zone 2": 1, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Asya Zeynep Guner", short: "Asya", tenure: "NEW_0_1", isManager: false, note: "Çok yeni — tek bırakma",
    c: { Welcome: 0, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 0, "Zone 3": 0, "Zone 4": 0, "Zone 5": 0 } },
  { name: "Aysu Berna Ozturk", short: "Aysu", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 3, "Zone 4": 3, "Zone 5": 1 } },
  { name: "Begum Akar", short: "Begum", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 3, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Ceren Boluk", short: "Ceren", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 0, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 0, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Ecem Urcan", short: "Ecem", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 3, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 1, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Emirhan Yesilcicek", short: "Emirhan", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Emrah Buzlu", short: "Emrah", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 1, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Eylul Ozbek", short: "Eylul", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 3, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 2, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Fadime Kivrak", short: "Fadime", tenure: "NEW_1_3", isManager: false, note: "",
    c: { Welcome: 0, Kabin: 1, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 0, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Fatma Yavuz", short: "Fatma", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 4, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Gamze Kafadar", short: "Gamze", tenure: "NEW_0_1", isManager: false, note: "Çok yeni — tek bırakma",
    c: { Welcome: 0, Kabin: 0, "Kabin Welcomer": 0, Sprinter: 1, "Zone 2": 0, "Zone 3": 1, "Zone 4": 1, "Zone 5": 1 } },
  { name: "Guney Ugur Kanicioglu", short: "Guney", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Kaan Gunduz", short: "Kaan", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 3, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 1, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Kayra Uzun", short: "Kayra", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 3, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Kiymet Bakir", short: "Kiymet", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 4, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 1, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Meral Colak", short: "Meral", tenure: "NEW_1_3", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 4, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Merih Mustafa Baltaci", short: "Merih", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 2, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 1, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Muhammed Emir Gunes", short: "Emir", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 2, "Kabin Welcomer": 1, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Nehir Budak", short: "Nehir", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 3, "Kabin Welcomer": 4, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Nimet Bozkurt", short: "Nimet", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 3, "Kabin Welcomer": 1, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Pelin Aydin", short: "Pelin", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 3, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 1, "Zone 3": 3, "Zone 4": 3, "Zone 5": 2 } },
  { name: "Ramazan Hordun", short: "Ramazan", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 3, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 1, "Zone 3": 3, "Zone 4": 3, "Zone 5": 3 } },
  { name: "Saliha Kilic", short: "Saliha", tenure: "NEW_1_3", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 1, "Kabin Welcomer": 1, Sprinter: 1, "Zone 2": 1, "Zone 3": 2, "Zone 4": 2, "Zone 5": 3 } },
  { name: "Selin Varlioglu", short: "Selin", tenure: "NEW_3_6", isManager: false, note: "Güvenli yeni",
    c: { Welcome: 2, Kabin: 2, "Kabin Welcomer": 4, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Sevilay Celik", short: "Sevilay", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 1, Kabin: 2, "Kabin Welcomer": 4, Sprinter: 1, "Zone 2": 1, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
  { name: "Sevimnur Yalcin", short: "Sevim", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 2, Kabin: 4, "Kabin Welcomer": 3, Sprinter: 1, "Zone 2": 2, "Zone 3": 2, "Zone 4": 2, "Zone 5": 3 } },
  { name: "Seyma Semsit", short: "Seyma", tenure: "EXPERT", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 4, "Kabin Welcomer": 4, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 2 } },
  { name: "Sude Yeni", short: "Sude", tenure: "NEW_3_6", isManager: false, note: "",
    c: { Welcome: 3, Kabin: 4, "Kabin Welcomer": 2, Sprinter: 1, "Zone 2": 3, "Zone 3": 2, "Zone 4": 2, "Zone 5": 1 } },
];

async function seed() {
  const db = getDb();
  console.log("Seeding shift organizer data (v2)…");

  const [store] = await db
    .insert(stores)
    .values({ code: "3643", name: "Zara 3643", section: "BASIC" })
    .onConflictDoUpdate({
      target: stores.code,
      set: { name: sql`excluded.name`, section: sql`excluded.section` },
    })
    .returning();

  if (!store) throw new Error("Store seed failed");
  console.log(`  store id=${store.id} (${store.code})`);

  await db
    .insert(solverConfig)
    .values({ storeId: store.id })
    .onConflictDoNothing();

  // Mevcut staff + cascade competencies sil (charts JSON ile bağlı değil, güvenli)
  const deleted = await db.delete(staff).where(eq(staff.storeId, store.id)).returning();
  console.log(`  ${deleted.length} eski staff silindi (CASCADE ile competencies dahil)`);

  for (const p of STAFF) {
    const [s] = await db
      .insert(staff)
      .values({
        storeId: store.id,
        fullName: p.name,
        shortName: p.short,
        tenureLevel: p.tenure,
        isManager: p.isManager,
        note: p.note || null,
      })
      .returning();

    if (!s) continue;
    for (const role of ROLES) {
      await db.insert(competencies).values({
        staffId: s.id,
        role,
        level: p.c[role],
      });
    }
  }

  console.log(`  ${STAFF.length} staff + her birine ${ROLES.length} yetkinlik seed edildi`);
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
