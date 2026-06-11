import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Sparkles, Check, RotateCcw, CheckCircle2, Circle } from "lucide-react";
import { Eyebrow, Headline } from "../../brain/primitives";
import { pick, useT } from "../i18n";
import { employees } from "../data";
import { NOTED_IDS, notesFor } from "../data-hafiza";
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

/** Günün koçluk aksiyonları — "sıradaki öğretilecekler" kuyruğu (tiklenir, ilerler). */
const DAY_ACTIONS: Array<{ who: string; what: () => string }> = [
  { who: "Asya", what: () => pick({ tr: "Kabin temelleri → 2. gölge seansı (Fatma ile)", en: "Fitting-room basics → 2nd shadow session (with Fatma)", es: "Básicos de probador → 2ª sesión de acompañamiento (con Fatma)" }) },
  { who: "Asya", what: () => pick({ tr: "Müşteri yaklaşımı → ilk temas pratiği", en: "Customer approach → first-contact practice", es: "Acercamiento al cliente → práctica de primer contacto" }) },
  { who: "Kaan", what: () => pick({ tr: "Tepe-saat dayanıklılığı → 16:00 kontrollü maruziyet", en: "Peak-hour resilience → 16:00 controlled exposure", es: "Resistencia en hora pico → exposición controlada a las 16:00" }) },
  { who: "Gamze", what: () => pick({ tr: "Sprinter akışı → mola ve araç düzeni", en: "Sprinter flow → breaks and equipment order", es: "Flujo Sprinter → descansos y orden de herramientas" }) },
  { who: "Fatma", what: () => pick({ tr: "Usta aktarımı → Asya'ya kabin sıra-yönetimi", en: "Mastery transfer → fitting-room queue management to Asya", es: "Transferencia de maestría → gestión de cola de probador a Asya" }) },
];

/**
 * Öğrenen Hafıza — koçluk gözlem arşivi (bilgi kaybolmasın). Zaman çizelgesi +
 * editoryal kağıt-form + nitel gidişat. Altta "koçluk anı": yeni gözlem →
 * Pusula yöntemi çıkarır → koç onaylar (extract-then-confirm). Sentiment % YOK.
 */
export function OgrenenHafiza() {
  const t = useT();
  const [empId, setEmpId] = useState(NOTED_IDS[0] ?? employees[0].id);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];
  const notes = notesFor(empId);
  const [selected, setSelected] = useState<ArchiveNote | null>(notes[0] ?? null);

  // koçluk anı (extract-then-confirm)
  const [draft, setDraft] = useState("");
  const [extracted, setExtracted] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // günün aksiyonları kuyruğu
  const [doneActions, setDoneActions] = useState<number[]>([]);
  const toggleAction = (i: number) =>
    setDoneActions((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const onSelectEmp = (id: string) => {
    setEmpId(id);
    const n = notesFor(id);
    setSelected(n[0] ?? null);
    setDraft("");
    setExtracted(null);
    setConfirmed(false);
  };

  const extract = () => {
    const text = draft.trim();
    if (!text) return;
    const first = text.split(/[.!?\n]/)[0].trim();
    setExtracted(first.length > 4 ? first : text);
    setConfirmed(false);
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

      {/* günün koçluk aksiyonları — sıradaki öğretilecekler kuyruğu */}
      <div className="pusula-dayq">
        <div className="pusula-dayq-head">
          <span>{pick({ tr: "Bugünün koçluk aksiyonları · sıradaki öğretilecekler", en: "Today's coaching actions · what to teach next", es: "Acciones de coaching de hoy · qué enseñar después" })}</span>
          <span className="pusula-dayq-prog">{doneActions.length}/{DAY_ACTIONS.length} {pick({ tr: "tamam", en: "done", es: "hecho" })}</span>
        </div>
        <div className="pusula-dayq-list">
          {DAY_ACTIONS.map((a, i) => {
            const done = doneActions.includes(i);
            return (
              <button key={i} className={`pusula-dayq-item ${done ? "done" : ""}`} onClick={() => toggleAction(i)}>
                {done ? <CheckCircle2 size={15} strokeWidth={1.7} /> : <Circle size={15} strokeWidth={1.5} />}
                <span className="pusula-dayq-who">{a.who}</span>
                <span className="pusula-dayq-what">{a.what()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* kişi seçici — notu olanlar önce, not sayısı rozetli */}
      <div className="pusula-pills pusula-mem-people">
        {[...employees]
          .sort((a, b) => (NOTED_IDS.includes(b.id) ? 1 : 0) - (NOTED_IDS.includes(a.id) ? 1 : 0))
          .map((e) => {
            const cnt = notesFor(e.id).length;
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
      </div>

      <div className="pusula-mem-grid">
        {/* sol: gidişat + zaman çizelgesi */}
        <div className="pusula-mem-left">
          <div className="pusula-mem-trend">
            <span className="pusula-pocket-eb">{pick({ tr: "Gidişat", en: "Trajectory", es: "Trayectoria" })}</span>
            <div className="pusula-mem-trend-dots">
              {[...notes].reverse().map((n) => (
                <span
                  key={n.id}
                  className="pusula-mem-trend-dot"
                  style={{ height: 6 + TONE_LEVEL[n.tone] * 6, opacity: 0.35 + TONE_LEVEL[n.tone] * 0.2 }}
                  title={`${n.date} · ${TONE_WORD[n.tone]()}`}
                />
              ))}
            </div>
            <span className="pusula-mem-trend-word">
              {pick({ tr: "son kayıt:", en: "latest:", es: "último:" })} <em>{notes[0] ? TONE_WORD[notes[0].tone]() : "—"}</em>
            </span>
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
                  {selected.signed && <div className="pusula-paper-sign">{selected.author.replace(/[. ]/g, "")}</div>}
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
              tr: `${emp.name} için bugünkü gözlemini yaz… (Pusula yöntemi çıkarıp onayını ister)`,
              en: `Write today's observation for ${emp.name}… (Pusula extracts the method and asks you to confirm)`,
              es: `Escribe la observación de hoy para ${emp.name}… (Pusula extrae el método y te pide confirmación)`,
            })}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setExtracted(null);
              setConfirmed(false);
            }}
            rows={2}
          />
          <button className="pusula-coach-btn" onClick={extract} disabled={!draft.trim()}>
            <Sparkles size={14} /> {pick({ tr: "Yöntemi çıkar", en: "Extract method", es: "Extraer método" })}
          </button>
        </div>

        <AnimatePresence>
          {extracted && (
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
                    tr: `Yöntem ${emp.name}'in hafızasına eklendi — bir sonraki koça aktarılabilir.`,
                    en: `The method was added to ${emp.name}'s memory — it can be passed to the next coach.`,
                    es: `El método se añadió a la memoria de ${emp.name} — puede transmitirse al siguiente coach.`,
                  })}
                </div>
              ) : (
                <>
                  <p>
                    {pick({ tr: "Yöntemini şöyle anladım:", en: "Here's how I understood your method:", es: "Así entendí tu método:" })} <em>“{extracted}”</em> — {pick({ tr: "doğru mu?", en: "is that right?", es: "¿es correcto?" })}
                  </p>
                  <div className="pusula-coach-actions">
                    <button className="pusula-coach-yes" onClick={() => setConfirmed(true)}>
                      <Check size={14} /> {pick({ tr: "Doğru, kaydet", en: "Correct, save", es: "Correcto, guardar" })}
                    </button>
                    <button className="pusula-coach-no" onClick={() => setExtracted(null)}>
                      <RotateCcw size={14} /> {pick({ tr: "Düzelt", en: "Fix", es: "Corregir" })}
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
