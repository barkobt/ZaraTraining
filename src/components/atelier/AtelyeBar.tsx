import { Link } from "react-router";
import { Compass, CalendarClock, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

/**
 * AtelyeBar — ZARA Atölye paylaşılan üst barı + uygulama değiştirici.
 *
 * Pusula (koçluk) ve Shift Organizer (operasyon) tek ürün gibi gezilsin diye
 * her iki kabuğun en üstüne yüklenir. Design handoff §4.1: sticky, 46px,
 * antrasit zemin, ZARA wordmark + "ATÖLYE" + uygulama pill'leri + sağda
 * "Mağaza 3643 · Bornova". Aktif uygulama vurgulu span; pasif react-router
 * Link ile diğerine gider.
 */
const APPS = [
  { id: "pusula" as const, label: "Pusula", sub: "Koçluk · insan", to: "/pusula", Icon: Compass },
  { id: "shift" as const, label: "Shift Organizer", sub: "Operasyon · chart", to: "/shift-organizer", Icon: CalendarClock },
];

export function AtelyeBar({ active }: { active: "pusula" | "shift" }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 70,
        height: 46,
        flex: "0 0 46px",
        display: "flex",
        alignItems: "stretch",
        background: "var(--zara-ink)",
        color: "var(--zara-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 clamp(16px, 3vw, 32px)" }}>
        {/* wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 9,
            paddingRight: 20,
            marginRight: 4,
            borderRight: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <span style={{ fontFamily: "var(--ff-display)", fontWeight: 500, fontSize: 16, letterSpacing: "0.02em", color: "#fff" }}>ZARA</span>
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>Atölye</span>
        </div>

        {/* app switcher */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 14 }} aria-label="Atölye uygulamaları">
          {APPS.map((a) => {
            const on = a.id === active;
            const inner: ReactNode = (
              <>
                <a.Icon size={14} strokeWidth={1.5} color={on ? "var(--zara-gold)" : "rgba(255,255,255,0.6)"} />
                <span
                  className="hidden sm:inline"
                  style={{
                    fontFamily: "var(--ff-sans)",
                    fontSize: 13,
                    fontWeight: on ? 500 : 400,
                    whiteSpace: "nowrap",
                    color: on ? "#fff" : "rgba(255,255,255,0.66)",
                  }}
                >
                  {a.label}
                </span>
              </>
            );
            const base = {
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 13px",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
              border: "1px solid transparent",
              transition: "background 160ms, border-color 160ms",
            } as const;
            return on ? (
              <span key={a.id} style={{ ...base, background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }} title={a.sub} aria-current="page">
                {inner}
              </span>
            ) : (
              <Link key={a.id} to={a.to} style={base} title={a.sub}>
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* sağ — bağlam */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span
            className="hidden lg:inline"
            style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}
          >
            tek döngü · insan ↔ operasyon
          </span>
          <span className="hidden md:inline" style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
            Mağaza 3643 · Bornova
          </span>
          <UserCircle size={18} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
        </div>
      </div>
    </div>
  );
}
