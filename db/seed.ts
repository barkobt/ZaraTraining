import { getDb } from "../api/_lib/queries/connection.js";
import { stores, staff, competencies, solverConfig } from "./schema.js";
import { sql } from "drizzle-orm";

const ROLES = ["Welcome", "Kabin", "Runner", "Sprinter", "Z3-Z4", "Z5"] as const;
type Role = (typeof ROLES)[number];

const INITIAL_STAFF: Array<{
  name: string;
  short: string;
  tenure: string;
  isManager: boolean;
  note: string;
  c: Record<Role, number>;
}> = [
  { name: "Ahmet Baran Bozkurt", short: "Baran", tenure: "EXPERT", isManager: true, note: "Saha yöneticisi", c: { Welcome: 1, Kabin: 1, Runner: 2, Sprinter: 2, "Z3-Z4": 3, Z5: 2 } },
  { name: "Pelin Aydın", short: "Pelin", tenure: "EXPERT", isManager: false, note: "", c: { Welcome: 1, Kabin: 3, Runner: 3, Sprinter: 3, "Z3-Z4": 3, Z5: 2 } },
  { name: "Sevimnur Yalçın", short: "Sevim", tenure: "EXPERT", isManager: false, note: "", c: { Welcome: 2, Kabin: 4, Runner: 3, Sprinter: 3, "Z3-Z4": 2, Z5: 3 } },
  { name: "Fatma Yavuz", short: "Fatma", tenure: "EXPERT", isManager: false, note: "", c: { Welcome: 2, Kabin: 4, Runner: 3, Sprinter: 3, "Z3-Z4": 2, Z5: 2 } },
  { name: "Ecem Urcan", short: "Ecem", tenure: "EXPERT", isManager: false, note: "", c: { Welcome: 1, Kabin: 2, Runner: 3, Sprinter: 4, "Z3-Z4": 3, Z5: 2 } },
  { name: "Selin Varlıoğlu", short: "Selin", tenure: "NEW_3_6", isManager: false, note: "Güvenli yeni", c: { Welcome: 2, Kabin: 2, Runner: 1, Sprinter: 4, "Z3-Z4": 2, Z5: 1 } },
  { name: "Sude Yeni", short: "Sude", tenure: "NEW_3_6", isManager: false, note: "", c: { Welcome: 3, Kabin: 3, Runner: 1, Sprinter: 1, "Z3-Z4": 2, Z5: 1 } },
  { name: "Meral Çolak", short: "Meral", tenure: "NEW_1_3", isManager: false, note: "", c: { Welcome: 2, Kabin: 2, Runner: 1, Sprinter: 2, "Z3-Z4": 2, Z5: 1 } },
  { name: "Asya Zeynep Güner", short: "Asya", tenure: "NEW_0_1", isManager: false, note: "Çok yeni — tek bırakma", c: { Welcome: 3, Kabin: 1, Runner: 1, Sprinter: 1, "Z3-Z4": 2, Z5: 1 } },
  { name: "Kaan Ovezoğlu", short: "Ovezoglu", tenure: "NEW_0_1", isManager: false, note: "", c: { Welcome: 3, Kabin: 1, Runner: 1, Sprinter: 1, "Z3-Z4": 2, Z5: 1 } },
  { name: "Mete Alp Karvan", short: "Mete", tenure: "NEW_0_1", isManager: false, note: "", c: { Welcome: 3, Kabin: 1, Runner: 1, Sprinter: 1, "Z3-Z4": 2, Z5: 1 } },
  { name: "Taha İşler", short: "Taha", tenure: "EXPERT", isManager: true, note: "Müdür Y.", c: { Welcome: 0, Kabin: 0, Runner: 0, Sprinter: 0, "Z3-Z4": 1, Z5: 1 } },
];

async function seed() {
  const db = getDb();
  console.log("Seeding shift organizer data…");

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

  await db.insert(solverConfig).values({ storeId: store.id }).onConflictDoNothing();

  for (const p of INITIAL_STAFF) {
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
      .onConflictDoUpdate({
        target: [staff.storeId, staff.shortName],
        set: {
          fullName: sql`excluded.full_name`,
          tenureLevel: sql`excluded.tenure_level`,
          isManager: sql`excluded.is_manager`,
          note: sql`excluded.note`,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    if (!s) continue;
    for (const role of ROLES) {
      await db
        .insert(competencies)
        .values({ staffId: s.id, role, level: p.c[role] })
        .onConflictDoUpdate({
          target: [competencies.staffId, competencies.role],
          set: { level: sql`excluded.level`, updatedAt: sql`now()` },
        });
    }
  }

  console.log(`  ${INITIAL_STAFF.length} staff + competencies seeded`);
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
