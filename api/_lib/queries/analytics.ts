import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { auditLog } from "../../../db/schema.js";

/**
 * Site-içi sayfa görüntüleme kaydı. Mevcut audit_log tablosunu kullanır
 * (migration YOK): action="page_view", changes={route, ua}.
 * Fire-and-forget — UI'ı bloklamaz.
 */
export async function logPageView(route: string, ua?: string | null) {
  const db = getDb();
  await db.insert(auditLog).values({
    action: "page_view",
    entityType: "route",
    changes: { route, ua: ua ?? null },
  });
}

const PAGE_VIEW = "page_view";

async function countSince(since?: Date): Promise<number> {
  const db = getDb();
  const where = since
    ? and(eq(auditLog.action, PAGE_VIEW), gte(auditLog.createdAt, since))
    : eq(auditLog.action, PAGE_VIEW);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLog)
    .where(where);
  return row?.count ?? 0;
}

/**
 * Admin paneli analytics özeti: toplam + son 7/30 gün + günlük (14g) + top route'lar.
 */
export async function getAnalyticsStats() {
  const db = getDb();
  const now = Date.now();
  const since7 = new Date(now - 7 * 864e5);
  const since14 = new Date(now - 14 * 864e5);
  const since30 = new Date(now - 30 * 864e5);

  const [total, last7, last30] = await Promise.all([
    countSince(),
    countSince(since7),
    countSince(since30),
  ]);

  const routeExpr = sql<string>`${auditLog.changes} ->> 'route'`;
  const dayExpr = sql<string>`to_char(${auditLog.createdAt}, 'YYYY-MM-DD')`;

  const [topRoutes, daily] = await Promise.all([
    db
      .select({ route: routeExpr, count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(and(eq(auditLog.action, PAGE_VIEW), gte(auditLog.createdAt, since30)))
      .groupBy(routeExpr)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({ day: dayExpr, count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(and(eq(auditLog.action, PAGE_VIEW), gte(auditLog.createdAt, since14)))
      .groupBy(dayExpr)
      .orderBy(dayExpr),
  ]);

  return {
    total,
    last7,
    last30,
    topRoutes: topRoutes.map((r) => ({ route: r.route ?? "(bilinmiyor)", count: r.count })),
    daily,
  };
}
