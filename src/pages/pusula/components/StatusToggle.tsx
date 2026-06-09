import { Award, BookOpen, Check, AlertCircle } from "lucide-react";
import type { TopicStatus } from "../types-gelisim";

/**
 * Konu öğrenme durumu seçici — 4 durum (Teorik / Yapabiliyor / Geliştirilmeli /
 * Öğretebilir). Renkler bizim palet (ink · sage · gold), yabancı yeşil/mavi yok.
 * Aynı duruma tekrar dokununca "Boş"a döner.
 */
const STATUS_META: Record<
  Exclude<TopicStatus, "Boş">,
  { label: string; short: string; color: string; Icon: typeof Check }
> = {
  Teorik: { label: "Teorik", short: "Teorik", color: "var(--zara-ink)", Icon: BookOpen },
  Yapabiliyor: { label: "Yapabiliyor", short: "Uyguluyor", color: "var(--zara-sage-ink)", Icon: Check },
  Geliştirilmeli: { label: "Geliştirilmeli", short: "Gelişmeli", color: "var(--zara-gold-deep)", Icon: AlertCircle },
  Öğretebilir: { label: "Öğretebilir", short: "Öğretir", color: "var(--zara-ink)", Icon: Award },
};

const ORDER: Array<Exclude<TopicStatus, "Boş">> = ["Teorik", "Yapabiliyor", "Geliştirilmeli", "Öğretebilir"];

export function StatusToggle({
  status,
  onPick,
}: {
  status: TopicStatus;
  onPick: (s: Exclude<TopicStatus, "Boş">) => void;
}) {
  return (
    <div className="pusula-statustoggle">
      {ORDER.map((s) => {
        const meta = STATUS_META[s];
        const active = status === s;
        const filled = s === "Öğretebilir"; // usta durumu koyu dolar
        return (
          <button
            key={s}
            className={`pusula-status-dot ${active ? "on" : ""} ${filled ? "fill" : ""}`}
            style={{ "--dot": meta.color } as React.CSSProperties}
            onClick={() => onPick(s)}
            title={meta.label}
            aria-label={meta.label}
            aria-pressed={active}
          >
            <meta.Icon size={13} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
