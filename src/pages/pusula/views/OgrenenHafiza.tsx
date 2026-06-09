import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Sparkles, Check, RotateCcw } from "lucide-react";
import { Eyebrow, Headline } from "../../brain/primitives";
import { employees } from "../data";
import { notesFor } from "../data-hafiza";
import type { ArchiveNote } from "../types-gelisim";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const TONE_WORD: Record<ArchiveNote["tone"], string> = {
  developing: "gelişiyor",
  steady: "istikrarlı",
  strong: "güçlü",
};
const TONE_LEVEL: Record<ArchiveNote["tone"], number> = { developing: 1, steady: 2, strong: 3 };

/**
 * Öğrenen Hafıza — koçluk gözlem arşivi (bilgi kaybolmasın). Zaman çizelgesi +
 * editoryal kağıt-form + nitel gidişat. Altta "koçluk anı": yeni gözlem →
 * Pusula yöntemi çıkarır → koç onaylar (extract-then-confirm). Sentiment % YOK.
 */
export function OgrenenHafiza() {
  const [empId, setEmpId] = useState(employees[3]?.id ?? employees[0].id);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];
  const notes = notesFor(empId);
  const [selected, setSelected] = useState<ArchiveNote | null>(notes[0] ?? null);

  // koçluk anı (extract-then-confirm)
  const [draft, setDraft] = useState("");
  const [extracted, setExtracted] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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
          <Headline ital="Öğrenen" roman="Hafıza" size={32} />
          <div className="pusula-sub">
            Her gözlem tarihiyle, koçuyla birikir — aktarılan bilgi kaybolmaz.
          </div>
        </div>
      </div>

      {/* kişi seçici */}
      <div className="pusula-pills pusula-mem-people">
        {employees.map((e) => (
          <button
            key={e.id}
            className={`pusula-pill ${e.id === empId ? "on" : ""}`}
            onClick={() => onSelectEmp(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className="pusula-mem-grid">
        {/* sol: gidişat + zaman çizelgesi */}
        <div className="pusula-mem-left">
          <div className="pusula-mem-trend">
            <span className="pusula-pocket-eb">Gidişat</span>
            <div className="pusula-mem-trend-dots">
              {[...notes].reverse().map((n) => (
                <span
                  key={n.id}
                  className="pusula-mem-trend-dot"
                  style={{ height: 6 + TONE_LEVEL[n.tone] * 6, opacity: 0.35 + TONE_LEVEL[n.tone] * 0.2 }}
                  title={`${n.date} · ${TONE_WORD[n.tone]}`}
                />
              ))}
            </div>
            <span className="pusula-mem-trend-word">
              son kayıt: <em>{notes[0] ? TONE_WORD[notes[0].tone] : "—"}</em>
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
                  <span className="pusula-mem-kind">{n.kind}</span>
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
                    <div className="pusula-paper-eb">Gözlem Formu · {selected.kind}</div>
                    <h3>{selected.topic}</h3>
                  </div>
                  <div className="pusula-paper-date">{selected.date.split("-").reverse().join(".")}</div>
                </div>
                <div className="pusula-paper-row">
                  <span className="pusula-paper-key">Çalışan</span>
                  <span className="pusula-paper-val">{emp.name}</span>
                </div>
                <div className="pusula-paper-note">{selected.note}</div>
                <div className="pusula-paper-foot">
                  <div>
                    <div className="pusula-paper-key">Koç / Gözlemci</div>
                    <div className="pusula-paper-author">{selected.author}</div>
                  </div>
                  {selected.signed && <div className="pusula-paper-sign">{selected.author.replace(/[. ]/g, "")}</div>}
                </div>
                <span className="pusula-paper-mark">ARŞİV</span>
              </motion.div>
            ) : (
              <div className="pusula-paper-empty">
                <FileText size={40} strokeWidth={1.2} />
                <p>Zaman çizelgesinden bir gözlem seçin.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* koçluk anı: extract-then-confirm */}
      <div className="pusula-coach">
        <Eyebrow gold>Koçluk anı · yeni gözlem</Eyebrow>
        <div className="pusula-coach-row">
          <textarea
            className="pusula-coach-input"
            placeholder={`${emp.name} için bugünkü gözlemini yaz… (Pusula yöntemi çıkarıp onayını ister)`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setExtracted(null);
              setConfirmed(false);
            }}
            rows={2}
          />
          <button className="pusula-coach-btn" onClick={extract} disabled={!draft.trim()}>
            <Sparkles size={14} /> Yöntemi çıkar
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
                  <Check size={15} /> Yöntem {emp.name}'in hafızasına eklendi — bir sonraki koça aktarılabilir.
                </div>
              ) : (
                <>
                  <p>
                    Yöntemini şöyle anladım: <em>“{extracted}”</em> — doğru mu?
                  </p>
                  <div className="pusula-coach-actions">
                    <button className="pusula-coach-yes" onClick={() => setConfirmed(true)}>
                      <Check size={14} /> Doğru, kaydet
                    </button>
                    <button className="pusula-coach-no" onClick={() => setExtracted(null)}>
                      <RotateCcw size={14} /> Düzelt
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
