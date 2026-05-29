import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { SCORING_TABLE, calculateCabin } from "../../contracts/constants.js";
import { createParticipant, getParticipantById, getAllParticipants } from "./queries/participants.js";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  upsertCompetency,
} from "./queries/staff.js";
import {
  getSolverConfig,
  upsertSolverConfig,
  listForbiddenPairs,
  addForbiddenPair,
  removeForbiddenPair,
} from "./queries/solverConfig.js";
import {
  insertChart,
  getChartById,
  listChartsForStore,
  deleteChart,
  updateChartResponsibilities,
} from "./queries/charts.js";
import { getStore, updateStore, getSystemInfo } from "./queries/stores.js";
import { logPageView, getAnalyticsStats } from "./queries/analytics.js";
import { solveShift, pingSolver } from "./solver-client.js";
import { staffRowsToSolverInput } from "./shift-mapping.js";
import { env } from "./lib/env.js";
import {
  listDays,
  getDayByDate,
  upsertDayTargets,
  approveDay,
  unapproveDay,
  setActuals,
  closeDay,
  reopenDay,
  ensureDay,
} from "./queries/days.js";
import {
  calculateCompran,
  calculateProductivity,
  calculateGapFromChanges,
  compareMetric,
  compareGap,
} from "./buenas-dias/derived.js";
import { fetchWeatherToday } from "./buenas-dias/weather.js";
import {
  applyCalibration,
  listPendingCalibrations,
  rejectCalibration,
} from "./queries/calibration.js";
import { COEFFICIENT_TYPE } from "../../contracts/buenas-dias.js";
import { listCoefficients, getEngineCoefficients } from "./queries/coefficients.js";
import {
  findSpecialDay,
  listSpecialDays,
  upsertSpecialDay,
  deleteSpecialDay,
} from "./queries/specialDays.js";
import {
  getActiveChallenge,
  getCumulativeTl,
  listChallenges,
  upsertChallenge,
} from "./queries/challenges.js";
import { calculateDay } from "./buenas-dias/engine-a.js";
import {
  calculateChallenge,
  compareToTarget,
  computeRemainingDays,
} from "./buenas-dias/engine-b.js";
import { getStoreSettings, updateStoreSettings } from "./queries/storeSettings.js";
import {
  dayTypeFromDate,
  REYON,
  URUN_GRUBU,
  WEATHER,
} from "../../contracts/buenas-dias.js";

const DEFAULT_STORE_ID = 1;

// ─── Ortak Buenas Dias Zod şemaları ──────────────────────────────────────────
// Tek bir yerde tanımlanmış grid şemaları — birden fazla uçta yeniden kullanılır.
const reyonGridSchema = z.object(
  Object.fromEntries(
    REYON.map((r) => [
      r,
      z.object(
        Object.fromEntries(
          URUN_GRUBU.map((u) => [u, z.number().nonnegative()]),
        ) as Record<(typeof URUN_GRUBU)[number], z.ZodNumber>,
      ),
    ]),
  ) as Record<
    (typeof REYON)[number],
    z.ZodObject<Record<(typeof URUN_GRUBU)[number], z.ZodNumber>>
  >,
);

const ipodGridSchema = z.object({
  kadin: z.number().nonnegative(),
  erkek: z.number().nonnegative(),
  cocuk: z.number().nonnegative(),
  kasa: z.number().nonnegative(),
});

const shiftInputSchema = z.object({
  short_name: z.string().min(1, { message: "Personel kısaltması boş olamaz" }),
  // Yarım saat destekli: 10.5 = 10:30. Backend (domain.py) zaten float kabul ediyor;
  // .multipleOf(0.5) yalnızca tam/yarım saat ızgarasına izin verir (10.25 reddedilir).
  start_hour: z
    .number()
    .multipleOf(0.5, { message: "Başlangıç saati tam veya yarım saat olmalı" })
    .min(0, { message: "Başlangıç saati 0-23:30 arası olmalı" })
    .max(23.5, { message: "Başlangıç saati 0-23:30 arası olmalı" }),
  end_hour: z
    .number()
    .multipleOf(0.5, { message: "Bitiş saati tam veya yarım saat olmalı" })
    .min(1, { message: "Bitiş saati 1-24 arası olmalı" })
    .max(24, { message: "Bitiş saati 1-24 arası olmalı" }),
  breaks: z.array(z.tuple([z.number(), z.number()])).optional(),
  tasks: z.array(z.tuple([z.number().int(), z.string()])).optional(),
});

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  auth: createRouter({
    required: publicQuery.query(() => ({ required: !!env.shiftOrganizerPassword })),
    check: publicQuery
      .input(z.object({ token: z.string().min(1).max(200) }))
      .mutation(({ input }) => {
        if (!env.shiftOrganizerPassword) return { ok: true };
        return { ok: input.token === env.shiftOrganizerPassword };
      }),
  }),

  // Site-içi sayfa görüntüleme analitiği. Mevcut audit_log tablosunu yeniden
  // kullanır (DB migration YOK): logPageView fire-and-forget yazar, stats okur.
  audit: createRouter({
    logPageView: publicQuery
      .input(z.object({ route: z.string().min(1).max(300), ua: z.string().max(500).optional() }))
      .mutation(async ({ input }) => {
        await logPageView(input.route, input.ua ?? null);
        return { ok: true };
      }),
    stats: publicQuery.query(async () => getAnalyticsStats()),
  }),

  participant: createRouter({
    submit: publicQuery
      .input(
        z.object({
          name: z.string().min(1).max(255),
          answers: z.record(z.string(), z.string()),
        })
      )
      .mutation(async ({ input }) => {
        let totalScore = 0;
        for (let i = 0; i < SCORING_TABLE.length; i++) {
          const answer = input.answers[String(i + 1)];
          if (answer && SCORING_TABLE[i][answer] !== undefined) {
            totalScore += SCORING_TABLE[i][answer];
          }
        }
        const cabinInfo = calculateCabin(totalScore);
        const result = await createParticipant({
          name: input.name,
          answers: input.answers,
          totalScore,
          cabin: cabinInfo.cabin,
        });
        const insertId = result?.id ?? 0;
        return {
          id: insertId,
          name: input.name,
          totalScore,
          cabin: cabinInfo.cabin,
          cabinName: cabinInfo.cabinName,
          label: cabinInfo.label,
          description: cabinInfo.description,
          longText: cabinInfo.longText,
        };
      }),

    getById: publicQuery
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const p = await getParticipantById(input.id);
        if (!p) return null;
        const cabinInfo = calculateCabin(p.totalScore);
        return {
          id: p.id,
          name: p.name,
          totalScore: p.totalScore,
          cabin: p.cabin,
          cabinName: cabinInfo.cabinName,
          label: cabinInfo.label,
          description: cabinInfo.description,
          longText: cabinInfo.longText,
        };
      }),
  }),

  admin: createRouter({
    list: publicQuery.query(async () => {
      const all = await getAllParticipants();
      return all.map((p) => {
        const cabinInfo = calculateCabin(p.totalScore);
        return {
          id: p.id,
          name: p.name,
          totalScore: p.totalScore,
          cabin: p.cabin,
          cabinName: cabinInfo.cabinName,
          label: cabinInfo.label,
          createdAt: p.createdAt,
        };
      });
    }),

    stats: publicQuery.query(async () => {
      const all = await getAllParticipants();
      const stats = {
        total: all.length,
        baslangic: 0,
        gelisim: 0,
        altin: 0,
        avgScore: 0,
      };
      let totalScoreSum = 0;
      for (const p of all) {
        stats[p.cabin as keyof typeof stats]++;
        totalScoreSum += p.totalScore;
      }
      if (all.length > 0) {
        stats.avgScore = Math.round((totalScoreSum / all.length) * 10) / 10;
      }
      return stats;
    }),
  }),

  staff: createRouter({
    list: publicQuery
      .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => {
        return listStaff(input?.storeId ?? DEFAULT_STORE_ID);
      }),

    create: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          fullName: z.string().min(1).max(100),
          shortName: z.string().min(1).max(30),
          tenureLevel: z.string().min(1).max(20),
          isManager: z.boolean().optional(),
          note: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const row = await createStaff({
          storeId: input.storeId ?? DEFAULT_STORE_ID,
          fullName: input.fullName,
          shortName: input.shortName,
          tenureLevel: input.tenureLevel,
          isManager: input.isManager ?? false,
          note: input.note ?? null,
        });
        return row;
      }),

    update: publicQuery
      .input(
        z.object({
          id: z.number().int().positive(),
          fullName: z.string().min(1).max(100).optional(),
          shortName: z.string().min(1).max(30).optional(),
          tenureLevel: z.string().min(1).max(20).optional(),
          isManager: z.boolean().optional(),
          isBlacklisted: z.boolean().optional(),
          note: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...patch } = input;
        return updateStaff(id, patch);
      }),

    delete: publicQuery
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteStaff(input.id);
        return { ok: true };
      }),
  }),

  competency: createRouter({
    update: publicQuery
      .input(
        z.object({
          staffId: z.number().int().positive(),
          role: z.string().min(1).max(20),
          level: z.number().int().min(0).max(4),
        }),
      )
      .mutation(async ({ input }) => {
        await upsertCompetency(input.staffId, input.role, input.level);
        return { ok: true };
      }),
  }),

  solverConfig: createRouter({
    get: publicQuery
      .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => {
        return getSolverConfig(input?.storeId ?? DEFAULT_STORE_ID);
      }),

    update: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          competencyWeight: z.number().optional(),
          fairnessWeight: z.number().optional(),
          managerMorningPenalty: z.number().int().optional(),
          managerNormalPenalty: z.number().int().optional(),
          dualPenalty: z.number().int().optional(),
          sprinterDualPenalty: z.number().int().optional(),
          buddyViolationPenalty: z.number().int().optional(),
          maxConsecutiveHours: z.number().int().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { storeId, ...patch } = input;
        return upsertSolverConfig(storeId ?? DEFAULT_STORE_ID, patch);
      }),

    forbiddenPairs: publicQuery
      .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => {
        return listForbiddenPairs(input?.storeId ?? DEFAULT_STORE_ID);
      }),

    addForbiddenPair: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          roleA: z.string().min(1).max(20),
          roleB: z.string().min(1).max(20),
        }),
      )
      .mutation(async ({ input }) => {
        await addForbiddenPair(
          input.storeId ?? DEFAULT_STORE_ID,
          input.roleA,
          input.roleB,
        );
        return { ok: true };
      }),

    removeForbiddenPair: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          roleA: z.string().min(1).max(20),
          roleB: z.string().min(1).max(20),
        }),
      )
      .mutation(async ({ input }) => {
        await removeForbiddenPair(
          input.storeId ?? DEFAULT_STORE_ID,
          input.roleA,
          input.roleB,
        );
        return { ok: true };
      }),
  }),

  chart: createRouter({
    ping: publicQuery.query(async () => pingSolver()),

    generate: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          shiftDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, {
              message: "Geçerli bir tarih seçin (YYYY-AA-GG)",
            }),
          hours: z
            .array(z.number().int().min(0).max(23))
            .min(1, { message: "Açılış saati kapanıştan küçük olmalı" }),
          shifts: z
            .array(shiftInputSchema)
            .min(1, { message: "Çözüme dahil en az 1 personel olmalı" }),
          timeLimitSeconds: z.number().int().min(1).max(120).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const storeId = input.storeId ?? DEFAULT_STORE_ID;

        const [staffRows, cfg] = await Promise.all([
          listStaff(storeId),
          getSolverConfig(storeId),
        ]);

        if (staffRows.length === 0) {
          throw new Error("No staff in DB for this store. Seed first.");
        }

        const solverStaff = staffRowsToSolverInput(staffRows);
        const solverConfigPayload = {
          // Yetkinlik 2.0 → 4.0: yetkin kişiler doğru role daha güçlü yerleşsin.
          competency_weight: cfg?.competencyWeight ?? 4.0,
          fairness_weight: cfg?.fairnessWeight ?? 0.3,
          max_consecutive_hours: cfg?.maxConsecutiveHours ?? 4,
          // Vercel fonksiyon duvarı 30s (vercel.json maxDuration). Best-of-N
          // solver ~12s bütçe + ~3s DB/overhead = ~15s, 30s'in altında güvenli.
          time_limit_seconds: input.timeLimitSeconds ?? 12,
        };

        // DB'deki Settings → Yasaklar UI'ından gelen rol çiftleri solver'a iletilir.
        const userForbidden = await listForbiddenPairs(storeId);

        const solveReq = {
          shift_date: input.shiftDate,
          hours: input.hours,
          staff: solverStaff,
          shifts: input.shifts.map((s) => ({
            short_name: s.short_name,
            start_hour: s.start_hour,
            end_hour: s.end_hour,
            breaks: s.breaks ?? [],
            tasks: s.tasks ?? [],
          })),
          config: solverConfigPayload,
          forbidden_pairs: userForbidden.map(
            (p) => [p.roleA, p.roleB] as [string, string],
          ),
        };

        const solveRes = await solveShift(solveReq);

        const saved = await insertChart({
          storeId,
          shiftDate: input.shiftDate,
          shiftData: { hours: input.hours, shifts: input.shifts },
          chartData: solveRes.chart,
          qualityScore: solveRes.quality_score,
          configSnapshot: solverConfigPayload,
          status: solveRes.status,
        });

        return {
          chartId: saved?.id ?? null,
          responsibilities: (saved?.responsibilities as Record<string, string> | null) ?? null,
          status: solveRes.status,
          qualityScore: solveRes.quality_score,
          warnings: solveRes.warnings,
          errors: solveRes.errors,
          elapsedSeconds: solveRes.elapsed_seconds,
          chart: solveRes.chart,
        };
      }),

    getById: publicQuery
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => getChartById(input.id)),

    list: publicQuery
      .input(
        z
          .object({
            storeId: z.number().int().positive().optional(),
            limit: z.number().int().min(1).max(200).optional(),
          })
          .optional(),
      )
      .query(async ({ input }) =>
        listChartsForStore(input?.storeId ?? DEFAULT_STORE_ID, input?.limit ?? 50),
      ),

    delete: publicQuery
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteChart(input.id);
        return { ok: true };
      }),

    updateResponsibilities: publicQuery
      .input(
        z.object({
          id: z.number().int().positive(),
          responsibilities: z.record(z.string(), z.string().nullable()),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await updateChartResponsibilities(
          input.id,
          input.responsibilities,
        );
        return { ok: true, responsibilities: result };
      }),
  }),

  store: createRouter({
    get: publicQuery
      .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => getStore(input?.storeId ?? DEFAULT_STORE_ID)),

    update: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          code: z.string().min(1).max(10).optional(),
          name: z.string().min(1).max(100).optional(),
          section: z.string().min(1).max(20).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { storeId, ...patch } = input;
        return updateStore(storeId ?? DEFAULT_STORE_ID, patch);
      }),
  }),

  system: createRouter({
    info: publicQuery
      .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
      .query(async ({ input }) => {
        const dbInfo = await getSystemInfo(input?.storeId ?? DEFAULT_STORE_ID);
        return {
          ...dbInfo,
          solverUrl: process.env.SHIFT_SOLVER_URL ? "configured" : "missing",
          authRequired: !!env.shiftOrganizerPassword,
        };
      }),
  }),

  // Buenas Dias modülü.
  // Faz 0: ping, days.list/getByDate.
  // Faz 1: days.calculate (Motor A), coefficients.list, specialDays.list/find.
  // Faz 2+: challenge.*, days.approve/close, calibration.*.
  buenasDias: createRouter({
    ping: publicQuery.query(() => ({ ok: true, module: "buenas-dias", ts: Date.now() })),

    days: createRouter({
      list: publicQuery
        .input(
          z
            .object({
              storeId: z.number().int().positive().optional(),
              limit: z.number().int().min(1).max(200).optional(),
            })
            .optional(),
        )
        .query(async ({ input }) =>
          listDays(input?.storeId ?? DEFAULT_STORE_ID, input?.limit ?? 50),
        ),

      getByDate: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
              message: "Tarih YYYY-AA-GG formatında olmalı",
            }),
          }),
        )
        .query(async ({ input }) =>
          getDayByDate(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      /**
       * Sabah akışı kapısı — bir tarih için kayıt yoksa TASLAK yarat ve
       * 7 gün önceki GERCEKLESTI kayıttan ref_* alanlarını kopyala.
       * Var olan kayıt etkilenmez. Spec §3.6 + §4.1.
       *
       * isSpecialDay otomatik (specialDays sorgusu). weather şimdilik 'normal'.
       */
      ensure: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .mutation(async ({ input }) => {
          const storeId = input.storeId ?? DEFAULT_STORE_ID;
          // Spec §4.1: yeni gün açılırken bağlam otomatik dolar — özel gün
          // takviminden ve hava durumu API'sinden. Hava başarısız olursa 'normal'.
          const [sd, settings] = await Promise.all([
            findSpecialDay(storeId, input.date),
            getStoreSettings(storeId),
          ]);
          // Hava durumu yalnızca BUGÜN için çekilir; ileri/geri tarihler için 'normal'.
          // (Open-Meteo geçmiş veri için ayrı uç gerektirir; gelecek değişen
          // tahminden ötürü açılışta sabitlemek istemiyoruz — kullanıcı override eder.)
          // "Bugün" Türkiye lokali — UTC'den hesaplarsak gece yarısı civarı sapar.
          const todayIso = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/Istanbul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());
          let weather: import("../../contracts/buenas-dias.js").Weather = "normal";
          if (input.date === todayIso) {
            const w = await fetchWeatherToday(settings.city);
            weather = w.weather;
          }
          return ensureDay(storeId, input.date, {
            isSpecialDay: sd !== null,
            weather,
          });
        }),

      /**
       * Akşam çıktısı — aktüel verilerden Compran, Productivity, Gap hesabı +
       * Store hedefleriyle karşılaştırma. Spec §3.4.
       *
       * Aktüel alanlar henüz girilmediyse ilgili metrik null döner; UI "—" gösterir.
       */
      derived: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .query(async ({ input }) => {
          const storeId = input.storeId ?? DEFAULT_STORE_ID;
          const day = await getDayByDate(storeId, input.date);
          const settings = await getStoreSettings(storeId);

          const compran = calculateCompran(day?.actualFis ?? null, day?.actualVisit ?? null);
          const productivity = calculateProductivity(
            day?.actualTotalAdet ?? null,
            day?.actualSint ?? null,
          );

          return {
            date: input.date,
            storeId,
            status: day?.status ?? null,
            compran: compareMetric(compran, settings.compranTarget),
            productivity: compareMetric(productivity, settings.productivityTarget),
            gap: compareGap(day?.actualGap ?? null, settings.gapTarget),
            // Ham aktüel veriler (UI'da debug/info için).
            actuals: day
              ? {
                  totalAdet: day.actualTotalAdet,
                  totalTl: day.actualTotalTl,
                  visit: day.actualVisit,
                  fis: day.actualFis,
                  sint: day.actualSint,
                  gap: day.actualGap,
                }
              : null,
          };
        }),

      /**
       * Inline-edit canlı recalc için atomik uç: Motor A çalıştır + DB'ye yaz
       * + güncel kaydı dön. Frontend her hücre değişiminde (debounce'lu) bunu çağırır.
       *
       * Yalnızca TASLAK'ta çalışır — `upsertDayTargets` zaten bunu kontrol ediyor.
       * Şu an ref_reyon kullanılarak Motor A çalışır; target_reyon yeniden türevlenir.
       *
       * Faz 4b.
       */
      calculateAndSave: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            ref: z.object({
              totalAdet: z.number().nonnegative(),
              totalTl: z.number().nonnegative(),
              visit: z.number().nonnegative().nullable().optional(),
              reyon: reyonGridSchema,
              ipod: ipodGridSchema.optional(),
            }),
            weatherOverride: z.enum(WEATHER).optional(),
            plannedSint: z.number().positive().nullable().optional(),
          }),
        )
        .mutation(async ({ input }) => {
          const storeId = input.storeId ?? DEFAULT_STORE_ID;

          // Bağlam: dayType tarihten, isSpecialDay specialDays'ten,
          // weather DB'deki kayıttan veya override'dan.
          const [sd, existing, coefs] = await Promise.all([
            findSpecialDay(storeId, input.date),
            getDayByDate(storeId, input.date),
            getEngineCoefficients(),
          ]);

          const dayType = dayTypeFromDate(input.date);
          const isSpecialDay = sd !== null;
          const weather =
            input.weatherOverride ??
            ((existing?.weather as import("../../contracts/buenas-dias.js").Weather) ?? "normal");

          // Motor A.
          const out = calculateDay({
            ref: input.ref,
            ctx: {
              dayType,
              isSpecialDay,
              specialDayCoefficient: sd?.coefficient,
              weather,
            },
            coefs,
            plannedSint: input.plannedSint ?? undefined,
          });

          // Persist — TASLAK olmayan gün hata fırlatır (upsertDayTargets içinde).
          const saved = await upsertDayTargets({
            storeId,
            date: input.date,
            isSpecialDay,
            weather,
            targets: {
              totalAdet: out.targetTotalAdet,
              totalTl: out.targetTotalTl,
              reyon: out.targetReyon,
              ipod: out.targetIpod,
            },
            ref: {
              totalAdet: input.ref.totalAdet,
              totalTl: input.ref.totalTl,
              visit: input.ref.visit ?? null,
              reyon: input.ref.reyon,
            },
            plannedSint: input.plannedSint ?? null,
          });

          return {
            day: saved,
            breakdowns: out.breakdowns,
            productivityBeklenen: out.productivityBeklenen,
            context: {
              dayType,
              isSpecialDay,
              specialDayName: sd?.name ?? null,
              specialDayCoefficient: sd?.coefficient ?? null,
              weather,
            },
          };
        }),

      // Motor A önizleme — referans veri girilince hedefleri üretir.
      // DB'ye YAZMAZ; sadece bir hesap çıktısı + breakdown döner.
      // Spec §3.1. Faz 3'te `upsert` ucu ayrı eklenecek (TASLAK kaydı yaratır).
      calculate: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
              message: "Tarih YYYY-AA-GG formatında olmalı",
            }),
            ref: z.object({
              totalAdet: z.number().nonnegative(),
              totalTl: z.number().nonnegative(),
              reyon: reyonGridSchema,
              ipod: ipodGridSchema.optional(),
            }),
            weatherOverride: z.enum(WEATHER).optional(),
            plannedSint: z.number().positive().optional(),
          }),
        )
        .mutation(async ({ input }) => {
          const storeId = input.storeId ?? DEFAULT_STORE_ID;

          // Bağlamı çıkar.
          const dayType = dayTypeFromDate(input.date);
          const sd = await findSpecialDay(storeId, input.date);
          const isSpecialDay = sd !== null;

          // Katsayıları DB'den çek.
          const coefs = await getEngineCoefficients();

          const out = calculateDay({
            ref: input.ref,
            ctx: {
              dayType,
              isSpecialDay,
              specialDayCoefficient: sd?.coefficient,
              weather: input.weatherOverride ?? "normal",
            },
            coefs,
            plannedSint: input.plannedSint,
          });

          return {
            date: input.date,
            storeId,
            context: {
              dayType,
              isSpecialDay,
              specialDayName: sd?.name ?? null,
              specialDayCoefficient: sd?.coefficient ?? null,
              weather: input.weatherOverride ?? "normal",
            },
            coefficientsUsed: coefs,
            targets: {
              totalAdet: out.targetTotalAdet,
              totalTl: out.targetTotalTl,
              reyon: out.targetReyon,
              ipod: out.targetIpod,
              productivityBeklenen: out.productivityBeklenen,
            },
            // Şeffaflık katmanı — UI tooltip'lerde kullanılır.
            breakdowns: out.breakdowns,
          };
        }),
    }),

    coefficients: createRouter({
      list: publicQuery.query(async () => listCoefficients()),
    }),

    // Kalibrasyon önerileri (spec §3.2 + §4.4).
    // Not: tRPC `apply`/`reject` adlarını rezerve kabul ediyor (Function.prototype'la
    // çakışıyor), o yüzden `accept`/`dismiss` kullanıyoruz.
    calibration: createRouter({
      // Bekleyen öneriler — UI üst çubukta gösterir.
      pending: publicQuery.query(async () => listPendingCalibrations()),

      // Yöneticinin onayı: currentValue = lastSuggestedValue, örnekler arşivlenir.
      accept: publicQuery
        .input(z.object({ type: z.enum(COEFFICIENT_TYPE) }))
        .mutation(async ({ input }) => applyCalibration(input.type)),

      // "Şimdilik kalsın": currentValue korunur, lastSuggestedValue null'a çekilir.
      dismiss: publicQuery
        .input(z.object({ type: z.enum(COEFFICIENT_TYPE) }))
        .mutation(async ({ input }) => rejectCalibration(input.type)),
    }),

    // Buenas Dias mağaza ayarları (compran/gap/productivity hedefleri, stretch vb.).
    // Faz 5'in setup ekranı bu uçları çağırır — şimdilik test/sanity için yeterli.
    settings: createRouter({
      get: publicQuery
        .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => getStoreSettings(input?.storeId ?? DEFAULT_STORE_ID)),

      update: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            compranTarget: z.number().min(0).max(1).optional(), // oran (0-1)
            gapTarget: z.number().optional(), // negatif olabilir
            productivityTarget: z.number().min(0).optional(),
            defaultStretch: z.number().min(0).max(1).optional(),
            weekendWeight: z.number().positive().optional(),
            weekendDayFactor: z.number().positive().optional(),
            city: z.string().min(1).max(100).optional(),
          }),
        )
        .mutation(async ({ input }) => {
          const { storeId, ...patch } = input;
          return updateStoreSettings(storeId ?? DEFAULT_STORE_ID, patch);
        }),
    }),

    specialDays: createRouter({
      list: publicQuery
        .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => listSpecialDays(input?.storeId ?? DEFAULT_STORE_ID)),

      find: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .query(async ({ input }) =>
          findSpecialDay(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      upsert: publicQuery
        .input(
          z.object({
            id: z.number().int().positive().optional(),
            storeId: z.number().int().positive().optional(),
            name: z.string().min(1).max(100),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            coefficient: z.number().positive(),
          }),
        )
        .mutation(async ({ input }) =>
          upsertSpecialDay({
            id: input.id,
            storeId: input.storeId ?? DEFAULT_STORE_ID,
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            coefficient: input.coefficient,
          }),
        ),

      delete: publicQuery
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => deleteSpecialDay(input.id)),
    }),

    // Aylık challenge'lar — setup ekranı + Motor B veri kaynağı.
    challenges: createRouter({
      list: publicQuery
        .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => listChallenges(input?.storeId ?? DEFAULT_STORE_ID)),

      getActive: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .query(async ({ input }) =>
          getActiveChallenge(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      upsert: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            month: z.string().regex(/^\d{4}-\d{2}$/, {
              message: "Ay YYYY-AA formatında olmalı",
            }),
            tier1TargetTl: z.number().positive(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            avgBasketTl: z.number().positive().nullable().optional(),
          }),
        )
        .mutation(async ({ input }) =>
          upsertChallenge({
            storeId: input.storeId ?? DEFAULT_STORE_ID,
            month: input.month,
            tier1TargetTl: input.tier1TargetTl,
            startDate: input.startDate,
            endDate: input.endDate,
            avgBasketTl: input.avgBasketTl ?? null,
          }),
        ),
    }),

    // Motor B — challenge durum panosu. İki tier paralel.
    // Spec §3.3 + Motor A↔B karşılaştırma rozeti.
    challenge: createRouter({
      status: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .query(async ({ input }) => {
          const storeId = input.storeId ?? DEFAULT_STORE_ID;
          const today = input.today;

          const challenge = await getActiveChallenge(storeId, today);
          if (!challenge) return { active: false as const, today };

          const settings = await getStoreSettings(storeId);
          const cumulativeTl = await getCumulativeTl(
            storeId,
            challenge.startDate,
            challenge.endDate,
          );
          const remainingDays = computeRemainingDays(today, challenge.endDate);

          // İki tier için ayrı hesap.
          const tier1 = calculateChallenge({
            tierTargetTl: challenge.tier1TargetTl,
            cumulativeTl,
            remainingDays,
            today,
            weekendWeight: settings.weekendWeight,
            avgBasketTl: challenge.avgBasketTl,
          });
          const tier2 = calculateChallenge({
            tierTargetTl: challenge.tier2TargetTl,
            cumulativeTl,
            remainingDays,
            today,
            weekendWeight: settings.weekendWeight,
            avgBasketTl: challenge.avgBasketTl,
          });

          // Motor A ↔ B rozeti — bugünün DailyRecord'unda target_total_tl varsa.
          const day = await getDayByDate(storeId, today);
          const motorATargetTotalTl = day?.targetTotalTl ?? null;
          const tier1Compare = compareToTarget({
            motorATargetTotalTl,
            motorBTodayRequiredTl: tier1.todayRequiredTl,
          });
          const tier2Compare = compareToTarget({
            motorATargetTotalTl,
            motorBTodayRequiredTl: tier2.todayRequiredTl,
          });

          return {
            active: true as const,
            today,
            challenge: {
              month: challenge.month,
              startDate: challenge.startDate,
              endDate: challenge.endDate,
              tier1TargetTl: challenge.tier1TargetTl,
              tier2TargetTl: challenge.tier2TargetTl,
              avgBasketTl: challenge.avgBasketTl,
            },
            cumulativeTl,
            remainingDaysCount: remainingDays.length,
            tier1: { ...tier1, compare: tier1Compare },
            tier2: { ...tier2, compare: tier2Compare },
            motorATargetTotalTl,
          };
        }),
    }),

    // Durum zinciri mutation'ları (spec §3.5).
    // Bu uçlar `days` sub-router'ına eklendi.
    daysMutations: createRouter({
      // Mevcut TASLAK'ı upsert et — Motor A çıktısını kalıcı kaydet.
      // `calculate` salt-okunur idi; bu uç DB'ye YAZAR.
      upsertTargets: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            isSpecialDay: z.boolean(),
            weather: z.enum(WEATHER),
            targets: z.object({
              totalAdet: z.number().nonnegative(),
              totalTl: z.number().nonnegative(),
              reyon: reyonGridSchema,
              ipod: ipodGridSchema.nullable(),
            }),
            ref: z
              .object({
                totalAdet: z.number().nonnegative().nullable().optional(),
                totalTl: z.number().nonnegative().nullable().optional(),
                visit: z.number().nonnegative().nullable().optional(),
                reyon: reyonGridSchema.nullable().optional(),
              })
              .nullable()
              .optional(),
            plannedSint: z.number().positive().nullable().optional(),
          }),
        )
        .mutation(async ({ input }) =>
          upsertDayTargets({
            storeId: input.storeId ?? DEFAULT_STORE_ID,
            date: input.date,
            isSpecialDay: input.isSpecialDay,
            weather: input.weather,
            targets: input.targets,
            ref: input.ref ?? null,
            plannedSint: input.plannedSint ?? null,
          }),
        ),

      approve: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .mutation(async ({ input }) =>
          approveDay(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      unapprove: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .mutation(async ({ input }) =>
          unapproveDay(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      setActuals: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            actualTotalAdet: z.number().nonnegative().nullable().optional(),
            actualTotalTl: z.number().nonnegative().nullable().optional(),
            actualVisit: z.number().nonnegative().nullable().optional(),
            actualFis: z.number().nonnegative().nullable().optional(),
            actualSint: z.number().positive().nullable().optional(),
            actualGap: z.number().nullable().optional(), // Gap negatif olabilir
          }),
        )
        .mutation(async ({ input }) =>
          setActuals({
            storeId: input.storeId ?? DEFAULT_STORE_ID,
            date: input.date,
            actualTotalAdet: input.actualTotalAdet,
            actualTotalTl: input.actualTotalTl,
            actualVisit: input.actualVisit,
            actualFis: input.actualFis,
            actualSint: input.actualSint,
            actualGap: input.actualGap,
          }),
        ),

      close: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .mutation(async ({ input }) =>
          closeDay(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),

      reopen: publicQuery
        .input(
          z.object({
            storeId: z.number().int().positive().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .mutation(async ({ input }) =>
          reopenDay(input.storeId ?? DEFAULT_STORE_ID, input.date),
        ),
    }),

    // Hava durumu — Open-Meteo'dan bugünün durumu, sunny/normal/bad'e mapli.
    weather: createRouter({
      today: publicQuery
        .input(z.object({ storeId: z.number().int().positive().optional() }).optional())
        .query(async ({ input }) => {
          const settings = await getStoreSettings(input?.storeId ?? DEFAULT_STORE_ID);
          return fetchWeatherToday(settings.city);
        }),
    }),

    // Saf yardımcılar — DB'ye dokunmaz, sadece UI'a yorum kolaylığı sağlar.
    helpers: createRouter({
      /**
       * Kullanıcı Zara uygulamasından "visit %" ve "satış %" alıp giriyorsa
       * Gap'i tek sayı olarak elle girmek zorunda kalmasın. Spec §3.4.
       * Saf hesap: Gap = satış% − visit%.
       */
      gapFromChanges: publicQuery
        .input(
          z.object({
            visitChangePct: z.number(),
            satisChangePct: z.number(),
          }),
        )
        .query(({ input }) => {
          const gap = calculateGapFromChanges(input.visitChangePct, input.satisChangePct);
          return { gap, visitChangePct: input.visitChangePct, satisChangePct: input.satisChangePct };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
