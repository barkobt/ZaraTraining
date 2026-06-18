import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus, Check, Compass } from "lucide-react";
import { Headline } from "../primitives";
import { byId, employees, pocket } from "../data";
import {
  aptitudeSuggestions,
  channelLabel,
  compLabel,
  discoveryFor,
  personCompetencies,
  provenWord,
  type AptitudeSuggestion,
  type EvidenceChannel,
} from "../data-competency";
import { mentorMatches } from "../data-mentor";
import { sectionFor } from "../data-gelisim";
import { MasteryLevel, type Employee } from "../types";
import { HourlySpark } from "../components/HourlySpark";
import { PersonAvatar } from "../components/PersonAvatar";
import { usePersistentState } from "../session-store";
import { pick, useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

type GoView = "ekip" | "profil" | "defter" | "hafiza" | "usta" | "yerlestirme" | "saha";

/** Bekleyen aptitude önerileri — tüm roster taranır, onaylılar düşülür. */
function pendingAptitudes(approved: Record<string, boolean>): Array<AptitudeSuggestion & { person: Employee }> {
  const out: Array<AptitudeSuggestion & { person: Employee }> = [];
  for (const e of employees) {
    for (const s of aptitudeSuggestions(e.id)) {
      if (!approved[s.id]) out.push({ ...s, person: e });
    }
  }
  return out;
}

type QKind = "onay" | "kesif" | "eslesme" | "defter";

interface QRow {
  id: string;
  kind: QKind;
  who: ReactNode;
  body: ReactNode;
  tail: ReactNode;
}

/**
 * BUGÜN — koçun ön sayfası. Üstte manşet (akşam cebi hikâyesi + saatlik akış),
 * altında GÜNÜN KUYRUĞU: onay/keşif/eşleşme/defter aksiyonları TEK tam-genişlik
 * defterde, türe göre filtrelenebilir. Aksiyon kendi kolonunda yaşar — dar
 * kolon sıkışması olmaz. Durumlar session-store üzerinden bölüm ekranlarıyla
 * AYNI kaynağı paylaşır.
 */
export function Bugun({ onGo, onPeek }: { onGo: (v: GoView) => void; onPeek: (p: Employee) => void }) {
  const t = useT();
  // bölüm ekranlarıyla paylaşılan durumlar (aynı anahtarlar)
  const [approved, setApproved] = usePersistentState<Record<string, boolean>>("apt.approved", {});
  const [planned, setPlanned] = usePersistentState<Record<string, boolean>>("disc.planned", {});
  const [confirmed, setConfirmed] = usePersistentState<Record<string, boolean>>("usta.confirmed", {});
  const [defterHistory] = usePersistentState<Record<string, unknown>>("defter.history", {});
  const [, setDefterEmp] = usePersistentState("defter.empId", employees[2]?.id ?? employees[0].id);
  const [flt, setFlt] = useState<QKind | "all">("all");

  const apts = pendingAptitudes(approved).slice(0, 4);
  const discs = employees
    .map((e) => ({ e, d: discoveryFor(e.id) }))
    .filter((x): x is { e: Employee; d: NonNullable<ReturnType<typeof discoveryFor>> } => x.d !== null)
    .filter((x) => !planned[`${x.e.id}:${x.d.comp}`])
    .slice(0, 4);
  const matches = mentorMatches().slice(0, 2);

  // Defterde açık: yeni başlayanların önerilen (Başlangıç) bölümündeki işaretsiz konuları.
  // (Mock'ta işaretler kitapçık-düzeyinde tutulur; kişi başına küçük deterministik fark
  // gösterimi okunur kılar — sayı yargı değil, "nereden başlasam" işaretidir.)
  const baseOpen = (section: ReturnType<typeof sectionFor>) =>
    (section?.topics ?? []).filter((tp) => tp.status === "Boş" && !(tp.id in defterHistory)).length;
  const section = sectionFor("Satış Danışmanı", "Başlangıç");
  const openOf = (id: string) => Math.max(0, baseOpen(section) - ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 4));
  const freshFolk = employees.filter((e) => e.level === MasteryLevel.New).slice(0, 3);

  const today = new Date().toLocaleDateString(
    pick({ tr: "tr-TR", en: "en-GB", es: "es-ES" }),
    { weekday: "long", day: "numeric", month: "long" },
  );

  // Gazete "baskı künyesi" — sabahları ERKEN, sonra GEÇ baskı; No. = yılın günü
  // (gerçek bir yayın sayısı gibi günlük artar). Altın yok, saf mürekkep.
  const _now = new Date();
  const edition = pick({
    tr: _now.getHours() < 12 ? "ERKEN BASKI" : "GEÇ BASKI",
    en: _now.getHours() < 12 ? "MORNING EDITION" : "LATE EDITION",
    es: _now.getHours() < 12 ? "EDICIÓN MAÑANA" : "EDICIÓN TARDE",
  });
  const editionNo = Math.ceil((Date.now() - Date.UTC(_now.getFullYear(), 0, 0)) / 86400000);

  const ticker = [
    pick({ tr: `${pocket.window} cep · trafik ${pocket.trafficPeak} · conversion %${pocket.convBefore[0]}`, en: `${pocket.window} pocket · traffic ${pocket.trafficPeak} · conversion ${pocket.convBefore[0]}%`, es: `hueco ${pocket.window} · tráfico ${pocket.trafficPeak} · conversión ${pocket.convBefore[0]}%` }),
    pick({ tr: "Welcome · 2 ürün alarmı/saat", en: "Welcome · 2 product alarms/hr", es: "Welcome · 2 alarmas/h" }),
    pick({ tr: "kabin sayacı · denenen parça zirvede", en: "fitting counter · items tried peaking", es: "contador de probador · prendas en pico" }),
    pick({ tr: "Zone 5 · sell-through %34 — dolum baskısı", en: "Zone 5 · sell-through 34% — refill pressure", es: "Zone 5 · sell-through 34% — presión de reposición" }),
    pick({ tr: `mentor eşleşmesi hazır · ${matches.length}`, en: `mentor pairings ready · ${matches.length}`, es: `emparejamientos listos · ${matches.length}` }),
  ];

  // ── günün kuyruğu: dört kaynaktan tek defter ──
  const rows: QRow[] = [];
  for (const s of apts) {
    rows.push({
      id: s.id,
      kind: "onay",
      who: (
        <button className="pv3-who" onClick={() => onPeek(s.person)}>
          <PersonAvatar name={s.person.name} size={26} />
          <span>{s.person.name.split(" ")[0]}</span>
        </button>
      ),
      body: (
        <>
          <span className="pv3-row-main">
            {compLabel(s.comp)}: {provenWord(s.from)} <i>→</i> {provenWord(s.to)}
          </span>
          <span className="pv3-row-sub">{channelLabel(s.evidence.channel)}</span>
        </>
      ),
      tail: (
        <button className="pv3-act" onClick={() => setApproved((p) => ({ ...p, [s.id]: true }))}>
          <Check size={11} strokeWidth={2.2} /> {t("b.approveApt")}
        </button>
      ),
    });
  }
  for (const { e, d } of discs) {
    rows.push({
      id: `disc-${e.id}-${d.comp}`,
      kind: "kesif",
      who: (
        <button className="pv3-who" onClick={() => onPeek(e)}>
          <PersonAvatar name={e.name} size={26} />
          <span>{e.name.split(" ")[0]}</span>
        </button>
      ),
      body: (
        <>
          <span className="pv3-row-main">
            <Compass size={11} strokeWidth={1.8} /> {compLabel(d.comp)}
          </span>
          <span className="pv3-row-sub">
            {pick({ tr: `15–16 · ${d.buddyName} eşliğinde`, en: `15–16 · with ${d.buddyName}`, es: `15–16 · con ${d.buddyName}` })}
          </span>
        </>
      ),
      tail: (
        <button className="pv3-act" onClick={() => setPlanned((p) => ({ ...p, [`${e.id}:${d.comp}`]: true }))}>
          <CalendarPlus size={11} strokeWidth={2} /> {t("b.plan")}
        </button>
      ),
    });
  }
  for (const m of matches) {
    const mentor = byId(m.mentorId);
    const mentee = byId(m.menteeId);
    const ok = confirmed[m.id];
    rows.push({
      id: m.id,
      kind: "eslesme",
      who: (
        <span className="pv3-pair">
          <PersonAvatar name={mentor?.name ?? m.mentorId} size={24} />
          <PersonAvatar name={mentee?.name ?? m.menteeId} size={24} />
        </span>
      ),
      body: (
        <>
          <span className="pv3-row-main">{m.focus}</span>
          <span className="pv3-row-sub">{m.slot}</span>
        </>
      ),
      tail: ok ? (
        <span className="pv3-done">
          <Check size={11} strokeWidth={2.2} /> {t("l.approved").split(" ")[0]}
        </span>
      ) : (
        <button className="pv3-act" onClick={() => setConfirmed((p) => ({ ...p, [m.id]: true }))}>
          <Check size={11} strokeWidth={2.2} /> {t("b.approveApt")}
        </button>
      ),
    });
  }
  for (const e of freshFolk) {
    rows.push({
      id: `open-${e.id}`,
      kind: "defter",
      who: (
        <button className="pv3-who" onClick={() => onPeek(e)}>
          <PersonAvatar name={e.name} size={26} />
          <span>{e.name.split(" ")[0]}</span>
        </button>
      ),
      body: (
        <>
          <span className="pv3-row-main">
            {openOf(e.id)} {t("l.openTopicsN")}
          </span>
          <span className="pv3-row-sub">{pick({ tr: "Başlangıç planı", en: "Starter plan", es: "Plan inicial" })}</span>
        </>
      ),
      tail: (
        <button
          className="pvq-open"
          onClick={() => {
            setDefterEmp(e.id);
            onGo("defter");
          }}
        >
          {pick({ tr: "Defteri aç", en: "Open booklet", es: "Abrir cuaderno" })} <ArrowRight size={11} strokeWidth={1.8} />
        </button>
      ),
    });
  }

  const kindLabel: Record<QKind, string> = {
    onay: pick({ tr: "Onay", en: "Approval", es: "Visto" }),
    kesif: pick({ tr: "Keşif", en: "Discovery", es: "Hallazgo" }),
    eslesme: pick({ tr: "Eşleşme", en: "Pairing", es: "Mentoría" }),
    defter: pick({ tr: "Defter", en: "Booklet", es: "Cuaderno" }),
  };
  const countOf = (k: QKind) => rows.filter((r) => r.kind === k).length;
  const shown = flt === "all" ? rows : rows.filter((r) => r.kind === flt);

  return (
    <div className="pv3-cockpit">
      {/* manşet satırı */}
      <div className="pv3-masthead">
        <span className="pv3-mast-left">
          <span className="pv3-date">{today}</span>
          <span className="pv3-edition">{edition} · No. {editionNo}</span>
        </span>
        <span className="pv4-how">{t("how.bugun")}</span>
        <span className="pv3-store">ZARA · BORNOVA 3643</span>
      </div>

      {/* canlı sinyal şeridi */}
      <div className="pv3-ticker" aria-hidden>
        <div className="pv3-ticker-in">
          {[...ticker, ...ticker].map((s, i) => (
            <span key={i}>
              {s} <i>·</i>
            </span>
          ))}
        </div>
      </div>

      {/* HERO — akşam cebi hikâyesi + saatlik akış */}
      <motion.section
        className="pvh"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="pvh-left">
          <span className="pv3-eb">{t("e.eveningPocket")} · {pocket.window}</span>
          <Headline
            ital={pick({ tr: "Trafik zirvede,", en: "Traffic peaks,", es: "El tráfico sube," })}
            roman={pick({ tr: "conversion dipte.", en: "conversion bottoms.", es: "la conversión cae." })}
            size={40}
          />
          <p className="pv3-lead-p">
            {pick({
              tr: `Tepe saatte ${pocket.trafficPeak} ziyaretçi içeri giriyor; conversion %${pocket.convBefore[0]}'e düşüyor. Doğru eller öne alınırsa cep yumuşar — öneriler hazır.`,
              en: `${pocket.trafficPeak} visitors walk in at peak; conversion drops to ${pocket.convBefore[0]}%. Bring the right hands forward and the pocket eases — suggestions are ready.`,
              es: `${pocket.trafficPeak} visitantes entran en el pico; la conversión cae al ${pocket.convBefore[0]}%. Con las manos correctas el hueco se relaja — las sugerencias están listas.`,
            })}
          </p>
          <button className="pusula-apply pv3-cta" onClick={() => onGo("yerlestirme")}>
            {t("b.goPlacement")} <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="pvh-right">
          <div className="pvh-stats">
            <div>
              <em>{pocket.window}</em>
              <span>{pick({ tr: "cep penceresi", en: "pocket window", es: "ventana del hueco" })}</span>
            </div>
            <div>
              <em>{pocket.trafficPeak}</em>
              <span>{pick({ tr: "tepe trafik", en: "peak traffic", es: "tráfico pico" })}</span>
            </div>
            <div>
              <em>%{pocket.convBefore[0]}</em>
              <span>{pick({ tr: "conversion dip", en: "conversion low", es: "conversión mín." })}</span>
            </div>
          </div>
          <HourlySpark />
          {/* kanıt akışı — modeli bugün besleyen kanal hacimleri (rosterdan gerçek toplam) */}
          <div className="pvh-flow">
            <span className="k">{pick({ tr: "Kanıt akışı · kanal kanal", en: "Evidence flow · by channel", es: "Flujo de evidencia · por canal" })}</span>
            {(() => {
              const sums: Record<EvidenceChannel, number> = { counter: 0, attribution: 0, booklet: 0, eas: 0, coach: 0 };
              for (const e of employees)
                for (const pc of personCompetencies(e.id))
                  for (const ev of pc.evidence) sums[ev.channel] += ev.n;
              const SHORT: Record<EvidenceChannel, string> = {
                counter: pick({ tr: "sayaç", en: "counter", es: "contador" }),
                attribution: pick({ tr: "kesişim", en: "overlap", es: "cruce" }),
                booklet: pick({ tr: "kitapçık", en: "booklet", es: "cuadernillo" }),
                eas: "EAS",
                coach: pick({ tr: "koç notu", en: "coach note", es: "nota coach" }),
              };
              return (Object.keys(sums) as EvidenceChannel[]).map((ch) => (
                <span key={ch} className="c">
                  <em>{sums[ch]}</em> {SHORT[ch]}
                </span>
              ));
            })()}
          </div>
        </div>
      </motion.section>

      {/* GÜNÜN KUYRUĞU — tek defter, türe göre filtre */}
      <motion.section
        className="pvq"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      >
        <div className="pvq-head">
          <span className="pvq-title">
            {pick({ tr: "Günün kuyruğu", en: "Today's queue", es: "Cola del día" })} · {rows.length}
          </span>
          <div className="pvq-filters" role="tablist">
            <button className={`pvq-f ${flt === "all" ? "on" : ""}`} onClick={() => setFlt("all")}>
              {pick({ tr: "Tümü", en: "All", es: "Todo" })}
              <b>{rows.length}</b>
            </button>
            {(["onay", "kesif", "eslesme", "defter"] as const).map((k) => (
              <button key={k} className={`pvq-f ${flt === k ? "on" : ""}`} onClick={() => setFlt(k)}>
                {kindLabel[k]}
                <b>{countOf(k)}</b>
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <div className="pv3-empty pvq-empty">{t("l.allClear")}</div>}
        {shown.map((r, i) => (
          <motion.div
            key={r.id}
            className="pvq-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 + i * 0.03, ease: EASE }}
          >
            <span className="pvq-idx">{String(i + 1).padStart(2, "0")}</span>
            <span className={`pvq-kind k-${r.kind}`}>{kindLabel[r.kind]}</span>
            <span className="pvq-who">{r.who}</span>
            <div className="pvq-body">{r.body}</div>
            <span className="pvq-tail">{r.tail}</span>
          </motion.div>
        ))}
      </motion.section>

      <div className="pusula-assure pusula-assure-row">
        <span>
          {pick({ tr: "Her aksiyon önerdir — karar koçundur", en: "Every action is a suggestion — the coach decides", es: "Cada acción es una sugerencia — decide el coach" })}
        </span>
        <span>{pick({ tr: "Skor yok · sıralama yok", en: "No scores · no rankings", es: "Sin puntajes · sin rankings" })}</span>
      </div>
    </div>
  );
}
