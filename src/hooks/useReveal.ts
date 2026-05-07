import { useEffect, useRef, useState } from "react";

interface UseRevealOptions {
  once?: boolean;
  threshold?: number;
  delay?: number;
  rootMargin?: string;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {}
) {
  const { once = true, threshold = 0.15, delay = 0, rootMargin = "0px 0px -10% 0px" } = options;
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay) {
            const t = setTimeout(() => setRevealed(true), delay);
            if (once) observer.disconnect();
            return () => clearTimeout(t);
          }
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, delay, rootMargin]);

  return { ref, revealed };
}
