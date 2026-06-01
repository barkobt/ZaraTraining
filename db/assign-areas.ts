/**
 * assign-areas.ts — Kullanıcının verdiği listeye göre staff.home_area ataması.
 *
 * Idempotent: tekrar çalıştırılabilir. Mevcut kişiler id ile güncellenir;
 * sistemde olmayan 3 kişi (Cansın, Beyza, İlkim Hura) eklenir sonra atanır.
 * Listede olmayan (Asya) dokunulmaz → home_area NULL kalır.
 *
 * Çalıştır:  npx tsx db/assign-areas.ts
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../api/_lib/queries/connection.js";
import { staff } from "./schema.js";

const STORE_ID = 1;

// Mevcut personel → alan (id ile, kesin eşleşme).
const BY_ID: Record<number, string> = {
  // Fitting Room
  100: "FITTING_ROOM", // Sevimnur (Sevim)
  109: "FITTING_ROOM", // Feride
  93: "FITTING_ROOM",  // Nehir
  95: "FITTING_ROOM",  // Pelin
  108: "FITTING_ROOM", // Azra Nur (Azranur)
  84: "FITTING_ROOM",  // Fatma
  88: "FITTING_ROOM",  // Kayra
  79: "FITTING_ROOM",  // Ecem
  // Runner 360
  101: "RUNNER_360",   // Şeyma
  // Sprinter
  91: "SPRINTER",      // Merih
  90: "SPRINTER",      // Meral
  99: "SPRINTER",      // Sevilay
  // Woman (Welcome / Zone 1-2)
  103: "WOMAN",        // Taha
  77: "WOMAN",         // Begüm
  106: "WOMAN",        // Kaan Övezoğlu
  73: "WOMAN",         // Ada
  // TRF (Zone 5)
  97: "TRF",           // Saliha
  80: "TRF",           // Emirhan
  82: "TRF",           // Eylül
  96: "TRF",           // Ramazan
  102: "TRF",          // Sude
  // Basic (Zone 3-4)
  105: "BASIC",        // İrem  (COM Ekip)
  85: "BASIC",         // Gamze (COM Ekip)
  83: "BASIC",         // Fadime (COM Ekip)
  104: "BASIC",        // Bora
  74: "BASIC",         // Baran
  98: "BASIC",         // Selin
  87: "BASIC",         // Kaan Gündüz
  89: "BASIC",         // Kıymet
  110: "BASIC",        // Yağmur Haşhaş
  107: "BASIC",        // Mete Alp
  92: "BASIC",         // M. Emir
  86: "BASIC",         // Güney
  76: "BASIC",         // Aysu
};

// Sistemde olmayan, listede geçen kişiler → eklenecek.
// tenureLevel zorunlu; kesin bilinmediği için "NEW_3_6" placeholder —
// kullanıcı Yetkinlik ekranından düzeltebilir.
const NEW_PEOPLE: { fullName: string; shortName: string; area: string }[] = [
  { fullName: "Cansın", shortName: "Cansın", area: "FITTING_ROOM" },
  { fullName: "Beyza", shortName: "Beyza", area: "FITTING_ROOM" },
  { fullName: "İlkim Hura", shortName: "İlkim", area: "TRF" },
];

async function main() {
  const db = getDb();
  const now = new Date();

  // 1) Mevcutları güncelle.
  let updated = 0;
  for (const [idStr, area] of Object.entries(BY_ID)) {
    const id = Number(idStr);
    const res = await db
      .update(staff)
      .set({ homeArea: area, updatedAt: now })
      .where(eq(staff.id, id))
      .returning({ id: staff.id });
    if (res.length) updated++;
    else console.warn(`⚠️  id=${id} bulunamadı (atlandı)`);
  }

  // 2) Yeni kişileri ekle (varsa atla) sonra alanını yaz — idempotent.
  let created = 0;
  for (const p of NEW_PEOPLE) {
    const existing = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.storeId, STORE_ID), eq(staff.shortName, p.shortName)));
    if (existing.length === 0) {
      await db.insert(staff).values({
        storeId: STORE_ID,
        fullName: p.fullName,
        shortName: p.shortName,
        tenureLevel: "NEW_3_6",
        homeArea: p.area,
      });
      created++;
    } else {
      await db
        .update(staff)
        .set({ homeArea: p.area, updatedAt: now })
        .where(eq(staff.id, existing[0]!.id));
    }
  }

  // 3) Doğrulama — alan bazlı sayım.
  const all = await db.select().from(staff);
  const counts = new Map<string, number>();
  for (const s of all) {
    const key = s.homeArea ?? "ATANMAMIŞ";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`✅ güncellenen=${updated}, eklenen=${created}, toplam personel=${all.length}`);
  console.table(Object.fromEntries(counts));
}

main().catch((e) => {
  console.error("❌ Atama hatası:", e);
  process.exit(1);
});
