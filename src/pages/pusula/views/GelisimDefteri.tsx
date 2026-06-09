import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, BookText, Search, Target } from "lucide-react";
import { Headline } from "../../brain/primitives";
import { employees } from "../data";
import {
  GLOSSARY,
  GUIDEBOOK_LEVELS,
  GUIDEBOOK_ROLES,
  ROLE_ASA,
  sectionFor,
} from "../data-gelisim";
import type { GuidebookLevel, GuidebookRole, TopicStatus } from "../types-gelisim";
import { StatusToggle } from "../components/StatusToggle";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * Gelişim Defteri — dijital takip kitapçığı. Rol + seviye + 4-durum işaretleme.
 * İşaretler oturum boyunca korunur (overrides). Bu işaretleme aynı zamanda
 * "neyi ne zaman işaretledim" öğrenme pattern'inin sinyalidir. Skor yok.
 */
export function GelisimDefteri() {
  const [mode, setMode] = useState<"takip" | "sozluk">("takip");
  const [role, setRole] = useState<GuidebookRole>("Satış Danışmanı");
  const [level, setLevel] = useState<GuidebookLevel>("Başlangıç");
  const [empId, setEmpId] = useState(employees[3]?.id ?? employees[0].id); // Ece (yeni) varsayılan
  const [overrides, setOverrides] = useState<Record<string, TopicStatus>>({});
  const [search, setSearch] = useState("");

  const section = sectionFor(role, level);
  const emp = employees.find((e) => e.id === empId) ?? employees[0];

  const statusOf = (id: string, base: TopicStatus): TopicStatus => overrides[id] ?? base;
  const pick = (id: string, s: Exclude<TopicStatus, "Boş">, base: TopicStatus) =>
    setOverrides((prev) => ({ ...prev, [id]: statusOf(id, base) === s ? "Boş" : s }));

  const marked = section
    ? section.topics.filter((t) => statusOf(t.id, t.status) !== "Boş").length
    : 0;

  const glossary = useMemo(
    () =>
      GLOSSARY.filter(
        (g) =>
          g.term.toLowerCase().includes(search.toLowerCase()) ||
          g.definition.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <div className="pusula-book">
      <div className="pusula-place-head">
        <div>
          <Headline ital="Gelişim" roman="Defteri" size={32} />
          <div className="pusula-sub">
            8 haftalık saha programı — koç, çıktı almadan tablet üzerinden takip eder.
          </div>
        </div>
        <div className="pusula-seg">
          <button className={mode === "takip" ? "on" : ""} onClick={() => setMode("takip")}>
            <BookOpen size={14} /> Takip
          </button>
          <button className={mode === "sozluk" ? "on" : ""} onClick={() => setMode("sozluk")}>
            <BookText size={14} /> Sözlük
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "takip" ? (
          <motion.div
            key="takip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* rol + kişi seçici */}
            <div className="pusula-book-controls">
              <div className="pusula-pills">
                {GUIDEBOOK_ROLES.map((r) => (
                  <button key={r} className={`pusula-pill ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>
                    {r}
                  </button>
                ))}
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

            {/* ASA referans şeridi */}
            <div className="pusula-asa-strip">
              <span className="pusula-asa-strip-eb">Ana Sorumluluk Alanları</span>
              {ROLE_ASA[role].map((a) => (
                <span key={a.label} className="pusula-asa-chip">
                  {a.label} <em>{a.weight}</em>
                </span>
              ))}
            </div>

            {/* seviye sekmeleri */}
            <div className="pusula-level-tabs">
              {GUIDEBOOK_LEVELS.map((lv) => (
                <button key={lv} className={`pusula-level-tab ${level === lv ? "on" : ""}`} onClick={() => setLevel(lv)}>
                  <span className="pusula-level-name">{lv}</span>
                  <span className="pusula-level-week">
                    {lv === "Başlangıç" ? "1–4 Hafta" : lv === "Orta" ? "5–6 Hafta" : "7–8 Hafta"}
                  </span>
                </button>
              ))}
            </div>

            {/* başlık satırı */}
            <div className="pusula-book-legend">
              <span>{emp.name} · {role} · {section?.weeks}</span>
              <span className="pusula-book-legend-stats">
                Teorik · Uyguluyor · Gelişmeli · Öğretir
              </span>
            </div>

            {/* konular */}
            <div className="pusula-topics">
              {section?.topics.map((t, i) => {
                const st = statusOf(t.id, t.status);
                return (
                  <motion.div
                    key={t.id}
                    className="pusula-topic"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, ease: EASE }}
                  >
                    <div className="pusula-topic-id">
                      <span className="pusula-topic-cat">{t.category}</span>
                      <span className="pusula-topic-title">
                        <span className="pusula-topic-no">{t.no}.</span> {t.title}
                      </span>
                    </div>
                    <StatusToggle status={st} onPick={(s) => pick(t.id, s, t.status)} />
                  </motion.div>
                );
              })}
            </div>

            <div className="pusula-book-foot">
              <span className="pusula-book-count">
                {marked} / {section?.topics.length} konu işaretli — değişiklikler {emp.name}'in defterine işlenir.
              </span>
              <button className="pusula-apply">
                <Target size={15} /> Durumu Kaydet
              </button>
            </div>

            <div className="pusula-assure pusula-assure-row">
              <span>İleri seviye konular = orta/usta gelişim içeriği</span>
              <span>Herkes gelişir — koç da dahil</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sozluk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="pusula-glossary-search">
              <Search size={18} strokeWidth={1.6} />
              <input
                placeholder="Terim veya kelime arayın…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
              {glossary.length === 0 && (
                <div className="pusula-glossary-empty">Eşleşen terim bulunamadı.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
