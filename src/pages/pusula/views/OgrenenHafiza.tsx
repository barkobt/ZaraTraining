import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Tag, Check, RotateCcw, BrainCircuit } from "lucide-react";
import { Eyebrow, Headline } from "../primitives";
import { pick, useT } from "../i18n";
import { byId, employees } from "../data";
import { NOTED_IDS, inferTags, notePatterns, notesFor, type InferredTags } from "../data-hafiza";
import { COMP_KEYS, compShort, type CompKey } from "../data-competency";
import { METHOD_IDS, methodLabel, type MethodId } from "../data-curriculum";
import { PersonAvatar } from "../components/PersonAvatar";
import { usePersistentState } from "../session-store";
import type { ArchiveNote, NoteKind } from "../types-gelisim";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const TONE_WORD: Record<ArchiveNote["tone"], () => string> = {
  developing: () => pick({ tr: "gelişiyor", en: "growing", es: "en desarrollo" }),
  steady: () => pick({ tr: "istikrarlı", en: "steady", es: "estable" }),
  strong: () => pick({ tr: "güçlü", en: "strong", es: "fuerte" }),
};
const TONE_LEVEL: Record<ArchiveNote["tone"], number> = { developing: 1, steady: 2, strong: 3 };

/** Not türü (NoteKind) etiketi — aktif dilde. */
const kindLabel = (k: NoteKind): string =>
  k === "Gözlem"
    ? pick({ tr: "Gözlem", en: "Observation", es: "Observación" })
    : k === "Koçluk"
      ? pick({ tr: "Koçluk", en: "Coaching", es: "Coaching" })
      : pick({ tr: "Değerlendirme", en: "Evaluation", es: "Evaluación" });

/** Günün koçluk aksiyonları — kaynaklı takip defteri: her satırın saati, kişisi,
 *  KAYNAĞI (defter/örüntü/usta yolu) ve kalıcı tamam durumu vardır. */
const DAY_ACTIONS: Array<{ who: string; slot: string; src: "defter" | "orunto" | "usta"; what: () => string }> = [
  { who: "Asya", slot: "11:30", src: "defter", what: () => pick({ tr: "Kabin temelleri → 2. gölge seansı (Fatma ile)", en: "Fitting-room basics → 2nd shadow session (with Fatma)", es: "Básicos de probador → 2ª sesión de acompañamiento (con Fatma)" }) },
  { who: "Asya", slot: "13:00", src: "orunto", what: () => pick({ tr: "Müşteri yaklaşımı → ilk temas pratiği", en: "Customer approach → first-contact practice", es: "Acercamiento al cliente → práctica de primer contacto" }) },
  { who: "Kaan", slot: "16:00", src: "defter", what: () => pick({ tr: "Tepe-saat dayanıklılığı → kontrollü maruziyet", en: "Peak-hour resilience → controlled exposure", es: "Resistencia en hora pico → exposición controlada" }) },
  { who: "Gamze", slot: "17:30", src: "orunto", what: () => pick({ tr: "Sprinter akışı → mola ve araç düzeni", en: "Sprinter flow → breaks and equipment order", es: "Flujo Sprinter → descansos y orden de herramientas" }) },
  { who: "Fatma", slot: "20:00", src: "usta", what: () => pick({ tr: "Usta aktarımı → Asya'ya kabin sıra-yönetimi", en: "Mastery transfer → fitting-room queue management to Asya", es: "Transferencia de maestría → gestión de cola de probador a Asya" }) },
];
const SRC_LABEL: Record<"defter" | "orunto" | "usta", () => string> = {
  defter: () => pick({ tr: "Defterden", en: "From booklet", es: "Del cuadernillo" }),
  orunto: () => pick({ tr: "Örüntüden", en: "From pattern", es: "Del patrón" }),
  usta: () => pick({ tr: "Usta Yolu", en: "Mentor path", es: "Ruta de mentor" }),
};

/**
 * Öğrenen Hafıza — koçluk gözlem arşivi (bilgi kaybolmasın). Zaman çizelgesi +
 * editoryal kağıt-form + nitel gidişat. Altta "koçluk anı": yeni gözlem →
 * Pusula yöntemi çıkarır → koç onaylar (extract-then-confirm). Sentiment % YOK.
 */
export function OgrenenHafiza() {
  const t = useT();
  const [empId, setEmpId] = useState(NOTED_IDS[0] ?? employees[0].id);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];
  // koçun oturumda eklediği notlar — onaylanan gözlem GERÇEKTEN arşive düşer
  const [addedNotes, setAddedNotes] = usePersistentState<Record<string, ArchiveNote[]>>("hafiza.added", {});
  const notes = [...(addedNotes[empId] ?? []), ...notesFor(empId)].sort((a, b) => b.date.localeCompare(a.date));
  const [selected, setSelected] = useState<ArchiveNote | null>(notes[0] ?? null);
  // Tahsis numarası — gözlem kuruma kayıtlı TEKİL kimlik alır (müze/arşiv dili).
  // "Bireysel gözlem → kurumsal hafıza" dönüşümünü tek jetonla somutlaştırır.
  const accNo = (n: ArchiveNote) =>
    `ZA · ${n.date.slice(0, 4)} · ${n.date.slice(5, 7)} · ${(([...n.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)) % 900) + 100}`;

  // örüntüler — eklenen notlar kümelere CANLI düşer; öneri onayı kalıcı
  const patterns = notePatterns(Object.values(addedNotes).flat());
  const [patOk, setPatOk] = usePersistentState<Record<string, boolean>>("hafiza.patterns", {});

  // kişi duvarı katlama: notu olanlar önde, kalanı istenince
  const [showAllPeople, setShowAllPeople] = useState(false);
  const noteCountOf = (id: string) => (addedNotes[id]?.length ?? 0) + notesFor(id).length;

  // koçluk anı (extract-then-confirm) — çıkarım Senaryo+Yöntem ÇİFTİDİR
  // (ilk cümle değil): başlık taksonomiden doğar, koç çipleri düzeltebilir.
  const [draft, setDraft] = useState("");
  const [tags, setTags] = useState<InferredTags | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // günün aksiyonları — görünüm değişiminde KAYBOLMAZ (session-store)
  const [doneActions, setDoneActions] = usePersistentState<Record<number, boolean>>("hafiza.dayq", {});
  const doneCount = DAY_ACTIONS.filter((_, i) => doneActions[i]).length;
  const toggleAction = (i: number) => setDoneActions((p) => ({ ...p, [i]: !p[i] }));

  const onSelectEmp = (id: string) => {
    setEmpId(id);
    const n = [...(addedNotes[id] ?? []), ...notesFor(id)].sort((a, b) => b.date.localeCompare(a.date));
    setSelected(n[0] ?? null);
    setDraft("");
    setTags(null);
    setConfirmed(false);
  };

  const extract = () => {
    const text = draft.trim();
    if (!text) return;
    setTags(inferTags(text));
    setConfirmed(false);
  };

  const titleOf = (tg: InferredTags) => `${compShort(tg.scenario)} · ${methodLabel(tg.method)}`;

  // onay = gözlem arşive İŞLENİR (zaman çizelgesi + örüntü sayaçları canlı güncellenir)
  const saveExtracted = () => {
    if (!tags) return;
    const newNote: ArchiveNote = {
      id: `s${Date.now()}`,
      employeeId: empId,
      date: new Date().toISOString().slice(0, 10),
      kind: "Koçluk",
      topic: titleOf(tags),
      note: draft.trim(),
      author: pick({ tr: "Koç (oturum)", en: "Coach (session)", es: "Coach (sesión)" }),
      signed: true,
      tone: "steady",
    };
    setAddedNotes((p) => ({ ...p, [empId]: [newNote, ...(p[empId] ?? [])] }));
    setSelected(newNote);
    setConfirmed(true);
  };

  return (
    <div className="pusula-mem">
      <div className="pusula-place-head">
        <div>
          <Headline ital={t("t.hafiza.i")} roman={t("t.hafiza.r")} size={32} />
          <div className="pusula-sub">
            {pick({ tr: "Her gözlem tarihiyle, koçuyla birikir — aktarılan bilgi kaybolmaz.", en: "Every observation accrues with its date and coach — transferred knowledge is never lost.", es: "Cada observación se acumula con su fecha y su coach — el conocimiento transferido no se pierde." })}
          </div>
          <div className="pv4-how">{t("how.hafiza")}</div>
        </div>
      </div>

      {/* günün koçluk aksiyonları — kaynaklı takip defteri (saat·kişi·kaynak·durum) */}
      <div className="pusula-dayq">
        <div className="pusula-dayq-head">
          <span><span className="pusula-mem-folio">I</span>{pick({ tr: "Bugünün koçluk aksiyonları · takip defteri", en: "Today's coaching actions · tracking ledger", es: "Acciones de coaching de hoy · registro" })}</span>
          <span className="pusula-dayq-prog">
            <u><b style={{ width: `${(doneCount / DAY_ACTIONS.length) * 100}%` }} /></u>
            {doneCount}/{DAY_ACTIONS.length} {pick({ tr: "tamam", en: "done", es: "hecho" })}
          </span>
        </div>
        <div className="pusula-dayq-list">
          {DAY_ACTIONS.map((a, i) => {
            const done = !!doneActions[i];
            return (
              <div key={i} className={`pusula-dayq-item ${done ? "done" : ""}`}>
                <span className="pusula-dayq-slot">{a.slot}</span>
                <span className="pusula-dayq-who">
                  <PersonAvatar name={a.who} size={22} /> {a.who}
                </span>
                <span className="pusula-dayq-what">{a.what()}</span>
                <span className={`pusula-dayq-src s-${a.src}`}>{SRC_LABEL[a.src]()}</span>
                <button className={`pusula-dayq-tick ${done ? "on" : ""}`} onClick={() => toggleAction(i)}>
                  {done
                    ? <><Check size={11} strokeWidth={2.2} /> {pick({ tr: "Yapıldı", en: "Done", es: "Hecho" })}</>
                    : pick({ tr: "Yapıldı işaretle", en: "Mark done", es: "Marcar hecho" })}
                </button>
              </div>
            );
          })}
        </div>
        <div className="pusula-dayq-note">
          {pick({
            tr: "Her satırın kaynağı görünür — aksiyon defterden, örüntüden ya da Usta Yolu'ndan doğar; tamamlanan, dönem raporunda 'kapanan döngü' olur.",
            en: "Every row shows its source — actions come from the booklet, a pattern, or the Mentor Path; completed ones become 'closed loops' in the period report.",
            es: "Cada fila muestra su origen — del cuadernillo, de un patrón o de la Ruta de Mentor; lo completado cierra el ciclo en el informe.",
          })}
        </div>
      </div>

      {/* ÖRÜNTÜLER — hafıza ne öğreniyor: tekrar eden tema → müfredat önerisi */}
      <div className="pusula-patterns">
        <div className="pusula-patterns-head">
          <span className="pusula-patterns-eb">
            <span className="pusula-mem-folio">II</span>
            <BrainCircuit size={13} strokeWidth={1.6} />
            {pick({ tr: "Örüntüler · hafıza ne öğreniyor", en: "Patterns · what the memory is learning", es: "Patrones · qué aprende la memoria" })}
          </span>
          <span className="pusula-patterns-sub">
            {pick({ tr: "tekrar eden tema → müfredat önerisi · koç onaylamadan işlenmez", en: "recurring theme → curriculum suggestion · nothing lands without coach approval", es: "tema recurrente → sugerencia curricular · nada se aplica sin el coach" })}
          </span>
        </div>
        <div className="pusula-patterns-grid">
          {patterns.map((p, i) => (
            <motion.div
              key={p.id}
              className="pusula-pattern"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, ease: EASE }}
            >
              <div className="pusula-pattern-top">
                <em>{p.noteCount}</em>
                <div>
                  <span className="pusula-pattern-theme">{p.theme}</span>
                  <span className="pusula-pattern-meta">
                    {p.noteCount} {pick({ tr: "not", en: "notes", es: "notas" })} · {p.peopleIds.length} {pick({ tr: "kişi", en: "people", es: "personas" })}
                  </span>
                </div>
                <span className="pusula-pattern-faces">
                  {p.peopleIds.slice(0, 3).map((id) => (
                    <PersonAvatar key={id} name={byId(id)?.name ?? id} size={22} />
                  ))}
                </span>
              </div>
              <p className="pusula-pattern-insight">{p.insight}</p>
              <div className="pusula-pattern-sugg">
                <span>{pick({ tr: "Müfredat önerisi", en: "Curriculum suggestion", es: "Sugerencia curricular" })}</span>
                <p>{p.suggestion}</p>
                {patOk[p.id] ? (
                  <span className="pv3-done">
                    <Check size={11} strokeWidth={2.2} /> {pick({ tr: "Müfredata işlendi", en: "Written to curriculum", es: "Aplicado al currículo" })}
                  </span>
                ) : (
                  <button className="pv3-act" onClick={() => setPatOk((m) => ({ ...m, [p.id]: true }))}>
                    <Check size={11} strokeWidth={2.2} /> {t("b.approveApt")}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* kişi seçici — notu olanlar önce, kalanı katlı (+N kişi) */}
      <div className="pusula-pills pusula-mem-people">
        {[...employees]
          .sort((a, b) => noteCountOf(b.id) - noteCountOf(a.id))
          .filter((e) => showAllPeople || noteCountOf(e.id) > 0 || e.id === empId)
          .map((e) => {
            const cnt = noteCountOf(e.id);
            return (
              <button
                key={e.id}
                className={`pusula-pill ${e.id === empId ? "on" : ""} ${cnt ? "hasnotes" : ""}`}
                onClick={() => onSelectEmp(e.id)}
              >
                {e.name}
                {cnt > 0 && <em className="pusula-pill-badge">{cnt}</em>}
              </button>
            );
          })}
        <button className="pusula-pill pusula-pill-more" onClick={() => setShowAllPeople((v) => !v)}>
          {showAllPeople
            ? pick({ tr: "− daralt", en: "− collapse", es: "− contraer" })
            : `+${employees.filter((e) => noteCountOf(e.id) === 0 && e.id !== empId).length} ${pick({ tr: "kişi", en: "people", es: "personas" })}`}
        </button>
      </div>

      {/* ARŞİV — bireysel gözlemler kurumsal kayda işlenir (folyo III) */}
      <div className="pusula-patterns-head pusula-mem-archead">
        <span className="pusula-patterns-eb">
          <span className="pusula-mem-folio">III</span>
          <FileText size={13} strokeWidth={1.6} />
          {pick({ tr: "Arşiv · gözlem kayıtları", en: "Archive · observation records", es: "Archivo · registros de observación" })}
        </span>
      </div>

      <div className="pusula-mem-grid">
        {/* sol: gidişat + zaman çizelgesi */}
        <div className="pusula-mem-left">
          <div className="pusula-mem-trend">
            <div className="pusula-mem-trend-top">
              <span className="pusula-pocket-eb">{pick({ tr: "Gidişat", en: "Trajectory", es: "Trayectoria" })}</span>
              <span className="pusula-mem-trend-word">
                {pick({ tr: "son kayıt:", en: "latest:", es: "último:" })} <em>{notes[0] ? TONE_WORD[notes[0].tone]() : "—"}</em>
              </span>
            </div>
            {/* nitel sparkline: x = zaman, y = ton (gelişiyor→güçlü); sayı basılmaz */}
            {(() => {
              const chron = [...notes].reverse();
              const W = 280;
              const H = 58;
              const px = (i: number) => (chron.length > 1 ? 8 + (i * (W - 16)) / (chron.length - 1) : W / 2);
              const py = (n: ArchiveNote) => H - 10 - (TONE_LEVEL[n.tone] - 1) * ((H - 24) / 2);
              const path = chron.map((n, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(n).toFixed(1)}`).join(" ");
              return (
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="pusula-mem-spark" role="img"
                  aria-label={pick({ tr: "Gözlem tonu gidişatı", en: "Observation tone trajectory", es: "Trayectoria del tono" })}>
                  {[1, 2, 3].map((lv) => (
                    <line key={lv} x1={8} x2={W - 8} y1={H - 10 - (lv - 1) * ((H - 24) / 2)} y2={H - 10 - (lv - 1) * ((H - 24) / 2)}
                      stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                  ))}
                  {chron.length > 1 && (
                    <path d={`${path} L${px(chron.length - 1)},${H - 4} L${px(0)},${H - 4} Z`} fill="rgba(0,0,0,0.04)" />
                  )}
                  <path d={path} fill="none" stroke="var(--zara-ink)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                  {chron.map((n, i) => (
                    <circle key={n.id} cx={px(i)} cy={py(n)} r={i === chron.length - 1 ? 3.4 : 2.2}
                      fill={i === chron.length - 1 ? "var(--zara-ink)" : "var(--zara-bg-white, #fff)"}
                      stroke="var(--zara-ink)" strokeWidth={1.2}>
                      <title>{`${n.date} · ${TONE_WORD[n.tone]()}`}</title>
                    </circle>
                  ))}
                </svg>
              );
            })()}
            <div className="pusula-mem-trend-axis">
              <span>{TONE_WORD.developing()}</span>
              <span>{TONE_WORD.steady()}</span>
              <span>{TONE_WORD.strong()}</span>
            </div>
          </div>

          <div className="pusula-mem-timeline">
            {notes.map((n, i) => (
              <motion.button
                key={n.id}
                className={`pusula-mem-item ${selected?.id === n.id ? "on" : ""}`}
                onClick={() => setSelected(n)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, ease: EASE }}
              >
                <div className="pusula-mem-item-top">
                  <span className="pusula-mem-date">{n.date.split("-").reverse().join(".")}</span>
                  <span className="pusula-mem-kind">{kindLabel(n.kind)}</span>
                </div>
                <div className="pusula-mem-topic">{n.topic}</div>
                <div className="pusula-mem-snippet">{n.note}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* sağ: kağıt-form detay */}
        <div className="pusula-mem-right">
          <AnimatePresence mode="popLayout">
            {selected ? (
              <motion.div
                key={selected.id}
                className="pusula-paper"
                initial={{ opacity: 0, scale: 0.98, rotate: -0.6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.98, rotate: 0.6 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="pusula-paper-head">
                  <div>
                    <div className="pusula-paper-eb">{pick({ tr: "Gözlem Formu", en: "Observation Form", es: "Formulario de Observación" })} · {kindLabel(selected.kind)}</div>
                    <div className="pusula-paper-acc" title={pick({ tr: "Kurum arşiv kayıt no", en: "Institutional archive no.", es: "N.º de archivo institucional" })}>{accNo(selected)}</div>
                    <h3>{selected.topic}</h3>
                  </div>
                  <div className="pusula-paper-date">{selected.date.split("-").reverse().join(".")}</div>
                </div>
                <div className="pusula-paper-row">
                  <span className="pusula-paper-key">{pick({ tr: "Çalışan", en: "Employee", es: "Empleado" })}</span>
                  <span className="pusula-paper-val">{emp.name}</span>
                </div>
                <div className="pusula-paper-note">{selected.note}</div>
                <div className="pusula-paper-foot">
                  <div>
                    <div className="pusula-paper-key">{pick({ tr: "Koç / Gözlemci", en: "Coach / Observer", es: "Coach / Observador" })}</div>
                    <div className="pusula-paper-author">{selected.author}</div>
                  </div>
                  {selected.signed && <div className="pusula-paper-sign">{selected.author.replace(/\./g, "").replace(/\s+/g, " ").trim()}</div>}
                </div>
                <span className="pusula-paper-mark">{pick({ tr: "ARŞİV", en: "ARCHIVE", es: "ARCHIVO" })}</span>
              </motion.div>
            ) : (
              <div className="pusula-paper-empty">
                <FileText size={40} strokeWidth={1.2} />
                <p>{pick({ tr: "Zaman çizelgesinden bir gözlem seçin.", en: "Select an observation from the timeline.", es: "Selecciona una observación de la línea de tiempo." })}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* koçluk anı: extract-then-confirm */}
      <div className="pusula-coach">
        <Eyebrow gold>{pick({ tr: "Koçluk anı · yeni gözlem", en: "Coaching moment · new observation", es: "Momento de coaching · nueva observación" })}</Eyebrow>
        <div className="pusula-coach-row">
          <textarea
            className="pusula-coach-input"
            placeholder={pick({
              tr: `${emp.name.split(" ")[0]} için bugünkü gözlemini yaz…`,
              en: `Write today's observation for ${emp.name.split(" ")[0]}…`,
              es: `Escribe la observación de hoy para ${emp.name.split(" ")[0]}…`,
            })}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setTags(null);
              setConfirmed(false);
            }}
            rows={2}
          />
          <button className="pusula-coach-btn" onClick={extract} disabled={!draft.trim()}>
            <Tag size={14} strokeWidth={1.7} /> {pick({ tr: "Etiketle", en: "Tag it", es: "Etiquetar" })}
          </button>
        </div>

        <AnimatePresence>
          {tags && (
            <motion.div
              className="pusula-coach-confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ease: EASE }}
            >
              {confirmed ? (
                <div className="pusula-coach-done">
                  <Check size={15} /> {pick({
                    tr: `“${titleOf(tags)}” ${emp.name.split(" ")[0]}'in hafızasına işlendi — bir sonraki koça aktarılabilir.`,
                    en: `“${titleOf(tags)}” was written to ${emp.name.split(" ")[0]}'s memory — it can be passed to the next coach.`,
                    es: `“${titleOf(tags)}” se añadió a la memoria de ${emp.name.split(" ")[0]} — puede transmitirse al siguiente coach.`,
                  })}
                </div>
              ) : (
                <>
                  <p>
                    {tags.scenarioHit || tags.methodHit
                      ? pick({ tr: "Gözlemi şöyle etiketledim — yanlışsa çiplerden düzelt:", en: "I tagged the observation like this — fix via the chips if wrong:", es: "Etiqueté la observación así — corrige con los chips:" })
                      : pick({ tr: "Metinden etiket çıkaramadım — senaryo ve yöntemi sen seç:", en: "I couldn't infer tags from the text — pick the scenario and method:", es: "No pude inferir etiquetas — elige escenario y método:" })}
                  </p>
                  <div className="pusula-tagrow">
                    <span className="pusula-tagrow-k">{pick({ tr: "Senaryo", en: "Scenario", es: "Escenario" })}</span>
                    {COMP_KEYS.map((k: CompKey) => (
                      <button
                        key={k}
                        className={`pusula-tagchip ${tags.scenario === k ? "on" : ""}`}
                        onClick={() => setTags({ ...tags, scenario: k, scenarioHit: true })}
                      >
                        {compShort(k)}
                      </button>
                    ))}
                  </div>
                  <div className="pusula-tagrow">
                    <span className="pusula-tagrow-k">{pick({ tr: "Yöntem", en: "Method", es: "Método" })}</span>
                    {METHOD_IDS.map((m: MethodId) => (
                      <button
                        key={m}
                        className={`pusula-tagchip ${tags.method === m ? "on" : ""}`}
                        onClick={() => setTags({ ...tags, method: m, methodHit: true })}
                      >
                        {methodLabel(m)}
                      </button>
                    ))}
                  </div>
                  <p className="pusula-tagtitle">
                    {pick({ tr: "Başlık", en: "Title", es: "Título" })}: <em>“{titleOf(tags)}”</em>
                  </p>
                  <div className="pusula-coach-actions">
                    <button className="pusula-coach-yes" onClick={saveExtracted}>
                      <Check size={14} /> {pick({ tr: "Doğru, kaydet", en: "Correct, save", es: "Correcto, guardar" })}
                    </button>
                    <button className="pusula-coach-no" onClick={() => setTags(null)}>
                      <RotateCcw size={14} /> {pick({ tr: "Vazgeç", en: "Cancel", es: "Cancelar" })}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
