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
} from "./queries/solverConfig.js";
import { insertChart, getChartById, listChartsForStore } from "./queries/charts.js";
import { solveShift, pingSolver } from "./solver-client.js";
import { staffRowsToSolverInput } from "./shift-mapping.js";

const DEFAULT_STORE_ID = 1;

const shiftInputSchema = z.object({
  short_name: z.string().min(1),
  start_hour: z.number().int().min(0).max(23),
  end_hour: z.number().int().min(1).max(24),
  breaks: z.array(z.tuple([z.number(), z.number()])).optional(),
});

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

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
  }),

  chart: createRouter({
    ping: publicQuery.query(async () => pingSolver()),

    generate: publicQuery
      .input(
        z.object({
          storeId: z.number().int().positive().optional(),
          shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          hours: z.array(z.number().int().min(0).max(23)).min(1),
          shifts: z.array(shiftInputSchema).min(1),
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
          competency_weight: cfg?.competencyWeight ?? 3.0,
          fairness_weight: cfg?.fairnessWeight ?? 0.5,
          max_consecutive_hours: cfg?.maxConsecutiveHours ?? 2,
          time_limit_seconds: input.timeLimitSeconds ?? 30,
        };

        const solveReq = {
          shift_date: input.shiftDate,
          hours: input.hours,
          staff: solverStaff,
          shifts: input.shifts.map((s) => ({
            short_name: s.short_name,
            start_hour: s.start_hour,
            end_hour: s.end_hour,
            breaks: s.breaks ?? [],
          })),
          config: solverConfigPayload,
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
  }),
});

export type AppRouter = typeof appRouter;
