import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TrpcContext } from "./context.js";
import { env } from "./lib/env.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      // Zod v4: flatten() field/form errors — frontend bu yapıyı okur.
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

export const createRouter = t.router;
/** Herkese açık procedure — landing/analytics/auth gibi kimlik gerektirmeyenler. */
export const publicQuery = t.procedure;

/**
 * Korumalı procedure — sunucu tarafı erişim kontrolü. `x-app-password` header'ı
 * (ctx.password) env şifrelerinden biriyle eşleşmeli. ÖNCE bu yoktu: şifre yalnız
 * frontend'i koruyordu, API'yi doğrudan çağıran herkes veriyi okuyup yazabiliyordu.
 *
 * Hiç şifre TANIMLI DEĞİLSE (yerel/açık mod) geçişe izin verir — `auth.check`'in
 * "şifre yoksa ok:true" davranışıyla aynı; böylece yerel geliştirme bozulmaz.
 */
const requireAuth = t.middleware(({ ctx, next }) => {
  const configured = env.shiftOrganizerPassword || env.pusulaPassword;
  if (!configured) return next(); // açık mod
  const token = ctx.password;
  const ok =
    (!!env.shiftOrganizerPassword && token === env.shiftOrganizerPassword) ||
    (!!env.pusulaPassword && token === env.pusulaPassword);
  if (!ok) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Geçersiz veya eksik erişim anahtarı.",
    });
  }
  return next();
});

export const protectedQuery = t.procedure.use(requireAuth);
