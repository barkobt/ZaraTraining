import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, BookText, ClipboardList, Gauge, Search, Target, FileText, Sparkles, Layers, CheckCircle2, Circle } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { employees } from "../data";
import {
  COMPETENCY_SCALE_TRI,
  GUIDEBOOK_LEVELS,
  GUIDEBOOK_ROLES,
  categoryLabel,
  glossaryTerms,
  levelLabel,
  levelWeeks,
  roleAsa,
  roleLabel,
  sectionFor,
} from "../data-gelisim";
import { competencyEval, finalReport, periodActions } from "../data-program";
import { MasteryLevel } from "../types";
import { type GuidebookLevel, type GuidebookRole, type GuidebookSection, type TopicStatus } from "../types-gelisim";
import { pick as plang } from "../i18n";

/** Yaşam evresi (MasteryLevel) kısa etiketi — aktif dilde. */
const masteryShort = (level: MasteryLevel): string =>
  level === MasteryLevel.New
    ? plang({ tr: "Yeni", en: "New", es: "Nuevo" })
    : level === MasteryLevel.Competent
      ? plang({ tr: "Yetkin", en: "Proficient", es: "Competente" })
      : level === MasteryLevel.Master
        ? plang({ tr: "Usta", en: "Master", es: "Maestro" })
        : plang({ tr: "Koç", en: "Coach", es: "Coach" });

/** Konu durumu (TopicStatus) etiketi — aktif dilde. */
const topicStatusLabel = (s: TopicStatus): string =>
  s === "Teorik"
    ? plang({ tr: "Teorik", en: "Theory", es: "Teórico" })
    : s === "Yapabiliyor"
      ? plang({ tr: "Yapabiliyor", en: "Can do", es: "Lo hace" })
      : s === "Geliştirilmeli"
        ? plang({ tr: "Geliştirilmeli", en: "To improve", es: "A mejorar" })
        : s === "Öğretebilir"
          ? plang({ tr: "Öğretebilir", en: "Can teach", es: "Puede enseñar" })
          : plang({ tr: "Boş", en: "Empty", es: "Vacío" });

const SCALE = COMPETENCY_SCALE_TRI;

/** Yaşam evresi → önerilen plan seviyesi (herkesin eğitim planı farklı). */
function planLevelFor(level: MasteryLevel): GuidebookLevel {
  return level === MasteryLevel.New ? "Başlangıç" : level === MasteryLevel.Competent ? "Orta" : "İleri";
}
import { StatusToggle } from "../components/StatusToggle";
import { CurriculumSignal } from "../components/CurriculumSignal";
import { usePersistentState } from "../session-store";
import { useT } from "../i18n";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

type Mode = "takip" | "yetkinlik" | "donem" | "rapor" | "evre" | "sozluk";
const TABS: Array<{ id: Mode; label: () => string; Icon: typeof BookOpen }> = [
  { id: "takip", label: () => plang({ tr: "Takip", en: "Tracking", es: "Seguimiento" }), Icon: BookOpen },
  { id: "yetkinlik", label: () => plang({ tr: "Yetkinlik", en: "Competency", es: "Competencia" }), Icon: Gauge },
  { id: "donem", label: () => plang({ tr: "Dönem Aksiyonu", en: "Period Action", es: "Acción del Periodo" }), Icon: ClipboardList },
  { id: "rapor", label: () => plang({ tr: "Dönem Raporu", en: "Period Report", es: "Informe del Periodo" }), Icon: FileText },
  { id: "evre", label: () => plang({ tr: "Evre Planları", en: "Stage Plans", es: "Planes por Etapa" }), Icon: Layers },
  { id: "sozluk", label: () => plang({ tr: "Sözlük", en: "Glossary", es: "Glosario" }), Icon: BookText },
];

/** Yaşam evresi planları — her evrenin eğitim planı farklıdır (üstüne gelince açılır). */
const STAGES: Array<{ id: string; label: () => string; level: GuidebookLevel | null; focus: () => string }> = [
  { id: "Yeni", label: () => plang({ tr: "Yeni", en: "New", es: "Nuevo" }), level: "Başlangıç", focus: () => plang({ tr: "Temel akışlar · bol gölge · oryantasyon", en: "Core flows · plenty of shadowing · orientation", es: "Flujos básicos · mucho acompañamiento · orientación" }) },
  { id: "Yetkin", label: () => plang({ tr: "Yetkin", en: "Proficient", es: "Competente" }), level: "Orta", focus: () => plang({ tr: "Genişlik · çok-alanlılık · tepe-saat dayanıklılığı", en: "Breadth · multi-area · peak-hour resilience", es: "Amplitud · multiárea · resistencia en hora pico" }) },
  { id: "Usta", label: () => plang({ tr: "Usta", en: "Master", es: "Maestro" }), level: "İleri", focus: () => plang({ tr: "Bağımsızlık · Öğretebilir konsolidasyonu · aktarıma hazırlık", en: "Independence · 'can teach' consolidation · readiness to transfer", es: "Autonomía · consolidación de 'puede enseñar' · preparación para transferir" }) },
  { id: "Koç", label: () => plang({ tr: "Koç", en: "Coach", es: "Coach" }), level: null, focus: () => plang({ tr: "Mentee lifti · yöntem yakalama · eğitimcinin eğitimi", en: "Mentee lift · capturing method · training the trainer", es: "Lift del mentee · captar el método · formar al formador" }) },
];
const KOC_PLAN: (() => string)[] = [
  () => plang({ tr: "Mentee lifti takibi — yetiştirdiği kişide gelişim", en: "Tracking mentee lift — growth in the person they develop", es: "Seguimiento del lift del mentee — crecimiento en la persona que desarrolla" }),
  () => plang({ tr: "Yöntem yakalama: işe yarayan koçluk adımını çıkar → onayla", en: "Capturing method: extract the coaching step that works → confirm", es: "Captar el método: extraer el paso de coaching que funciona → confirmar" }),
  () => plang({ tr: "Geri bildirim döngüsü: açık uçlu soru + aktif dinleme", en: "Feedback loop: open-ended question + active listening", es: "Bucle de feedback: pregunta abierta + escucha activa" }),
  () => plang({ tr: "Buz kırıcı ve vardiya başı toplantı yönetimi", en: "Ice-breaker and start-of-shift meeting management", es: "Gestión de ice-breaker y reunión de inicio de turno" }),
  () => plang({ tr: "Eğitimcinin eğitimi: kendi gelişim kenarı (ileri One Store anlatımı)", en: "Training the trainer: own growth edge (advanced One Store delivery)", es: "Formar al formador: su propio borde de crecimiento (explicación avanzada de One Store)" }),
];
const STAGE_OF: Record<MasteryLevel, string> = {
  [MasteryLevel.New]: "Yeni",
  [MasteryLevel.Competent]: "Yetkin",
  [MasteryLevel.Master]: "Usta",
  [MasteryLevel.Coach]: "Koç",
};
/** Evre id → aktif dil etiketi. */
const stageLabelOf = (id: string): string => STAGES.find((s) => s.id === id)?.label() ?? id;

/** 0–5 yetkinlik → renk tonu (sayı değil etiket). */
function scaleTone(level: number): string {
  if (level >= 4) return "var(--zara-gold-tint)";
  if (level >= 2) return "var(--zara-bg-warm)";
  return "var(--zara-bg-alt)";
}
function scaleInk(level: number): string {
  if (level >= 4) return "var(--zara-gold-deep)";
  if (level >= 2) return "var(--zara-ink-2)";
  // 0–1 ("Gözlemlenmedi/Çok Gelişmeli") okunabilir kalsın — ink-40 fazla soluktu
  return "var(--zara-ink-50)";
}

const PERIOD_HEADS = (): string[] => {
  const wk = (n: number) => plang({ tr: `Hafta ${n}`, en: `Week ${n}`, es: `Semana ${n}` });
  return [wk(2), wk(4), wk(6), wk(8)];
};

type Mark = { status: Exclude<TopicStatus, "Boş">; date: string; note: string };
const TODAY = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
const CAT_ORDER = ["Müşteri", "Ürün", "Satış", "Süreçler", "Kasa", "Depo", "Sistem"];

function groupByCat(topics: GuidebookSection["topics"]): Array<[string, GuidebookSection["topics"]]> {
  const m = new Map<string, GuidebookSection["topics"]>();
  for (const t of topics) {
    if (!m.has(t.category)) m.set(t.category, []);
    m.get(t.category)!.push(t);
  }
  return [...m.entries()].sort((a, b) => CAT_ORDER.indexOf(a[0]) - CAT_ORDER.indexOf(b[0]));
}

/**
 * Gelişim Defteri — dijital takip kitapçığı (gerçek 3 kitapçıktan). 5 sekme:
 * Takip (4-durum işaretleme) · Yetkinlik (5 davranışsal, 0–5 NİTEL) · Dönem
 * Aksiyonu (Hafta 2/4/6/8) · Dönem Raporu (Güçlü/Gelişim/Sonuç) · Sözlük.
 * Skor basılmaz; 0–5 etiketle gösterilir.
 */
export function GelisimDefteri() {
  const [mode, setMode] = useState<Mode>("takip");
  const [role, setRole] = useState<GuidebookRole>("Satış Danışmanı");
  const [level, setLevel] = useState<GuidebookLevel>("Başlangıç");
  // Koçun İŞİ görünüm değişiminde kaybolmasın: işaret/not/düzenleme state'leri
  // session-store'da yaşar (AnimatePresence unmount'u atlatır, sayfa yenilemede sıfırlanır).
  const [empId, setEmpId] = usePersistentState("defter.empId", employees[2]?.id ?? employees[0].id); // Asya (yeni) varsayılan
  // TEK mark / konu (durum + tarih + not). Tekrar işaretleme NOT EKLEMEZ, durumu GÜNCELLER.
  const [history, setHistory] = usePersistentState<Record<string, Mark>>("defter.history", {});
  const [edits, setEdits] = usePersistentState<Record<string, string>>("defter.edits", {});
  const [search, setSearch] = useState("");
  const [hoverStage, setHoverStage] = useState<string | null>(null);
  const [tFilter, setTFilter] = useState<"all" | "unmarked" | "teach">("all");
  // Yetkinlik etkileşimi — hücre seviyesi, gözlem notu, eğitim önceliği (takip edilir)
  const [compEdits, setCompEdits] = usePersistentState<Record<string, number>>("defter.compEdits", {});
  const [compNotes, setCompNotes] = usePersistentState<Record<string, string | undefined>>("defter.compNotes", {});
  const [compPrio, setCompPrio] = usePersistentState<Record<string, boolean>>("defter.compPrio", {});
  const cycleCell = (key: string, lv: number) => setCompEdits((p) => ({ ...p, [key]: (lv + 1) % SCALE.length }));
  const toggleCompNote = (name: string) => setCompNotes((p) => ({ ...p, [name]: p[name] === undefined ? "" : undefined }));
  const setCompNote = (name: string, v: string) => setCompNotes((p) => ({ ...p, [name]: v }));
  const togglePrio = (name: string, base: boolean) => setCompPrio((p) => ({ ...p, [name]: !(p[name] ?? base) }));
  // Dönem aksiyonu etkileşimi — öncelik tamamlandı takibi
  const [doneItems, setDoneItems] = usePersistentState<Record<string, boolean>>("defter.doneItems", {});
  const toggleDone = (key: string) => setDoneItems((p) => ({ ...p, [key]: !p[key] }));
  const t = useT();

  const eVal = (key: string, fallback: string) => edits[key] ?? fallback;
  const setE = (key: string, v: string) => setEdits((p) => ({ ...p, [key]: v }));

  const section = sectionFor(role, level);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];

  // tek mark modeli: aynı duruma tekrar tıkla → kaldır; farklı → güncelle (not korunur).
  const curStatus = (id: string, base: TopicStatus): TopicStatus => history[id]?.status ?? base;
  const setMark = (id: string, s: Exclude<TopicStatus, "Boş">) =>
    setHistory((prev) => {
      if (prev[id]?.status === s) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { status: s, date: prev[id]?.date ?? TODAY, note: prev[id]?.note ?? "" } };
    });
  const setMarkNote = (id: string, note: string) =>
    setHistory((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], note } } : prev));
  const marked = section ? section.topics.filter((tp) => curStatus(tp.id, tp.status) !== "Boş").length : 0;
  const teachable = section ? section.topics.filter((tp) => curStatus(tp.id, tp.status) === "Öğretebilir").length : 0;
  const visibleTopics = (section?.topics ?? []).filter((tp) => {
    const c = curStatus(tp.id, tp.status);
    if (tFilter === "unmarked") return c === "Boş";
    if (tFilter === "teach") return c === "Öğretebilir";
    return true;
  });
  const groups = groupByCat(visibleTopics);
  const catMarked = (topics: GuidebookSection["topics"]) => topics.filter((tp) => curStatus(tp.id, tp.status) !== "Boş").length;
  const recLevel = planLevelFor(emp.level);
  const adayStage = STAGE_OF[emp.level];

  // aday değişince planı yaşam evresine göre uyarla (herkesin planı farklı)
  useEffect(() => {
    setLevel(planLevelFor(emp.level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId]);

  // lang context değişince yeniden hesaplansın diye memo yerine doğrudan (saf + ucuz).
  const comp = competencyEval(emp);
  const actions = periodActions(emp);
  const report = finalReport(emp);
  const glossary = glossaryTerms().filter((g) =>
    (g.term + g.definition).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="pusula-book">
      <div className="pusula-place-head">
        <div>
          <Headline ital={t("t.defter.i")} roman={t("t.defter.r")} size={32} />
          <div className="pusula-sub">
            {plang({ tr: "8 haftalık saha programı", en: "8-week floor program", es: "Programa de sala de 8 semanas" })} · {emp.name} · {plang({ tr: "Koç", en: "Coach", es: "Coach" })}: Sevim Y.
          </div>
        </div>
        <label className="pusula-book-emp">
          <span>{plang({ tr: "Aday", en: "Candidate", es: "Candidato" })}</span>
          <select value={empId} onChange={(e) => setEmpId(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pusula-book-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`pusula-book-tab ${mode === t.id ? "on" : ""}`} onClick={() => setMode(t.id)}>
            <t.Icon size={14} strokeWidth={1.7} /> {t.label()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: EASE }}
        >
          {/* ── TAKİP ── */}
          {mode === "takip" && (
            <>
              <div className="pusula-pills" style={{ marginBottom: 16 }}>
                {GUIDEBOOK_ROLES.map((r) => (
                  <button key={r} className={`pusula-pill ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
              <div className="pusula-asa-strip">
                <span className="pusula-asa-strip-eb">{plang({ tr: "Ana Sorumluluk Alanları", en: "Main Areas of Responsibility", es: "Áreas Principales de Responsabilidad" })}</span>
                {roleAsa(role).map((a) => (
                  <span key={a.label} className="pusula-asa-chip">
                    {a.label} <em>{a.weight}</em>
                  </span>
                ))}
              </div>
              <div className="pusula-level-tabs">
                {GUIDEBOOK_LEVELS.map((lv) => (
                  <button key={lv} className={`pusula-level-tab ${level === lv ? "on" : ""} ${lv === recLevel ? "rec" : ""}`} onClick={() => setLevel(lv)}>
                    <span className="pusula-level-name">
                      {levelLabel(lv)}
                      {lv === recLevel && <span className="pusula-level-rec">{plang({ tr: `${masteryShort(emp.level)} için`, en: `for ${masteryShort(emp.level)}`, es: `para ${masteryShort(emp.level)}` })}</span>}
                    </span>
                    <span className="pusula-level-week">{levelWeeks(lv)}</span>
                  </button>
                ))}
              </div>
              <div className="pusula-book-legend">
                <span>{section?.topics.length} {plang({ tr: "konu", en: "topics", es: "temas" })} · {roleLabel(role)} · {section?.weeks}</span>
                <span className="pusula-book-legend-stats">
                  {plang({ tr: "Plan ", en: "Plan adapted to the ", es: "Plan adaptado al nivel " })}<em>{masteryShort(emp.level)}</em>{plang({ tr: " seviyesine göre uyarlanır · her tik tarih + nota düşülür", en: " level · each tick logs a date + note", es: " · cada marca registra fecha + nota" })}
                </span>
              </div>

              {/* hızlı filtre — uzun kitapçıkta kolay gezinme */}
              <div className="pusula-topicfilter">
                {([
                  ["all", plang({ tr: "Tümü", en: "All", es: "Todos" }), section?.topics.length ?? 0],
                  ["unmarked", plang({ tr: "İşaretlenmemiş", en: "Unmarked", es: "Sin marcar" }), (section?.topics.length ?? 0) - marked],
                  ["teach", plang({ tr: "Öğretebilir", en: "Can teach", es: "Puede enseñar" }), teachable],
                ] as const).map(([id, label, count]) => (
                  <button key={id} className={`pusula-tfbtn ${tFilter === id ? "on" : ""}`} onClick={() => setTFilter(id)}>
                    <span>{label}</span> <em>{count}</em>
                  </button>
                ))}
              </div>

              <div className="pusula-topics">
                {groups.map(([cat, topics]) => (
                  <div key={cat} className="pusula-catgroup">
                    <div className="pusula-cathead">
                      <span>{categoryLabel(cat)}</span>
                      <span className="pusula-cathead-prog">{catMarked(topics)}/{topics.length}</span>
                    </div>
                    {topics.map((t, i) => {
                      const cur = curStatus(t.id, t.status);
                      const isMarked = cur !== "Boş";
                      const isTeach = cur === "Öğretebilir";
                      const mark = history[t.id];
                      return (
                        <motion.div
                          key={t.id}
                          className={`pusula-topic ${isMarked ? "marked" : ""} ${isTeach ? "teach" : ""}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.18), ease: EASE }}
                        >
                          <div className="pusula-topic-main">
                            <span className="pusula-topic-title">
                              <span className="pusula-topic-no">{t.no}.</span> {t.title}
                            </span>
                            <StatusToggle status={cur} onPick={(s) => setMark(t.id, s)} />
                          </div>

                          {isTeach && (
                            <div className="pusula-teach-moment">
                              <Sparkles size={13} strokeWidth={1.7} />
                              <span>
                                <strong>{plang({ tr: "Öğretebilir!", en: "Can teach!", es: "¡Puede enseñar!" })}</strong> {emp.name.split(" ")[0]} {plang({
                                  tr: " bu konuda artık mentor adayı — Usta Aktarımına aday, Usta Yolu'na eklenebilir.",
                                  en: " is now a mentor candidate on this topic — a Mastery-Transfer candidate, can be added to the Mentor Path.",
                                  es: " ya es candidato a mentor en este tema — candidato a Transferencia de Maestría, se puede añadir a la Ruta de Mentor.",
                                })}
                              </span>
                            </div>
                          )}

                          {/* TEK işaret + hover ile açılan tek not */}
                          {mark && (
                            <div className="pusula-mark cur">
                              <span className="pusula-mark-status">{topicStatusLabel(mark.status)}</span>
                              <span className="pusula-mark-date">{mark.date}</span>
                              <input
                                className="pusula-mark-note"
                                placeholder={plang({ tr: "+ not ekle", en: "+ add note", es: "+ añadir nota" })}
                                value={mark.note}
                                onChange={(e) => setMarkNote(t.id, e.target.value)}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="pusula-topics-empty">{plang({ tr: "Bu filtrede konu yok.", en: "No topics in this filter.", es: "Sin temas en este filtro." })}</div>
                )}
              </div>

              <div className="pusula-book-foot">
                <span className="pusula-book-count">
                  {marked} / {section?.topics.length} {plang({ tr: "işaretli", en: "marked", es: "marcado" })} · {teachable} {plang({ tr: "öğretebilir", en: "can teach", es: "puede enseñar" })} · {plang({ tr: "tik notları Pusula'ya sinyal", en: "tick notes are a signal to Pusula", es: "las notas de marca son señal para Pusula" })}
                </span>
                <button className="pusula-apply"><Target size={15} /> {t("b.save")}</button>
              </div>

              <CurriculumSignal />
            </>
          )}

          {/* ── YETKİNLİK (5 davranışsal · 0–5 nitel · 4 dönem · İNTERAKTİF) ── */}
          {mode === "yetkinlik" && (
            <div className="pusula-comp">
              <div className="pusula-edit-hint">
                <span className="pusula-ai-badge">{plang({ tr: "İnteraktif", en: "Interactive", es: "Interactivo" })}</span>
                {plang({
                  tr: "Hücreye tıkla → seviyeyi değiştir; isme tıkla → eğitim önceliği; + not → gözlem. Tüm değişiklikler takip edilir.",
                  en: "Click a cell → change level; click the name → training priority; + note → observation. All changes are tracked.",
                  es: "Clic en celda → cambiar nivel; clic en el nombre → prioridad; + nota → observación. Todos los cambios se registran.",
                })}
              </div>
              <div className="pusula-comp-head">
                <span />
                {PERIOD_HEADS().map((p) => (
                  <span key={p} className="pusula-comp-period">{p}</span>
                ))}
              </div>
              {comp.map((row) => {
                const prio = compPrio[row.name] ?? row.priority;
                const noteVal = compNotes[row.name];
                return (
                  <div key={row.name} className={`pusula-comp-row ${prio ? "prio" : ""}`}>
                    <div className="pusula-comp-name">
                      <button className="pusula-comp-nameb" onClick={() => togglePrio(row.name, row.priority)} title={plang({ tr: "eğitim önceliği aç/kapa", en: "toggle training priority", es: "alternar prioridad" })}>
                        {row.name}
                      </button>
                      {prio && <span className="pusula-comp-prio">{plang({ tr: "Eğitim önceliği", en: "Training priority", es: "Prioridad de formación" })}</span>}
                      <button className="pusula-comp-noteadd" onClick={() => toggleCompNote(row.name)}>
                        {noteVal === undefined ? plang({ tr: "+ not", en: "+ note", es: "+ nota" }) : plang({ tr: "− not", en: "− note", es: "− nota" })}
                      </button>
                    </div>
                    {row.periods.map((base, i) => {
                      const key = `${row.name}:${i}`;
                      const lv = compEdits[key] ?? base;
                      const modified = key in compEdits;
                      return (
                        <button
                          key={i}
                          className={`pusula-comp-cell ${modified ? "mod" : ""}`}
                          style={{ background: scaleTone(lv), color: scaleInk(lv) }}
                          onClick={() => cycleCell(key, lv)}
                          title={plang({ tr: "tıkla: seviye değiştir", en: "click: change level", es: "clic: cambiar nivel" })}
                        >
                          {plang(SCALE[lv])}
                          {modified && <i className="pusula-comp-dot" />}
                        </button>
                      );
                    })}
                    {noteVal !== undefined && (
                      <input
                        className="pusula-comp-note"
                        autoFocus
                        placeholder={plang({ tr: "gözlem notu (bu yetkinlikte ne gözlemledin?)", en: "observation note (what did you observe?)", es: "nota de observación (¿qué observaste?)" })}
                        value={noteVal}
                        onChange={(e) => setCompNote(row.name, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              <div className="pusula-assure pusula-assure-row">
                <span>{plang({ tr: "0–5 ölçeği etiketle gösterilir — sayı basılmaz", en: "The 0–5 scale is shown as labels — no numbers printed", es: "La escala 0–5 se muestra como etiquetas — sin imprimir números" })}</span>
                <span>{plang({ tr: "4 dönemde gelişim okunur, sıralama değil", en: "Growth is read across 4 periods, not a ranking", es: "Se lee el crecimiento en 4 periodos, no un ranking" })}</span>
              </div>
            </div>
          )}

          {/* ── DÖNEM AKSİYONU (Hafta 2/4/6/8) — AI önerisi, düzenlenebilir ── */}
          {mode === "donem" && (
            <>
              <div className="pusula-edit-hint">
                <span className="pusula-ai-badge">{plang({ tr: "AI önerisi", en: "AI suggestion", es: "Sugerencia IA" })}</span> {plang({ tr: "Pusula profile göre taslak verir — koç düzenleyebilir, üzerine yazabilir.", en: "Pusula drafts based on the profile — the coach can edit and overwrite.", es: "Pusula propone un borrador según el perfil — el coach puede editar y sobrescribir." })}
              </div>
              <div className="pusula-period-grid">
                {actions.map((a, i) => (
                  <motion.div
                    key={a.week}
                    className="pusula-period"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, ease: EASE }}
                  >
                    <div className="pusula-period-week">
                      {a.week}
                      <span className="pusula-period-prog">{a.priorities.filter((p) => doneItems[`${empId}:${a.week}:${p}`]).length}/{a.priorities.length}</span>
                    </div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">{plang({ tr: "Öncelikler", en: "Priorities", es: "Prioridades" })}</span>
                      <div className="pusula-period-checks">
                        {a.priorities.map((p) => {
                          const key = `${empId}:${a.week}:${p}`;
                          const done = doneItems[key];
                          return (
                            <button key={p} className={`pusula-checkitem ${done ? "done" : ""}`} onClick={() => toggleDone(key)}>
                              {done ? <CheckCircle2 size={14} strokeWidth={1.8} /> : <Circle size={14} strokeWidth={1.6} />}
                              <span>{p}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">{plang({ tr: "Hedef", en: "Goal", es: "Objetivo" })}</span>
                      <textarea
                        className="pusula-edit"
                        rows={2}
                        value={eVal(`act:${empId}:${a.week}:goal`, a.goal)}
                        onChange={(e) => setE(`act:${empId}:${a.week}:goal`, e.target.value)}
                      />
                    </div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">{plang({ tr: "Aksiyon", en: "Action", es: "Acción" })}</span>
                      <textarea
                        className="pusula-edit"
                        rows={2}
                        value={eVal(`act:${empId}:${a.week}:action`, a.action)}
                        onChange={(e) => setE(`act:${empId}:${a.week}:action`, e.target.value)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* ── DÖNEM RAPORU — AI önerisi, düzenlenebilir ── */}
          {mode === "rapor" && (
            <div className="pusula-report">
              <div className="pusula-edit-hint">
                <span className="pusula-ai-badge">{plang({ tr: "AI önerisi", en: "AI suggestion", es: "Sugerencia IA" })}</span> {plang({ tr: "Kanıttan türetilmiş taslak — koç sonucu kendi sözleriyle yazabilir.", en: "A draft derived from evidence — the coach can write the conclusion in their own words.", es: "Un borrador derivado de la evidencia — el coach puede escribir la conclusión con sus palabras." })}
              </div>
              <div className="pusula-report-cols">
                <section>
                  <span className="pusula-period-key">{plang({ tr: "Güçlü Yönler", en: "Strengths", es: "Fortalezas" })}</span>
                  <ul className="pusula-report-list strong">
                    {report.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <span className="pusula-period-key">{plang({ tr: "Gelişim Alanları", en: "Growth Areas", es: "Áreas de Desarrollo" })}</span>
                  <ul className="pusula-report-list growth">
                    {report.growth.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="pusula-report-result">
                <span className="pusula-period-key">{plang({ tr: "Sonuç · Koç değerlendirmesi", en: "Conclusion · Coach assessment", es: "Conclusión · Evaluación del coach" })}</span>
                <textarea
                  className="pusula-edit big"
                  rows={3}
                  value={eVal(`rep:${empId}:result`, report.result)}
                  onChange={(e) => setE(`rep:${empId}:result`, e.target.value)}
                />
              </div>
              <div className="pusula-assure pusula-assure-row">
                <span>{plang({ tr: "Değerlendirme = gelişim için, ceza için değil", en: "Assessment = for growth, not punishment", es: "Evaluación = para el desarrollo, no para castigar" })}</span>
                <span>{plang({ tr: "Bu raporu çalışan da görür", en: "The employee sees this report too", es: "El empleado también ve este informe" })}</span>
              </div>
            </div>
          )}

          {/* ── EVRE PLANLARI (her evre için ayrı, hover ile açılan tablo) ── */}
          {mode === "evre" && (
            <div className="pusula-stages">
              <div className="pusula-edit-hint">
                <span className="pusula-ai-badge">{plang({ tr: "Yaşam evresi", en: "Lifecycle stage", es: "Etapa de carrera" })}</span>
                {plang({ tr: "Her evrenin eğitim planı farklıdır — üstüne gelince tablosu açılır.", en: "Each stage has a different training plan — hover to open its table.", es: "Cada etapa tiene un plan de formación distinto — pasa el ratón para abrir su tabla." })}{" "}
                <em>{emp.name.split(" ")[0]}</em> {plang({ tr: "şu an", en: "is currently in the", es: "está ahora en la etapa" })} <strong>{stageLabelOf(adayStage)}</strong> {plang({ tr: "evresinde.", en: "stage.", es: "." })}
              </div>
              {STAGES.map((s) => {
                const open = hoverStage === s.id || (hoverStage === null && adayStage === s.id);
                const topics = s.level ? (sectionFor(role, s.level)?.topics ?? []) : null;
                return (
                  <div
                    key={s.id}
                    className={`pusula-stage ${open ? "open" : ""} ${adayStage === s.id ? "active" : ""}`}
                    onMouseEnter={() => setHoverStage(s.id)}
                    onMouseLeave={() => setHoverStage(null)}
                  >
                    <div className="pusula-stage-bar">
                      <span className="pusula-stage-name">{s.label()}</span>
                      <span className="pusula-stage-focus">{s.focus()}</span>
                      {adayStage === s.id && (
                        <span className="pusula-stage-here">{emp.name.split(" ")[0]} {plang({ tr: "burada", en: "is here", es: "está aquí" })}</span>
                      )}
                      <span className="pusula-stage-meta">{s.level ? `${levelLabel(s.level)} · ${plang({ tr: "plan", en: "plan", es: "plan" })}` : plang({ tr: "koçluk planı", en: "coaching plan", es: "plan de coaching" })}</span>
                    </div>
                    <div className="pusula-stage-table">
                      <div className="pusula-stage-inner">
                        {topics
                          ? topics.slice(0, 8).map((t) => (
                              <div key={t.id} className="pusula-stage-row">
                                <span className="pusula-stage-cat">{categoryLabel(t.category)}</span>
                                <span className="pusula-stage-topic">
                                  <span className="pusula-topic-no">{t.no}.</span> {t.title}
                                </span>
                              </div>
                            ))
                          : KOC_PLAN.map((k, i) => (
                              <div key={i} className="pusula-stage-row">
                                <span className="pusula-stage-cat">{plang({ tr: "Koçluk", en: "Coaching", es: "Coaching" })}</span>
                                <span className="pusula-stage-topic">{k()}</span>
                              </div>
                            ))}
                        {topics && topics.length > 8 && (
                          <div className="pusula-stage-more">+{topics.length - 8} {plang({ tr: "konu daha — Takip'te", en: "more topics — in Tracking", es: "temas más — en Seguimiento" })}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SÖZLÜK ── */}
          {mode === "sozluk" && (
            <>
              <div className="pusula-glossary-search">
                <Search size={18} strokeWidth={1.6} />
                <input placeholder={plang({ tr: "Terim veya kelime arayın…", en: "Search a term or word…", es: "Busca un término o palabra…" })} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="pusula-glossary-grid">
                <AnimatePresence>
                  {glossary.map((g) => (
                    <motion.div
                      key={g.term}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="pusula-glossary-card"
                    >
                      <div className="pusula-glossary-head">
                        <h3>{g.term}</h3>
                        <span className="pusula-glossary-type">{g.type}</span>
                      </div>
                      <p>{g.definition}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {glossary.length === 0 && <div className="pusula-glossary-empty">{plang({ tr: "Eşleşen terim bulunamadı.", en: "No matching term found.", es: "No se encontró ningún término." })}</div>}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
