import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  // Erişim anahtarı — frontend `x-app-password` header'ı ile gönderir
  // (localStorage'daki shift/pusula şifresi). protectedQuery bunu doğrular.
  password: string | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    password: opts.req.headers.get("x-app-password"),
  };
}
