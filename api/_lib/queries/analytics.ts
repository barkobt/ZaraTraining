import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { analyticsEvents } from "../../../db/schema.js";

/**
 * Ürün analitiği olay kaydı. `analytics_events` tablosuna yazar (audit_log'dan
 * AYRI — bu "ziyaretçi neyi gördü/tıkladı", audit_log "kim neyi değiştirdi").
 * Fire-and-forget — UI'ı bloklamaz. Kişisel veri yok; sessionId anonim uuid.
 */
export async function logEvent(e: {
  sessionId: string;
  eventType: string; // 'page_view' | 'click' | 'dwell' | …
  path: string;
  element?: string | null;
  meta?: unknown;
  ua?: string | null;
}) {
  const db = getDb();
  await db.insert(analyticsEvents).values({
    sessionId: e.sessionId,
    eventType: e.eventType,
    path: e.path,
    element: e.element ?? null,
    meta: e.meta ?? null,
    userAgent: e.ua ?? null,
  });
}

const PAGE_VIEW = "page_view";
const CLICK = "click";

/** Belirli zamandan beri sayfa görüntüleme sayısı (ham, tekil değil). */
async function viewsSince(since?: Date): Promise<number> {
  const db = getDb();
  const where = since
    ? and(eq(analyticsEvents.eventType, PAGE_VIEW), gte(analyticsEvents.createdAt, since))
    : eq(analyticsEvents.eventType, PAGE_VIEW);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(where);
  return row?.count ?? 0;
}

/** Belirli zamandan beri TEKİL ziyaretçi (distinct session_id) — "kaç kişi". */
async function uniqueSince(since?: Date): Promise<number> {
  const db = getDb();
  const where = since ? gte(analyticsEvents.createdAt, since) : undefined;
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${analyticsEvents.sessionId})::int` })
    .from(analyticsEvents)
    .where(where);
  return row?.count ?? 0;
}

/**
 * Admin paneli analytics özeti. Sayfa görüntüleme (ham) + TEKİL ziyaretçi +
 * günlük trend + en çok gezilen rotalar + en çok tıklanan öğeler.
 */
export async function getAnalyticsStats() {
  const db = getDb();
  const now = Date.now();
  const since7 = new Date(now - 7 * 864e5);
  const since14 = new Date(now - 14 * 864e5);
  const since30 = new Date(now - 30 * 864e5);

  const [total, last7, last30, uniqueTotal, unique7, unique30] = await Promise.all([
    viewsSince(),
    viewsSince(since7),
    viewsSince(since30),
    uniqueSince(),
    uniqueSince(since7),
    uniqueSince(since30),
  ]);

  const dayExpr = sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`;

  const [topRoutes, daily, topElements] = await Promise.all([
    // En çok gezilen rotalar (30g, sayfa görüntüleme)
    db
      .select({ route: analyticsEvents.path, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, PAGE_VIEW), gte(analyticsEvents.createdAt, since30)))
      .groupBy(analyticsEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    // Günlük tekil ziyaretçi trendi (14g) — bar grafik için
    db
      .select({ day: dayExpr, count: sql<number>`count(distinct ${analyticsEvents.sessionId})::int` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since14))
      .groupBy(dayExpr)
      .orderBy(dayExpr),
    // En çok tıklanan öğeler (30g, click) — "sıcaklık" özeti
    db
      .select({ element: analyticsEvents.element, count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, CLICK),
          gte(analyticsEvents.createdAt, since30),
          sql`${analyticsEvents.element} is not null`,
        ),
      )
      .groupBy(analyticsEvents.element)
      .orderBy(desc(sql`count(*)`))
      .limit(15),
  ]);

  return {
    // Sayfa görüntüleme (ham)
    total,
    last7,
    last30,
    // TEKİL ziyaretçi ("kaç kişi")
    uniqueTotal,
    unique7,
    unique30,
    topRoutes: topRoutes.map((r) => ({ route: r.route ?? "(bilinmiyor)", count: r.count })),
    topElements: topElements.map((e) => ({ element: e.element ?? "(bilinmiyor)", count: e.count })),
    daily, // artık tekil ziyaretçi/gün
  };
}
