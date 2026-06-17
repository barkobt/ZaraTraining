import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/_lib/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      // Korumalı procedure'lar için erişim anahtarı: localStorage'daki shift veya
      // pusula şifresi `x-app-password` header'ı ile gider. Sunucu protectedQuery'de
      // doğrular. Public procedure'lar (landing/analytics) header'ı yok sayar.
      headers() {
        try {
          const token =
            localStorage.getItem("shift_organizer_auth_v1") ||
            localStorage.getItem("pusula_auth_v1");
          return token ? { "x-app-password": token } : {};
        } catch {
          return {};
        }
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
