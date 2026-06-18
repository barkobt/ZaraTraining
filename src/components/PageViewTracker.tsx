import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { getSessionId } from "@/lib/session-id";

/**
 * Ürün analitiği toplayıcı (fire-and-forget, UI'ı bloklamaz):
 *  1) Her route değişiminde sayfa görüntüleme + tekil ziyaretçi (sessionId).
 *  2) Anlamlı tıklamaları (buton/link/[data-track]) "click" olayı olarak yazar
 *     → admin'de "en çok tıklanan öğeler" / ısı özeti.
 * Gürültüyü azaltmak için yalnız etkileşimli bir atayı olan tıklamalar loglanır.
 */
export function PageViewTracker() {
  const { pathname } = useLocation();
  const lastSent = useRef<string | null>(null);
  const logView = trpc.audit.logPageView.useMutation();
  const logEvent = trpc.audit.logEvent.useMutation();

  // ── 1) Sayfa görüntüleme ──────────────────────────────────
  useEffect(() => {
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;
    logView.mutate({
      route: pathname,
      sessionId: getSessionId(),
      ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── 2) Tıklama yakalama ───────────────────────────────────
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Etkileşimli atayı bul: açık data-track > buton/link/role=button
      const tracked = target.closest<HTMLElement>("[data-track]");
      const interactive = target.closest<HTMLElement>(
        "button, a, [role='button'], [role='tab'], input[type='submit']",
      );
      const el = tracked ?? interactive;
      if (!el) return; // boş alan tıklaması → gürültü, atla

      const label = elementLabel(el);
      if (!label) return;

      logEvent.mutate({
        sessionId: getSessionId(),
        eventType: "click",
        path: window.location.pathname,
        element: label.slice(0, 120),
        // heatmap için ham koordinat + viewport (ileride ısı render'ı buradan)
        meta: { x: e.clientX, y: e.clientY, vw: window.innerWidth, vh: window.innerHeight },
      });
    }
    // capture: durdurulmuş (stopPropagation) tıklamaları da yakalamak için
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** Tıklanan öğeden okunur, kararlı bir etiket türet (data-track > aria > metin). */
function elementLabel(el: HTMLElement): string {
  const explicit = el.getAttribute("data-track");
  if (explicit) return explicit;
  const aria = el.getAttribute("aria-label") || el.getAttribute("title");
  if (aria) return `${el.tagName.toLowerCase()}:${aria}`;
  const text = el.textContent?.trim().replace(/\s+/g, " ");
  if (text) return `${el.tagName.toLowerCase()}:${text}`;
  return el.tagName.toLowerCase();
}
