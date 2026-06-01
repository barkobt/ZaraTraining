/**
 * assign-duties.ts — Kullanıcı listesindeki görev etiketlerini (duty) atar.
 *
 * COM   → İrem, Gamze, Fadime (COM Ekip)
 * CX    → Nehir, Kayra, Eylül
 * COACH → Ramazan, Bora, Baran
 *
 * employment (FT/PT) atanmaz — kullanıcı kendi girecek.
 * Idempotent: id ile güncelleme.  Çalıştır: npx tsx db/assign-duties.ts
 */
import { eq } from "drizzle-orm";
import { getDb } from "../api/_lib/queries/connection.js";
import { staff } from "./schema.js";

const DUTY_BY_ID: Record<number, string> = {
  105: "COM",   // İrem
  85: "COM",    // Gamze
  83: "COM",    // Fadime
  93: "CX",     // Nehir
  88: "CX",     // Kayra
  82: "CX",     // Eylül
  96: "COACH",  // Ramazan
  104: "COACH", // Bora
  74: "COACH",  // Baran
};

async function main() {
  const db = getDb();
  const now = new Date();
  let updated = 0;
  for (const [idStr, duty] of Object.entries(DUTY_BY_ID)) {
    const res = await db
      .update(staff)
      .set({ duty, updatedAt: now })
      .where(eq(staff.id, Number(idStr)))
      .returning({ id: staff.id });
    if (res.length) updated++;
    else console.warn(`⚠️  id=${idStr} bulunamadı`);
  }

  const all = await db.select().from(staff);
  const counts = new Map<string, number>();
  for (const s of all) {
    const key = s.duty ?? "—";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`✅ görev atanan=${updated}`);
  console.table(Object.fromEntries(counts));
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
