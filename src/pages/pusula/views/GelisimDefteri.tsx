import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, BookText, ClipboardList, Gauge, Search, Target, FileText, Sparkles } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { employees } from "../data";
import {
  GLOSSARY,
  GUIDEBOOK_LEVELS,
  GUIDEBOOK_ROLES,
  ROLE_ASA,
  sectionFor,
} from "../data-gelisim";
import { competencyEval, finalReport, periodActions } from "../data-program";
import { MasteryLevel } from "../types";
import { COMPETENCY_SCALE, type GuidebookLevel, type GuidebookRole, type GuidebookSection, type TopicStatus } from "../types-gelisim";

/** Yaşam evresi → önerilen plan seviyesi (herkesin eğitim planı farklı). */
function planLevelFor(level: MasteryLevel): GuidebookLevel {
  return level === MasteryLevel.New ? "Başlangıç" : level === MasteryLevel.Competent ? "Orta" : "İleri";
}
import { StatusToggle } from "../components/StatusToggle";
import { CurriculumSignal } from "../components/CurriculumSignal";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

type Mode = "takip" | "yetkinlik" | "donem" | "rapor" | "sozluk";
const TABS: Array<{ id: Mode; label: string; Icon: typeof BookOpen }> = [
  { id: "takip", label: "Takip", Icon: BookOpen },
  { id: "yetkinlik", label: "Yetkinlik", Icon: Gauge },
  { id: "donem", label: "Dönem Aksiyonu", Icon: ClipboardList },
  { id: "rapor", label: "Dönem Raporu", Icon: FileText },
  { id: "sozluk", label: "Sözlük", Icon: BookText },
];

/** 0–5 yetkinlik → renk tonu (sayı değil etiket). */
function scaleTone(level: number): string {
  if (level >= 4) return "var(--zara-gold-tint)";
  if (level >= 2) return "var(--zara-bg-warm)";
  return "var(--zara-bg-alt)";
}
function scaleInk(level: number): string {
  if (level >= 4) return "var(--zara-gold-deep)";
  if (level >= 2) return "var(--zara-ink-2)";
  return "var(--zara-ink-40)";
}

const PERIOD_HEADS = ["Hafta 2", "Hafta 4", "Hafta 6", "Hafta 8"];

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
  const [empId, setEmpId] = useState(employees[2]?.id ?? employees[0].id); // Asya (yeni) varsayılan
  const [history, setHistory] = useState<Record<string, Mark[]>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const eVal = (key: string, fallback: string) => edits[key] ?? fallback;
  const setE = (key: string, v: string) => setEdits((p) => ({ ...p, [key]: v }));

  const section = sectionFor(role, level);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];

  // history modeli: her tik bir mark (durum + tarih + not) → per-pill not + tarih + ilerleme
  const curStatus = (id: string, base: TopicStatus): TopicStatus => {
    const h = history[id];
    return h && h.length ? h[h.length - 1].status : base;
  };
  const pick = (id: string, s: Exclude<TopicStatus, "Boş">) =>
    setHistory((prev) => {
      const h = prev[id] ? [...prev[id]] : [];
      if (h.length && h[h.length - 1].status === s) h.pop();
      else h.push({ status: s, date: TODAY, note: "" });
      return { ...prev, [id]: h };
    });
  const setMarkNote = (id: string, idx: number, note: string) =>
    setHistory((prev) => {
      const h = [...(prev[id] ?? [])];
      if (h[idx]) h[idx] = { ...h[idx], note };
      return { ...prev, [id]: h };
    });
  const marked = section ? section.topics.filter((t) => curStatus(t.id, t.status) !== "Boş").length : 0;
  const teachable = section ? section.topics.filter((t) => curStatus(t.id, t.status) === "Öğretebilir").length : 0;
  const groups = groupByCat(section?.topics ?? []);
  const recLevel = planLevelFor(emp.level);

  // aday değişince planı yaşam evresine göre uyarla (herkesin planı farklı)
  useEffect(() => {
    setLevel(planLevelFor(emp.level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId]);

  const comp = useMemo(() => competencyEval(emp), [emp]);
  const actions = useMemo(() => periodActions(emp), [emp]);
  const report = useMemo(() => finalReport(emp), [emp]);
  const glossary = useMemo(
    () => GLOSSARY.filter((g) => (g.term + g.definition).toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="pusula-book">
      <div className="pusula-place-head">
        <div>
          <Headline ital="Gelişim" roman="Defteri" size={32} />
          <div className="pusula-sub">
            8 haftalık saha programı · {emp.name} · Koç: Baran B.
          </div>
        </div>
        <label className="pusula-book-emp">
          <span>Aday</span>
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
            <t.Icon size={14} strokeWidth={1.7} /> {t.label}
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
                    {r}
                  </button>
                ))}
              </div>
              <div className="pusula-asa-strip">
                <span className="pusula-asa-strip-eb">Ana Sorumluluk Alanları</span>
                {ROLE_ASA[role].map((a) => (
                  <span key={a.label} className="pusula-asa-chip">
                    {a.label} <em>{a.weight}</em>
                  </span>
                ))}
              </div>
              <div className="pusula-level-tabs">
                {GUIDEBOOK_LEVELS.map((lv) => (
                  <button key={lv} className={`pusula-level-tab ${level === lv ? "on" : ""} ${lv === recLevel ? "rec" : ""}`} onClick={() => setLevel(lv)}>
                    <span className="pusula-level-name">
                      {lv}
                      {lv === recLevel && <span className="pusula-level-rec">{emp.level} için</span>}
                    </span>
                    <span className="pusula-level-week">
                      {lv === "Başlangıç" ? "1–4 Hafta" : lv === "Orta" ? "5–6 Hafta" : "7–8 Hafta"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pusula-book-legend">
                <span>{section?.topics.length} konu · {role} · {section?.weeks}</span>
                <span className="pusula-book-legend-stats">
                  Plan <em>{emp.level}</em> seviyesine göre uyarlanır · her tik tarih + nota düşülür
                </span>
              </div>

              <div className="pusula-topics">
                {groups.map(([cat, topics]) => (
                  <div key={cat} className="pusula-catgroup">
                    <div className="pusula-cathead">{cat}</div>
                    {topics.map((t, i) => {
                      const cur = curStatus(t.id, t.status);
                      const isMarked = cur !== "Boş";
                      const isTeach = cur === "Öğretebilir";
                      const marks = history[t.id] ?? [];
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
                            <StatusToggle status={cur} onPick={(s) => pick(t.id, s)} />
                          </div>

                          {isTeach && (
                            <div className="pusula-teach-moment">
                              <Sparkles size={13} strokeWidth={1.7} />
                              <span>
                                <strong>Öğretebilir!</strong> {emp.name.split(" ")[0]} bu konuda artık mentor adayı —
                                Usta Aktarımına aday, Usta Yolu'na eklenebilir.
                              </span>
                            </div>
                          )}

                          {marks.length > 0 && (
                            <div className="pusula-marks">
                              {marks.map((m, mi) => (
                                <div key={mi} className={`pusula-mark ${mi === marks.length - 1 ? "cur" : ""}`}>
                                  <span className="pusula-mark-status">{m.status}</span>
                                  <span className="pusula-mark-date">{m.date}</span>
                                  <input
                                    className="pusula-mark-note"
                                    placeholder="bu adımda ne yaptın? (opsiyonel not)"
                                    value={m.note}
                                    onChange={(e) => setMarkNote(t.id, mi, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pusula-book-foot">
                <span className="pusula-book-count">
                  {marked} / {section?.topics.length} işaretli · {teachable} öğretebilir · tik notları Pusula'ya sinyal
                </span>
                <button className="pusula-apply"><Target size={15} /> Durumu Kaydet</button>
              </div>

              <CurriculumSignal />
            </>
          )}

          {/* ── YETKİNLİK (5 davranışsal · 0–5 nitel · 4 dönem) ── */}
          {mode === "yetkinlik" && (
            <div className="pusula-comp">
              <div className="pusula-comp-head">
                <span />
                {PERIOD_HEADS.map((p) => (
                  <span key={p} className="pusula-comp-period">{p}</span>
                ))}
              </div>
              {comp.map((row) => (
                <div key={row.name} className="pusula-comp-row">
                  <div className="pusula-comp-name">
                    {row.name}
                    {row.priority && <span className="pusula-comp-prio">Eğitim önceliği</span>}
                  </div>
                  {row.periods.map((lv, i) => (
                    <span
                      key={i}
                      className="pusula-comp-cell"
                      style={{ background: scaleTone(lv), color: scaleInk(lv) }}
                    >
                      {COMPETENCY_SCALE[lv]}
                    </span>
                  ))}
                </div>
              ))}
              <div className="pusula-assure pusula-assure-row">
                <span>0–5 ölçeği etiketle gösterilir — sayı basılmaz</span>
                <span>4 dönemde gelişim okunur, sıralama değil</span>
              </div>
            </div>
          )}

          {/* ── DÖNEM AKSİYONU (Hafta 2/4/6/8) — AI önerisi, düzenlenebilir ── */}
          {mode === "donem" && (
            <>
              <div className="pusula-edit-hint">
                <span className="pusula-ai-badge">AI önerisi</span> Pusula profile göre taslak verir — koç düzenleyebilir, üzerine yazabilir.
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
                    <div className="pusula-period-week">{a.week}</div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">Öncelikler</span>
                      <ul>
                        {a.priorities.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">Hedef</span>
                      <textarea
                        className="pusula-edit"
                        rows={2}
                        value={eVal(`act:${empId}:${a.week}:goal`, a.goal)}
                        onChange={(e) => setE(`act:${empId}:${a.week}:goal`, e.target.value)}
                      />
                    </div>
                    <div className="pusula-period-block">
                      <span className="pusula-period-key">Aksiyon</span>
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
                <span className="pusula-ai-badge">AI önerisi</span> Kanıttan türetilmiş taslak — koç sonucu kendi sözleriyle yazabilir.
              </div>
              <div className="pusula-report-cols">
                <section>
                  <span className="pusula-period-key">Güçlü Yönler</span>
                  <ul className="pusula-report-list strong">
                    {report.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <span className="pusula-period-key">Gelişim Alanları</span>
                  <ul className="pusula-report-list growth">
                    {report.growth.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="pusula-report-result">
                <span className="pusula-period-key">Sonuç · Koç değerlendirmesi</span>
                <textarea
                  className="pusula-edit big"
                  rows={3}
                  value={eVal(`rep:${empId}:result`, report.result)}
                  onChange={(e) => setE(`rep:${empId}:result`, e.target.value)}
                />
              </div>
              <div className="pusula-assure pusula-assure-row">
                <span>Değerlendirme = gelişim için, ceza için değil</span>
                <span>Bu raporu çalışan da görür</span>
              </div>
            </div>
          )}

          {/* ── SÖZLÜK ── */}
          {mode === "sozluk" && (
            <>
              <div className="pusula-glossary-search">
                <Search size={18} strokeWidth={1.6} />
                <input placeholder="Terim veya kelime arayın…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                {glossary.length === 0 && <div className="pusula-glossary-empty">Eşleşen terim bulunamadı.</div>}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
