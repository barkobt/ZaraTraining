import { Award, BookOpen, Check, AlertCircle } from "lucide-react";
import type { TopicStatus } from "../types-gelisim";
import { pick } from "../i18n";

/**
 * Konu öğrenme durumu — ETİKETLİ ve SIRALI (gelişim akışı):
 * Teorik → Yapabiliyor → Geliştirilmeli → Öğretebilir. İsimler görünür.
 * Renkler bizim palet (ink · sage · gold). Aynı duruma tekrar dokununca "Boş".
 */
const ORDER: Array<Exclude<TopicStatus, "Boş">> = ["Teorik", "Yapabiliyor", "Geliştirilmeli", "Öğretebilir"];

const META: Record<
  Exclude<TopicStatus, "Boş">,
  { label: () => string; color: string; Icon: typeof Check }
> = {
  Teorik: { label: () => pick({ tr: "Teorik", en: "Theory", es: "Teórico" }), color: "var(--zara-ink-soft)", Icon: BookOpen },
  Yapabiliyor: { label: () => pick({ tr: "Yapabiliyor", en: "Can do", es: "Lo hace" }), color: "var(--zara-sage-ink)", Icon: Check },
  Geliştirilmeli: { label: () => pick({ tr: "Geliştirilmeli", en: "To improve", es: "A mejorar" }), color: "var(--zara-gold-deep)", Icon: AlertCircle },
  Öğretebilir: { label: () => pick({ tr: "Öğretebilir", en: "Can teach", es: "Puede enseñar" }), color: "var(--zara-gold-deep)", Icon: Award },
};

export function StatusToggle({
  status,
  onPick,
}: {
  status: TopicStatus;
  onPick: (s: Exclude<TopicStatus, "Boş">) => void;
}) {
  return (
    <div className="pusula-statusrow" role="group" aria-label={pick({ tr: "Öğrenme durumu", en: "Learning status", es: "Estado de aprendizaje" })}>
      {ORDER.map((s) => {
        const m = META[s];
        const active = status === s;
        const filled = s === "Öğretebilir";
        return (
          <button
            key={s}
            className={`pusula-statusopt ${active ? "on" : ""} ${filled ? "fill" : ""}`}
            style={{ "--c": m.color } as React.CSSProperties}
            onClick={() => onPick(s)}
            aria-pressed={active}
          >
            <m.Icon size={12} strokeWidth={1.9} />
            <span>{m.label()}</span>
          </button>
        );
      })}
    </div>
  );
}
