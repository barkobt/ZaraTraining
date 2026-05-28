import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./connection.js";
import { dailyRecords } from "../../../db/schema.js";
import {
  dayTypeFromDate,
  type DayStatus,
  type IpodGrid,
  type ReyonGrid,
  type Weather,
} from "../../../contracts/buenas-dias.js";

/**
 * Bir mağazanın tüm günlük kayıtlarını yeni → eski sırasıyla listele.
 * Faz 0'da sadece sanity-check için kullanılır; ileride
 * tarih aralığı/status filtresi alacak şekilde genişler.
 */
export async function listDays(storeId: number, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(dailyRecords)
    .where(eq(dailyRecords.storeId, storeId))
    .orderBy(desc(dailyRecords.date))
    .limit(limit);
}

/**
 * Tek bir günü tarihiyle getir. Tarih 'YYYY-MM-DD' formatında bekleniyor.
 * Mağaza ID + tarih unique olduğu için en fazla bir satır döner.
 */
export async function getDayByDate(storeId: number, date: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(dailyRecords)
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, date)));
  return row ?? null;
}

/**
 * Sistem hafızası — yeni bir gün açılırken 7 gün önceki GERCEKLESTI kayıttan
 * `ref_*` değerlerini kopyalar. Reyon dağılımı **bilinçli olarak KOPYALANMAZ**
 * (spec §3.6 + §5.1): reyon sorumluları kendi 3 hücrelerini elle girer,
 * sistemin geçmişten tahmin etmesi istenmez (kısa vadede yanlış öğrenme riski).
 *
 * 7 gün önceki kayıt yoksa veya GERCEKLESTI değilse boş ref döner.
 */
export async function getRefFromLastWeek(
  storeId: number,
  date: string,
): Promise<{
  totalAdet: number | null;
  totalTl: number | null;
  visit: number | null;
} | null> {
  const lastWeek = subtractDaysIso(date, 7);
  const db = getDb();
  const [row] = await db
    .select({
      status: dailyRecords.status,
      totalAdet: dailyRecords.actualTotalAdet,
      totalTl: dailyRecords.actualTotalTl,
      visit: dailyRecords.actualVisit,
    })
    .from(dailyRecords)
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, lastWeek)));

  if (!row || row.status !== "GERCEKLESTI") return null;
  return {
    totalAdet: row.totalAdet,
    totalTl: row.totalTl,
    visit: row.visit,
  };
}

function subtractDaysIso(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Bir tarih için kayıt yoksa minimal TASLAK yarat ve 7 gün öncesinden ref'i kopyala.
 * Kayıt zaten varsa olduğu gibi döner — mevcut durum kaybolmaz.
 *
 * `dayType` tarihten türevlenir; `isSpecialDay` çağıran tarafından geçilir
 * (specialDays sorgusu router'da). `weather` default 'normal' — Faz 4'te
 * hava API'siyle güncellenir.
 *
 * Ref kopyalama yalnızca yeni kayıt yaratılırken yapılır (spec §3.6: "yeni bir
 * gün oluşturulduğunda"). Var olan kaydın ref'ine dokunulmaz; manuel düzeltme
 * için ayrı bir uç (`updateRef`) eklenebilir.
 */
export async function ensureDay(
  storeId: number,
  date: string,
  options: { isSpecialDay?: boolean; weather?: import("../../../contracts/buenas-dias.js").Weather } = {},
) {
  const existing = await getDayByDate(storeId, date);
  if (existing) return { day: existing, created: false as const };

  const db = getDb();
  const dayType = dayTypeFromDate(date);
  const ref = await getRefFromLastWeek(storeId, date);

  const [row] = await db
    .insert(dailyRecords)
    .values({
      storeId,
      date,
      status: "TASLAK",
      dayType,
      isSpecialDay: options.isSpecialDay ?? false,
      weather: options.weather ?? "normal",
      refTotalAdet: ref?.totalAdet ?? null,
      refTotalTl: ref?.totalTl ?? null,
      refVisit: ref?.visit ?? null,
      // refReyon kasten null — spec §5.1, reyon sorumluları elle girer.
    })
    .returning();
  return { day: row, created: true as const, refCopiedFrom: ref ? subtractDaysIso(date, 7) : null };
}

// ─── Durum zinciri (spec §3.5) ──────────────────────────────────────────────
// TASLAK → ONAYLANDI → GERCEKLESTI.
// Geçişler: approve (TASLAK→ONAYLANDI), close (ONAYLANDI→GERCEKLESTI),
// unapprove (ONAYLANDI→TASLAK), reopen (GERCEKLESTI→ONAYLANDI).
// Geçerli geçiş matrisi tek bir yerden okunabilsin diye burada deklaratif.

const VALID_TRANSITIONS: Record<DayStatus, DayStatus[]> = {
  TASLAK: ["ONAYLANDI"],
  ONAYLANDI: ["GERCEKLESTI", "TASLAK"], // close veya unapprove
  GERCEKLESTI: ["ONAYLANDI"], // reopen — düzeltme için
};

export class InvalidStatusTransitionError extends Error {
  constructor(from: DayStatus, to: DayStatus) {
    super(`Geçersiz durum geçişi: ${from} → ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

export class DayNotFoundError extends Error {
  constructor(storeId: number, date: string) {
    super(`Gün bulunamadı: storeId=${storeId} date=${date}`);
    this.name = "DayNotFoundError";
  }
}

function assertTransition(from: DayStatus, to: DayStatus) {
  if (from === to) return; // no-op
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

/**
 * TASLAK kaydı yarat veya mevcut TASLAK satırı güncelle. ONAYLANDI/GERCEKLESTI
 * satırların hedefleri buradan değiştirilmez — önce `unapproveDay` çağrılmalı.
 * (Form düzenleme modu yalnızca TASLAK'ta açıktır — spec §6.3.)
 *
 * `dayType` tarihten otomatik türetilir; çağıran override edemez.
 */
export async function upsertDayTargets(input: {
  storeId: number;
  date: string;
  isSpecialDay: boolean;
  weather: Weather;
  targets: {
    totalAdet: number;
    totalTl: number;
    reyon: ReyonGrid;
    ipod: IpodGrid | null;
  };
  ref?: {
    totalAdet?: number | null;
    totalTl?: number | null;
    visit?: number | null;
    reyon?: ReyonGrid | null;
  } | null;
  plannedSint?: number | null;
}) {
  const db = getDb();
  const dayType = dayTypeFromDate(input.date);

  const existing = await getDayByDate(input.storeId, input.date);
  if (existing && existing.status !== "TASLAK") {
    throw new InvalidStatusTransitionError(existing.status as DayStatus, "TASLAK");
  }

  const values = {
    storeId: input.storeId,
    date: input.date,
    status: "TASLAK" as const,
    dayType,
    isSpecialDay: input.isSpecialDay,
    weather: input.weather,
    targetTotalAdet: Math.round(input.targets.totalAdet),
    targetTotalTl: input.targets.totalTl,
    targetReyon: input.targets.reyon,
    targetIpod: input.targets.ipod,
    plannedSint: input.plannedSint ?? null,
    refTotalAdet: input.ref?.totalAdet ?? null,
    refTotalTl: input.ref?.totalTl ?? null,
    refVisit: input.ref?.visit ?? null,
    refReyon: input.ref?.reyon ?? null,
  };

  const [row] = await db
    .insert(dailyRecords)
    .values(values)
    .onConflictDoUpdate({
      target: [dailyRecords.storeId, dailyRecords.date],
      set: {
        // Status'u TASLAK'ta tutuyoruz — yukarıdaki kontrolden geçildiyse zaten TASLAK.
        dayType,
        isSpecialDay: input.isSpecialDay,
        weather: input.weather,
        targetTotalAdet: values.targetTotalAdet,
        targetTotalTl: values.targetTotalTl,
        targetReyon: values.targetReyon,
        targetIpod: values.targetIpod,
        plannedSint: values.plannedSint,
        refTotalAdet: values.refTotalAdet,
        refTotalTl: values.refTotalTl,
        refVisit: values.refVisit,
        refReyon: values.refReyon,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return row;
}

export async function approveDay(storeId: number, date: string) {
  const db = getDb();
  const existing = await getDayByDate(storeId, date);
  if (!existing) throw new DayNotFoundError(storeId, date);
  assertTransition(existing.status as DayStatus, "ONAYLANDI");

  const [row] = await db
    .update(dailyRecords)
    .set({ status: "ONAYLANDI", approvedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, date)))
    .returning();
  return row;
}

export async function unapproveDay(storeId: number, date: string) {
  const db = getDb();
  const existing = await getDayByDate(storeId, date);
  if (!existing) throw new DayNotFoundError(storeId, date);
  assertTransition(existing.status as DayStatus, "TASLAK");

  const [row] = await db
    .update(dailyRecords)
    .set({ status: "TASLAK", approvedAt: null, updatedAt: sql`now()` })
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, date)))
    .returning();
  return row;
}

/**
 * Aktüel veriler — akşam kapanış. `ONAYLANDI` durumunda izinli; TASLAK'ta hata
 * (henüz onaylanmamış bir günün gerçekleşeni anlamlı değil); `GERCEKLESTI`'de de
 * yasak (kümülatife yansımış veri sessizce bozulmasın diye — düzeltmek için
 * önce `reopen`).
 */
export async function setActuals(input: {
  storeId: number;
  date: string;
  actualTotalAdet?: number | null;
  actualTotalTl?: number | null;
  actualVisit?: number | null;
  actualFis?: number | null;
  actualSint?: number | null;
  actualGap?: number | null;
}) {
  const db = getDb();
  const existing = await getDayByDate(input.storeId, input.date);
  if (!existing) throw new DayNotFoundError(input.storeId, input.date);
  if (existing.status !== "ONAYLANDI") {
    throw new InvalidStatusTransitionError(existing.status as DayStatus, "ONAYLANDI");
  }

  // Partial update — null geçenler temizler, undefined geçenler dokunmaz.
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (input.actualTotalAdet !== undefined) patch.actualTotalAdet = input.actualTotalAdet;
  if (input.actualTotalTl !== undefined) patch.actualTotalTl = input.actualTotalTl;
  if (input.actualVisit !== undefined) patch.actualVisit = input.actualVisit;
  if (input.actualFis !== undefined) patch.actualFis = input.actualFis;
  if (input.actualSint !== undefined) patch.actualSint = input.actualSint;
  if (input.actualGap !== undefined) patch.actualGap = input.actualGap;

  const [row] = await db
    .update(dailyRecords)
    .set(patch)
    .where(and(eq(dailyRecords.storeId, input.storeId), eq(dailyRecords.date, input.date)))
    .returning();
  return row;
}

/**
 * `ONAYLANDI` → `GERCEKLESTI`. Kümülatif TL ve kalibrasyon yalnızca bu durumdan
 * beslenir, o yüzden aktüel TL/adet/visit/fis dolu olmadan kapatılamaz
 * (spec §3.5 kritik kuralı).
 *
 * `actual_sint` ve `actual_gap` opsiyonel — boş bırakılabilir.
 *
 * Side effect: status değişiminden sonra `recordCalibrationSample` çağrılır
 * (spec §3.2). Kalibrasyon hata verirse log basar, ana akışı bozmaz.
 */
export async function closeDay(storeId: number, date: string) {
  const db = getDb();
  const existing = await getDayByDate(storeId, date);
  if (!existing) throw new DayNotFoundError(storeId, date);
  assertTransition(existing.status as DayStatus, "GERCEKLESTI");

  const missing: string[] = [];
  if (existing.actualTotalTl == null) missing.push("actualTotalTl");
  if (existing.actualTotalAdet == null) missing.push("actualTotalAdet");
  if (existing.actualVisit == null) missing.push("actualVisit");
  if (existing.actualFis == null) missing.push("actualFis");
  if (missing.length > 0) {
    throw new Error(
      `Gün kapatılamaz — eksik aktüel alanlar: ${missing.join(", ")}. ` +
        `Önce setActuals ile doldur.`,
    );
  }

  const [row] = await db
    .update(dailyRecords)
    .set({ status: "GERCEKLESTI", closedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, date)))
    .returning();

  // Kalibrasyon side effect — spec §3.2. Dynamic import: queries/days.ts ↔
  // queries/calibration.ts arasında circular dependency olmasın diye.
  if (row) {
    const { recordCalibrationSample } = await import("./calibration.js");
    await recordCalibrationSample({
      storeId,
      date,
      actualTotalTl: row.actualTotalTl,
      targetTotalTl: row.targetTotalTl,
      dayType: row.dayType as import("../../../contracts/buenas-dias.js").DayType,
      isSpecialDay: row.isSpecialDay,
      weather: row.weather as import("../../../contracts/buenas-dias.js").Weather,
    });
  }

  return row;
}

/**
 * `GERCEKLESTI` → `ONAYLANDI`. Düzeltme akışı için. Kümülatif otomatik
 * türevlendiği için bu çağrı anında kümülatif TL'den düşer.
 */
export async function reopenDay(storeId: number, date: string) {
  const db = getDb();
  const existing = await getDayByDate(storeId, date);
  if (!existing) throw new DayNotFoundError(storeId, date);
  assertTransition(existing.status as DayStatus, "ONAYLANDI");

  const [row] = await db
    .update(dailyRecords)
    .set({ status: "ONAYLANDI", closedAt: null, updatedAt: sql`now()` })
    .where(and(eq(dailyRecords.storeId, storeId), eq(dailyRecords.date, date)))
    .returning();
  return row;
}
