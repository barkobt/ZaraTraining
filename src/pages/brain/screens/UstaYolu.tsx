import { useMemo } from "react";
import { Avatar, Eyebrow, Headline, Icon, Marker } from "../primitives";
import { loadByBlock, mentorMatch, predictLoad, ZONES, ZONE_LABEL, type Zone } from "../model";
import { ROSTER, BLOCKS, CHEMISTRY, HISTORY, TODAY } from "../data";

const GOLD = "var(--zara-gold)";
const INK2 = "var(--zara-ink-2)";
const LINE = "var(--zara-line)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";
const FAINT = "var(--zara-ink-40)";

/** Kişinin en düşük yetkinlikli zone'u = "sıradaki kenar" (gelişim hedefi). */
function nextEdge(person: (typeof ROSTER)[number]): { zone: Zone; level: number } {
  let best: Zone = ZONES[0];
  for (const z of ZONES) if ((person.comp[z] ?? 0) < (person.comp[best] ?? 0)) best = z;
  return { zone: best, level: person.comp[best] ?? 0 };
}

export function UstaYolu() {
  const pairings = useMemo(() => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    const blockLoad = loadByBlock(load, BLOCKS);
    return mentorMatch(ROSTER, BLOCKS, blockLoad, CHEMISTRY);
  }, []);

  // sıradaki kenar çipleri — herkesin en güçsüz alanı, gelişim olarak çerçevelenir
  const edges = ROSTER.map((p) => ({ p, edge: nextEdge(p) }))
    .filter((e) => e.edge.level <= 2)
    .sort((a, b) => a.edge.level - b.edge.level)
    .slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 26, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <Headline ital="Usta" roman="Yolu" size={34} />
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginTop: 8 }}>GELİŞİM KATMANI · GİZLİ · OPT-IN · GÜÇLÜ-YÖNLERDEN</div>
        </div>
        <Eyebrow gold>· SIRALAMA DEĞİL · GÖZETİM DEĞİL</Eyebrow>
      </div>

      <p style={{ margin: "0 0 28px", fontFamily: "var(--ff-display)", fontSize: 19, lineHeight: 1.5, color: INK2, maxWidth: 720 }}>
        Mevcut ekranlara oturan küçük, yerel eklentiler. <em style={{ fontStyle: "italic" }}>Gizli, isteğe bağlı, güçlü-yönlerden başlar</em> — asla skor tahtası ya da kıyas. Bir açık, yalnızca bir <em style={{ fontStyle: "italic" }}>sıradaki kenar</em>dır.
      </p>

      {/* mentor eşleşmeleri */}
      <Marker left="EŞ-MENTOR EŞLEŞMELERİ" right="model.mentorMatch()" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 36 }}>
        {pairings.map((p, i) => (
          <div key={i} className="brain-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar person={p.learner} size={36} />
              <Icon name="sprout" size={15} style={{ color: GOLD }} />
              <Avatar person={p.mentor} size={36} />
              <div style={{ marginLeft: "auto", fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>{ZONE_LABEL[p.zone].tr}</div>
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>
              <em style={{ fontStyle: "italic" }}>{p.learner.short}</em> · usta {p.mentor.short}
            </div>
            <div style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>
              Sakin {p.block.label} bloğunda eşleşir{p.chemistry > 0 ? ` · sinerji ${p.chemistry.toFixed(2)}` : ""}. ~{p.shiftsToNext} vardiyada bir sonraki seviye.
            </div>
          </div>
        ))}
      </div>

      {/* sıradaki kenar çipleri */}
      <Marker left="SIRADAKİ KENAR · NEXT EDGE" right="gizli ilerleme şeridi" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
        {edges.map(({ p, edge }) => {
          const steps = 3;
          const done = edge.level; // 0..2 → tamamlanan adım
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", border: `1px solid ${LINE_STRONG}`, background: "var(--zara-bg-white)", flexWrap: "wrap" }}>
              <Avatar person={p} size={32} />
              <div style={{ minWidth: 120 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 15 }}>{p.short}</div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase", color: FAINT }}>sıradaki kenar</div>
              </div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>{ZONE_LABEL[edge.zone].tr}</div>
              <div style={{ display: "flex", gap: 5, marginLeft: "auto" }}>
                {Array.from({ length: steps }).map((_, i) => (
                  <span key={i} style={{ width: 26, height: 6, background: i < done ? GOLD : "var(--zara-bg-alt)", border: `1px solid ${i < done ? GOLD : LINE}` }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: MUTED }} className="num">{done}/{steps}</span>
            </div>
          );
        })}
      </div>

      <footer style={{ paddingTop: 22, borderTop: `1px solid ${LINE_STRONG}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: 17, color: INK2 }}>Her uzman bir gün buradan başladı.</span>
        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.24em", textTransform: "uppercase", color: MUTED }}>ZARA · ATELYE · USTA YOLU</span>
      </footer>
    </div>
  );
}
