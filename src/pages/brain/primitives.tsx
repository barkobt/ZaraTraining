import type { CSSProperties, ReactNode } from "react";
import {
  Activity, ArrowRight, ArrowUp, ArrowUpRight, Bell, Brain as BrainIcon, Calendar, Check, Clock, CloudSun,
  Equal, GitBranch, Hand, LayoutGrid, Leaf, Lock, MessageSquare, Minus, Plus, Quote, Repeat,
  ShieldCheck, SlidersHorizontal, Sprout, Store, Sunrise, Target, TrendingUp, Users, X,
  type LucideIcon,
} from "lucide-react";
import type { Person } from "./model";

/* kebab-case ad → lucide bileşeni (kit.jsx data-lucide adlarıyla aynı). */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity, "arrow-right": ArrowRight, "arrow-up": ArrowUp, "arrow-up-right": ArrowUpRight,
  bell: Bell, brain: BrainIcon, calendar: Calendar, check: Check, clock: Clock, "cloud-sun": CloudSun, equal: Equal, leaf: Leaf,
  "git-branch": GitBranch, hand: Hand, "layout-grid": LayoutGrid, lock: Lock,
  "message-square": MessageSquare, minus: Minus, plus: Plus, quote: Quote, repeat: Repeat,
  "shield-check": ShieldCheck, "sliders-horizontal": SlidersHorizontal, sprout: Sprout,
  store: Store, sunrise: Sunrise, target: Target, "trending-up": TrendingUp, users: Users, x: X,
};

export function Icon({ name, size = 14, stroke = 1.6, style }: { name: string; size?: number; stroke?: number; style?: CSSProperties }) {
  const Cmp = ICONS[name] ?? Minus;
  return <Cmp size={size} strokeWidth={stroke} style={style} />;
}

const MUTED = "var(--zara-ink-50)";
const GOLD = "var(--zara-gold)";
const FAINT = "var(--zara-ink-40)";
const LINE_STRONG = "var(--zara-line-strong)";
const INK = "var(--zara-ink)";
const PAPER = "var(--zara-bg)";

export function Eyebrow({ children, dot = true, gold = false, style }: { children: ReactNode; dot?: boolean; gold?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: gold ? GOLD : MUTED, ...style }}>
      {dot ? "· " : ""}
      {children}
    </div>
  );
}

export function Headline({ ital, roman, size = 28, color = INK, style }: { ital?: string; roman: string; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <h2 style={{ margin: 0, fontFamily: "var(--ff-display)", fontWeight: 500, fontSize: size, letterSpacing: "-0.01em", color, lineHeight: 1.08, ...style }}>
      {ital && <em style={{ fontStyle: "italic", fontWeight: 300 }}>{ital} </em>}
      {roman}
    </h2>
  );
}

export function Marker({ left, right }: { left: string; right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 0 18px" }}>
      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: MUTED, whiteSpace: "nowrap" }}>{left}</span>
      <span style={{ flex: 1, height: 1, background: LINE_STRONG }} />
      {right && <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: FAINT, whiteSpace: "nowrap" }}>{right}</span>}
    </div>
  );
}

export function Button({ children, primary, icon, onClick, style }: { children: ReactNode; primary?: boolean; icon?: string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="brain-btn"
      data-primary={primary ? "1" : undefined}
      style={style}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </button>
  );
}

export function Avatar({ person, size = 30 }: { person: Person; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: person.manager ? INK : "var(--zara-bg-alt)", color: person.manager ? PAPER : "var(--zara-ink-2)",
        display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: size * 0.46,
        border: person.manager ? "none" : "1px solid var(--zara-line)",
      }}
    >
      {person.short[0]}
    </div>
  );
}

export function Confidence({ value, support }: { value: number; support?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ width: 4, height: 9, background: i < Math.round(value * 5) ? GOLD : LINE_STRONG }} />
        ))}
      </span>
      {Math.round(value * 100)}% güven{support != null && ` · n=${support}`}
    </span>
  );
}

export function LiveDot({ label = "CANLI" }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: MUTED }}>
      <span className="brain-live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--zara-emerald)" }} />
      {label}
    </span>
  );
}

export function PageHead({ ital, roman, eyebrowRight, live, children }: { ital?: string; roman: string; eyebrowRight?: string; live?: string; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: live ? 8 : 0 }}>
          <Headline ital={ital} roman={roman} size={34} />
          {live && <LiveDot label={live} />}
        </div>
        {children}
      </div>
      {eyebrowRight && (
        <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.24em", textTransform: "uppercase", color: MUTED, lineHeight: 1.7, textAlign: "right", maxWidth: 300 }}>
          {eyebrowRight}
        </div>
      )}
    </div>
  );
}
