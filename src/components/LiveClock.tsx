import { useEffect, useState } from "react";

/**
 * Header'da gösterilen monospace canlı saat (HH:MM:SS).
 * Atelier-tarzı, tabular nums.
 */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return (
    <span
      className="font-mono text-[10px] tracking-[0.18em] tabular-nums text-ink/55"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      İSTANBUL · {time}
    </span>
  );
}
