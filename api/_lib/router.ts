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

const DEFAULT_STORE_ID = 1;

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
});

export type AppRouter = typeof appRouter;
