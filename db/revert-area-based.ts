/**
 * revert-area-based.ts — Alan-bazlı (area-based) v2 sistemini "soft revert" ile kapatır.
 *
 * NEDEN: shift-solver-api'deki CP-SAT çözücü `_area_mode` adında bir anahtara
 * sahip: `any(s.home_area for s in staff_list)`. Hiçbir personelin home_area'sı
 * dolu değilse tüm alan-bazlı kurallar (yumuşak bonus/ceza + FR/YENİ_NEW sert
 * kilidi) otomatik devre dışı kalır ve solver eski "yetkinlik-bazlı, herkes
 * her yerde" moduna döner — kod hiç değişmeden. Bu yüzden gerçek bir git
 * revert yerine yalnızca bu kolonu temizlemek yeterli (ve FAZ 4/7/8/9/12'deki
 * alanla ilgisiz iyileştirmeleri korur).
 *
 * Salt-okunur DEĞİL: staff.home_area kolonunu NULL'lar. Ama geri dönüşü kolay:
 *   1) Önce mevcut (home_area dolu) satırları JSON'a yedekler.
 *   2) Sonra UPDATE ile temizler.
 * Geri almak istersen: db/backups/home-area-before-revert-*.json içindeki
 * {id, homeArea} çiftlerini okuyup tek tek UPDATE staff SET home_area = ... yeter.
 *
 * Çalıştırmak için:
 *   npx tsx db/revert-area-based.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { getDb } from "../api/_lib/queries/connection.js";
import { staff } from "./schema.js";

async function main() {
  const db = getDb();

  const before = await db
    .select({ id: staff.id, shortName: staff.shortName, fullName: staff.fullName, homeArea: staff.homeArea })
    .from(staff)
    .where(isNotNull(staff.homeArea));

  console.log(`home_area dolu personel sayısı: ${before.length}`);
  console.table(before);

  if (before.length === 0) {
    console.log("Zaten hiç kimsenin home_area'sı dolu değil — yapılacak bir şey yok.");
    return;
  }

  const dir = join(process.cwd(), "db", "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");
  const file = join(dir, `home-area-before-revert-${stamp}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        _meta: {
          kind: "home-area-before-revert",
          takenAt: new Date().toISOString(),
          note: "Soft-revert öncesi home_area değerleri — geri almak için bu dosyayı kullan.",
        },
        data: before,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log("✅ Yedek yazıldı:", file);

  for (const row of before) {
    await db.update(staff).set({ homeArea: null }).where(eq(staff.id, row.id));
  }

  const after = await db
    .select({ id: staff.id })
    .from(staff)
    .where(isNotNull(staff.homeArea));
  console.log(`Güncelleme sonrası home_area dolu personel sayısı: ${after.length}`);
}

main().catch((err) => {
  console.error("❌ Revert başarısız:", err);
  process.exit(1);
});
