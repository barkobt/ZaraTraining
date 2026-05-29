import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { trpc } from "@/providers/trpc";

/**
 * Her route değişiminde sayfa görüntüleme kaydı atar (fire-and-forget).
 * Aynı route arka arkaya tetiklenirse (ör. query param değişimi) tekrar
 * göndermemek için son gönderilen path'i ref'te tutar. Hata UI'ı bloklamaz.
 */
export function PageViewTracker() {
  const { pathname } = useLocation();
  const lastSent = useRef<string | null>(null);
  const log = trpc.audit.logPageView.useMutation();

  useEffect(() => {
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;
    log.mutate({
      route: pathname,
      ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
    });
    // log referansı her render'da stabil değil; sadece pathname'e bağlıyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
