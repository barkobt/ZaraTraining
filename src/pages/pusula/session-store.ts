// src/pages/pusula/session-store.ts
// SPA oturumu boyunca yaşayan modül-düzeyi durum — görünüm değişiminde
// (AnimatePresence unmount, Pusula.tsx) koçun işi KAYBOLMASIN diye.
// Bilinçli olarak browser storage YOK (kısıt): sayfa yenilenince sıfırlanır,
// mock demo için doğru davranış. Kullanım: useState yerine usePersistentState(key, init).

import { useCallback, useState, type SetStateAction } from "react";

const stores: Record<string, unknown> = {};

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => (key in stores ? (stores[key] as T) : initial));
  const set = useCallback(
    (a: SetStateAction<T>) => {
      setValue((prev) => {
        const next = typeof a === "function" ? (a as (p: T) => T)(prev) : a;
        stores[key] = next;
        return next;
      });
    },
    [key],
  );
  return [value, set] as const;
}

/** Demo sıfırlama gerekirse (şimdilik UI'dan çağrılmıyor). */
export function resetPusulaSession() {
  for (const k of Object.keys(stores)) delete stores[k];
}
