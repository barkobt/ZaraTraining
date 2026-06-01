import { useMemo, useState } from "react";
import { Avatar, Button, Confidence, Eyebrow, Headline, Icon, LiveDot } from "../primitives";
import {
  confidence, loadByBlock, mentorMatch, predictLoad, rankForZone, ZONE_LABEL,
} from "../model";
import { ROSTER, BLOCKS, CHEMISTRY, HISTORY, TODAY } from "../data";

const GOLD = "var(--zara-gold)";
const INK = "var(--zara-ink)";
const INK2 = "var(--zara-ink-2)";
const LINE = "var(--zara-line)";
const LINE_STRONG = "var(--zara-line-strong)";
const MUTED = "var(--zara-ink-50)";
const FAINT = "var(--zara-ink-40)";

type QId = "kabin" | "mentor" | "peak";
const QUESTIONS: { id: QId; q: string }[] = [
  { id: "kabin", q: "Yoğun trafikte kabinde kim en iyi çalışır?" },
  { id: "mentor", q: "Yeni başlayanı kiminle eşleştirmeliyim?" },
  { id: "peak", q: "Bugün hangi saatte en yoğun olacağız?" },
];

export function Ask() {
  const [qid, setQid] = useState<QId>("kabin");
  const question = QUESTIONS.find((x) => x.id === qid)!.q;

  const load = useMemo(() => predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek }), []);
  const blockLoad = useMemo(() => loadByBlock(load, BLOCKS), [load]);
  const kabinRank = useMemo(() => rankForZone(ROSTER, "KABIN", CHEMISTRY).slice(0, 3), []);
  const pairings = useMemo(() => mentorMatch(ROSTER, BLOCKS, blockLoad, CHEMISTRY), [blockLoad]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 18, marginBottom: 24, borderBottom: `1px solid ${LINE_STRONG}`, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Headline ital="Beyne" roman="Sor" size={34} />
            <LiveDot label="HAFIZA" />
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED }}>KURUMSAL HAFIZA · GRAPH RAG · KANITA DAYALI</div>
        </div>
        <Eyebrow>· {HISTORY.length} GEÇMİŞ CUMA · {ROSTER.length} KİŞİ</Eyebrow>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* soru */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: 540, background: INK, color: "var(--zara-bg)", padding: "14px 20px" }}>
            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,241,234,0.5)", marginBottom: 6 }}>MAĞAZA MÜDÜRÜ</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, lineHeight: 1.35 }}>{question}</div>
          </div>
        </div>

        {/* yanıt */}
        <div style={{ background: "var(--zara-bg-white)", border: `1px solid ${LINE_STRONG}`, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${GOLD}, transparent)` }} />
          <div style={{ padding: "20px 26px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="/zt-mark-gold.png" alt="" style={{ height: 22 }} />
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: MUTED }}>ZARA BRAIN · YANIT</span>
            </div>

            {qid === "kabin" && <KabinAnswer rank={kabinRank} />}
            {qid === "mentor" && <MentorAnswer pairings={pairings} />}
            {qid === "peak" && <PeakAnswer load={load} />}

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <Confidence value={qid === "peak" ? load.confidence : confidence(HISTORY.length)} support={HISTORY.length} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--ff-sans)", fontSize: 12, fontStyle: "italic", color: MUTED }}>
                <Icon name="shield-check" size={13} style={{ color: GOLD }} />
                Her iddia model + memory_facts'e dayanır — kanıtsız yanıt verilmez.
              </span>
            </div>
          </div>
        </div>

        {/* öneriler + input */}
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {QUESTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setQid(s.id)}
                style={{
                  padding: "8px 14px", cursor: "pointer", fontFamily: "var(--ff-sans)", fontSize: 12.5,
                  background: qid === s.id ? "var(--zara-gold-tint)" : "transparent",
                  border: `1px solid ${qid === s.id ? GOLD : LINE_STRONG}`,
                  color: qid === s.id ? INK : INK2,
                }}
              >
                {s.q}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: `1px solid ${LINE_STRONG}`, background: "var(--zara-bg-white)", padding: "12px 16px" }}>
            <Icon name="message-square" size={16} style={{ color: MUTED }} />
            <span style={{ flex: 1, fontFamily: "var(--ff-sans)", fontSize: 14, color: FAINT, fontStyle: "italic" }}>Bir soru seçin — model yanıtı yeniden hesaplar…</span>
            <Button primary icon="arrow-up">Sor</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KabinAnswer({ rank }: { rank: ReturnType<typeof rankForZone> }) {
  const [a, b] = rank;
  return (
    <>
      <p style={{ margin: "0 0 18px", fontFamily: "var(--ff-display)", fontSize: 19, lineHeight: 1.5, color: INK }}>
        Yoğun kabin trafiğinde en güçlü isim <em style={{ fontStyle: "italic" }}>{a.person.short}</em>
        {b && <> ardından <em style={{ fontStyle: "italic" }}>{b.person.short}</em></>}. Skor; yetkinlik, ölçülen sinerji ve kıdemin ağırlıklı bileşimi.
      </p>
      {rank.map((r, i) => (
        <div key={r.person.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
          <div style={{ fontFamily: "var(--ff-display)", fontStyle: "italic", fontSize: 22, color: GOLD, minWidth: 26, lineHeight: 1.2 }}>{i + 1}</div>
          <Avatar person={r.person} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 17 }}>{r.person.name}</span>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: FAINT }}>{r.person.tenure}{r.person.manager ? " · MGR" : ""}</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--ff-mono)", fontSize: 13, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{r.score.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <Chip icon="users">KABİN · seviye {r.person.comp.KABIN}</Chip>
              {r.bestPartner && r.bestPartner.v > 0.5 && <Chip icon="git-branch">{r.bestPartner.short} ile +{r.bestPartner.v.toFixed(2)} sinerji</Chip>}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function MentorAnswer({ pairings }: { pairings: ReturnType<typeof mentorMatch> }) {
  return (
    <>
      <p style={{ margin: "0 0 18px", fontFamily: "var(--ff-display)", fontSize: 19, lineHeight: 1.5, color: INK }}>
        Yetkinlik açığını sinerjiyle kapatın: her yeni kişi, aynı alanda usta biriyle <em style={{ fontStyle: "italic" }}>sakin blokta</em> eşleştirilir — asla 19:00 yoğunluğunda.
      </p>
      {pairings.slice(0, 4).map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${LINE}`, alignItems: "center" }}>
          <Avatar person={p.learner} size={34} />
          <Icon name="arrow-right" size={14} style={{ color: GOLD }} />
          <Avatar person={p.mentor} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 15 }}>
              <em style={{ fontStyle: "italic" }}>{p.learner.short}</em> → {p.mentor.short}
              <span style={{ marginLeft: 10, fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>{ZONE_LABEL[p.zone].tr} · {p.block.label}</span>
            </div>
            <div style={{ fontFamily: "var(--ff-sans)", fontSize: 12, color: MUTED, fontStyle: "italic", marginTop: 2 }}>
              ~{p.shiftsToNext} vardiyada bir sonraki seviye{p.chemistry > 0 ? ` · sinerji ${p.chemistry.toFixed(2)}` : ""}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function PeakAnswer({ load }: { load: ReturnType<typeof predictLoad> }) {
  return (
    <p style={{ margin: 0, fontFamily: "var(--ff-display)", fontSize: 19, lineHeight: 1.55, color: INK }}>
      Son {load.support} benzer Cuma'nın ortalamasına göre zirve <em style={{ fontStyle: "italic" }}>{load.peakLabel}</em> civarında —
      kabin yükü ~%{Math.max(...load.hourly)} seviyesine çıkıyor. Akşam (16–19) ve kapanış (19–22) bloklarını
      güçlendirin; sabah görece sakin.
    </p>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--zara-bg-white)", border: `1px solid ${LINE_STRONG}`, fontFamily: "var(--ff-mono)", fontSize: 9.5, letterSpacing: "0.08em", color: INK2 }}>
      <Icon name={icon} size={11} style={{ color: GOLD }} />
      {children}
    </span>
  );
}
