// Anonim ziyaretçi kimliği — tekil ziyaretçi ("kaç kişi") sayımı için.
// localStorage'da kalıcı rastgele uuid. KİŞİSEL VERİ DEĞİL: hiçbir isim/e-posta
// ile bağlı değil, yalnızca aynı tarayıcıyı tekrar ziyaretlerde eşleştirir.
// localStorage erişilemezse (gizli sekme/eski tarayıcı) oturumluk bellek-içi
// kimliğe düşer — sayım yine çalışır, sadece kalıcı olmaz.

const KEY = "za_sid";
let memoryFallback: string | null = null;

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* randomUUID yoksa aşağıya düş */
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = makeId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // localStorage kapalı → oturum boyunca sabit bellek kimliği
    if (!memoryFallback) memoryFallback = makeId();
    return memoryFallback;
  }
}
