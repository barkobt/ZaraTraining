/**
 * backup-v1-snapshot.ts — Shift Organizer v1 (yetkinlik-bazlı sistem) tam yedeği.
 *
 * NEDEN: Alan-bazlı (area-based) yeni sisteme geçiş öncesi, yetkinliklerle
 * "oynamadan" önce geri-dönülebilir bir nokta yaratmak için. Yetkinlikler ve
 * solver ayarları DB'de tutuluyor (API stateless), bu yüzden yedek = DB snapshot.
 *
 * Salt-okunur: hiçbir tabloyu DEĞİŞTİRMEZ, sadece okur ve JSON'a yazar.
 *
 * Kapsam (v1 state'i anlamlı kılan minimum küme):
 *   stores, staff, competencies, solver_config, forbidden_role_pairs
 * (buenas_* ve charts hariç — onlar ayrı modül / arşiv.)
 *
 * Çalıştırmak için:
 *   npx tsx db/backup-v1-snapshot.ts
 *
 * Çıktı: db/backups/v1-snapshot-<YYYY-MM-DDTHH-mm-ss>.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../api/_lib/queries/connection.js";
import {
  stores,
  staff,
  competencies,
  solverConfig,
  forbiddenRolePairs,
} from "./schema.js";

async function main() {
  const db = getDb();

  // Sırayla çek — Neon HTTP sürücüsü tek bağlantı, paralel gerek yok.
  const storesRows = await db.select().from(stores);
  const staffRows = await db.select().from(staff);
  const competencyRows = await db.select().from(competencies);
  const solverConfigRows = await db.select().from(solverConfig);
  const forbiddenPairRows = await db.select().from(forbiddenRolePairs);

  const snapshot = {
    _meta: {
      kind: "shift-organizer-v1-snapshot",
      takenAt: new Date().toISOString(),
      note: "Yetkinlik-bazlı v1 sistem yedeği — alan-bazlı geçiş öncesi.",
    },
    counts: {
      stores: storesRows.length,
      staff: staffRows.length,
      competencies: competencyRows.length,
      solverConfig: solverConfigRows.length,
      forbiddenRolePairs: forbiddenPairRows.length,
    },
    data: {
      stores: storesRows,
      staff: staffRows,
      competencies: competencyRows,
      solverConfig: solverConfigRows,
      forbiddenRolePairs: forbiddenPairRows,
    },
  };

  const dir = join(process.cwd(), "db", "backups");
  mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");
  const file = join(dir, `v1-snapshot-${stamp}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf8");

  console.log("✅ v1 snapshot yazıldı:", file);
  console.table(snapshot.counts);
}

main().catch((err) => {
  console.error("❌ Yedek başarısız:", err);
  process.exit(1);
});
