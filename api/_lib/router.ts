import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { SCORING_TABLE, calculateCabin } from "../../contracts/constants.js";
import { createParticipant, getParticipantById, getAllParticipants } from "./queries/participants.js";

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
});

export type AppRouter = typeof appRouter;
