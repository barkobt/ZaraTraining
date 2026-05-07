import { Sparkles } from "lucide-react";

export type CabinKey = "baslangic" | "gelisim" | "altin";

export interface CabinTheme {
  no: string;
  title: string;
  titleItalic: string;
  label: string;
  range: string;
  description: string;
  accent: string;
  accentSoft: string;
  light: string;
}

export const CABIN_THEMES: Record<CabinKey, CabinTheme> = {
  baslangic: {
    no: "01",
    title: "Başlangıç",
    titleItalic: "Kabini",
    label: "Yeni Bir Başlangıç",
    range: "0 — 4",
    description: "Her uzman bir gün buradan başladı. Yarın aynı senaryoda çok daha güçlü olacaksınız.",
    accent: "#8B6F47",
    accentSoft: "rgba(139, 111, 71, 0.18)",
    light: "rgba(255, 230, 180, 0.45)",
  },
  gelisim: {
    no: "02",
    title: "Gelişim",
    titleItalic: "Kabini",
    label: "Potansiyel Dolu",
    range: "5 — 8",
    description: "Potansiyeliniz belli oluyor. Birkaç ipucuyla aynı müşteri yarın annesini getirecek.",
    accent: "#9B8F80",
    accentSoft: "rgba(155, 143, 128, 0.20)",
    light: "rgba(255, 240, 210, 0.50)",
  },
  altin: {
    no: "03",
    title: "Altın",
    titleItalic: "Kabin",
    label: "Mükemmel Hizmet",
    range: "9 — 12",
    description: "Bugün müşterilerin gününü kurtardınız. +8.700 TL satış, 3 çapraz satış.",
    accent: "#B8935A",
    accentSoft: "rgba(184, 147, 90, 0.22)",
    light: "rgba(255, 220, 150, 0.65)",
  },
};

interface PersonRow {
  id: number | string;
  name: string;
  totalScore: number;
}

// Sprite image is 3 cabins side-by-side (3084x1344). Each cabin is 1/3 horizontally.
// Inline style avoids Tailwind purging dynamically-built modifier classes.
const SPRITE_POSITION: Record<CabinKey, string> = {
  baslangic: "0% 50%",
  gelisim: "50% 50%",
  altin: "100% 50%",
};

interface CabinCurtainProps {
  cabinKey: CabinKey;
  revealed: boolean;
  onClick?: () => void;
  people?: PersonRow[];
  size?: "sm" | "md" | "lg" | "xl";
  showHint?: boolean;
  showPeople?: boolean;
  showDescription?: boolean;
  highlightName?: string;
  className?: string;
}

const SIZE_MAX: Record<NonNullable<CabinCurtainProps["size"]>, string> = {
  sm: "max-w-[260px]",
  md: "max-w-[340px]",
  lg: "max-w-[420px]",
  xl: "max-w-[520px]",
};

export function CabinCurtain({
  cabinKey,
  revealed,
  onClick,
  people,
  size = "md",
  showHint = true,
  showPeople = false,
  showDescription = true,
  highlightName,
  className = "",
}: CabinCurtainProps) {
  const theme = CABIN_THEMES[cabinKey];

  return (
    <div
      onClick={onClick}
      className={`relative w-full ${SIZE_MAX[size]} aspect-[3/4] overflow-hidden bg-[#1A1614] cursor-pointer group select-none ${className}`}
      style={{
        boxShadow: revealed
          ? `0 30px 80px -20px ${theme.accentSoft}, 0 0 0 1px ${theme.accent}40, 0 0 60px ${theme.accent}20`
          : "0 25px 60px -25px rgba(26,22,20,0.55)",
        transition: "box-shadow 1.4s cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}
    >
      {/* === INSIDE THE CABIN === */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{
          background: "linear-gradient(180deg, var(--zara-bg-warm) 0%, var(--zara-bg-alt) 100%)",
        }}
      >
        {/* Tier-specific cabin sprite — inline style guarantees correct 1/3 crop */}
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage: "url('/images/cabins.png')",
            backgroundSize: "300% 100%",
            backgroundPosition: SPRITE_POSITION[cabinKey],
            backgroundRepeat: "no-repeat",
            opacity: revealed ? 0.38 : 0.20,
            transition: "opacity 1.6s cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        />

        {/* Ambient cabin light */}
        <div
          className="absolute inset-0 transition-opacity duration-[1500ms]"
          style={{
            background: `radial-gradient(ellipse at top, ${theme.light} 0%, transparent 70%)`,
            opacity: revealed ? 1 : 0,
          }}
        />
        {/* Floor reflection */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 transition-opacity duration-[1500ms]"
          style={{
            background: `linear-gradient(180deg, transparent, ${theme.accent}14)`,
            opacity: revealed ? 1 : 0,
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 flex-1 flex flex-col items-center justify-between p-5 md:p-6 text-center"
          style={{
            opacity: revealed ? 1 : 0,
            transition: `opacity 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) ${revealed ? "850ms" : "0ms"}`,
          }}
        >
          {/* Top */}
          <div className="space-y-2 pt-3">
            <div
              className="text-[10px] font-mono tracking-[0.3em] uppercase"
              style={{ color: theme.accent }}
            >
              {theme.label}
            </div>
            <h3 className="font-serif text-3xl md:text-4xl tracking-[-0.02em] leading-[0.95]" style={{ color: "var(--zara-ink)" }}>
              {theme.title}
              <br />
              <span className="italic font-light" style={{ color: theme.accent }}>
                {theme.titleItalic}
              </span>
            </h3>
            <div
              className="text-xs font-mono tracking-[0.2em] uppercase"
              style={{ color: `${theme.accent}cc` }}
            >
              {theme.range} PUAN
            </div>
          </div>

          {/* Description */}
          {showDescription && (
            <p className="text-[11px] md:text-xs italic leading-relaxed font-serif px-2 max-w-[28ch]" style={{ color: "rgba(26,22,20,0.62)" }}>
              {theme.description}
            </p>
          )}

          {/* People list */}
          {showPeople && (
            <div className="w-full space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {people && people.length > 0 ? (
                people.map((p, i) => {
                  const isMe = highlightName && p.name === highlightName;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-1.5 border-b text-left"
                      style={{
                        borderColor: `${theme.accent}1a`,
                        background: isMe ? `${theme.accent}14` : "transparent",
                        animation: revealed
                          ? `fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) ${1100 + i * 80}ms both`
                          : "none",
                      }}
                    >
                      <span
                        className="text-sm font-serif truncate"
                        style={{ color: isMe ? theme.accent : "var(--zara-ink)", fontWeight: isMe ? 600 : 400 }}
                      >
                        {p.name}
                        {isMe && <span className="ml-1.5 text-[9px] font-mono uppercase tracking-[0.2em] opacity-70">· siz</span>}
                      </span>
                      <span
                        className="text-[10px] font-mono tabular-nums"
                        style={{ color: theme.accent }}
                      >
                        {p.totalScore}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] font-mono tracking-[0.25em] uppercase py-3" style={{ color: "rgba(26,22,20,0.3)" }}>
                  · Henüz kimse yok ·
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === LEFT CURTAIN === */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/2 z-20"
        style={{
          background: `linear-gradient(135deg, #1A1614 0%, ${theme.accent}3a 100%)`,
          transform: revealed ? "translateX(-105%)" : "translateX(0%)",
          transition: "transform 1.7s cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0, transparent 14px, rgba(0,0,0,0.35) 14px, rgba(0,0,0,0.35) 16px, transparent 16px, transparent 30px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.accent}50 50%, transparent 100%)`,
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/55 to-transparent" />
      </div>

      {/* === RIGHT CURTAIN === */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1/2 z-20"
        style={{
          background: `linear-gradient(225deg, #1A1614 0%, ${theme.accent}3a 100%)`,
          transform: revealed ? "translateX(105%)" : "translateX(0%)",
          transition: "transform 1.7s cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0, transparent 14px, rgba(0,0,0,0.35) 14px, rgba(0,0,0,0.35) 16px, transparent 16px, transparent 30px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(270deg, transparent 0%, ${theme.accent}50 50%, transparent 100%)`,
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/55 to-transparent" />
      </div>

      {/* === CLOSED OVERLAY === */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700 ${
          revealed ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          className="text-[10px] font-mono tracking-[0.4em] uppercase mb-4"
          style={{ color: `${theme.accent}cc` }}
        >
          KABİN {theme.no}
        </div>
        <div
          className="font-serif text-7xl italic font-light"
          style={{ color: theme.accent }}
        >
          ?
        </div>
        {showHint && onClick && (
          <div className="mt-6 flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-white/55 group-hover:text-white/85 transition-colors">
            <Sparkles size={11} />
            AÇMAK İÇİN TIKLA
          </div>
        )}
      </div>
    </div>
  );
}
