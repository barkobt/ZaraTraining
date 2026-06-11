import { useState } from "react";
import { Eyebrow, Headline } from "../../brain/primitives";
import { employees, jobTypeLabel, teachingCard, teachingText } from "../data";
import { MasteryLevel, type Employee } from "../types";
import { PersonAvatar } from "../components/PersonAvatar";
import { MasteryChip } from "../components/MasteryChip";
import { ConfidenceDots } from "../components/ConfidenceDots";
import { CompetencyCards } from "../components/CompetencyCards";
import { BehavioralStrip } from "../components/BehavioralStrip";
import { ZoneFit } from "../components/ZoneFit";
import { AptitudeStrip } from "../components/AptitudeStrip";
import { GrowthTrajectory } from "../components/GrowthTrajectory";
import { UpcomingTrainings } from "../components/UpcomingTrainings";
import { pusulaReading, sellingPersona } from "../data-program";
import { growthTrajectory, upcomingTrainings } from "../data-profile";
import {
  aptitudeSuggestions,
  channelLabel,
  compLabel,
  discoveryFor,
  personCompetencies,
  provenWord,
} from "../data-competency";
import { notesFor } from "../data-hafiza";
import { tenureOf } from "../data-staff";
import { pick, useT } from "../i18n";

/**
 * Profil — HİKÂYE AKIŞI: Kim → Neyde güçlü (kanıtlı 6 yetkinlik + davranışsal taban
 * + keşfedilmemişler) → Nerede parlar (zone uyumu) → Nereye gidiyor (yörünge+tahmin)
 * → Kanıt→Öneri→Onay (aptitude) → Sıradaki adım (eğitimler + aktarım).
 * Skor/sıralama yok; bar yalnız bireysel gelişim görselidir, kanıt satırı yanındadır.
 */
export function Profil({
  person,
  onSelect,
}: {
  person: Employee | null;
  onSelect: (p: Employee) => void;
}) {
  const active = person ?? employees[0];
  const showTeaching = active.id === teachingCard.masterId;
  const pa = sellingPersona(active);
  const traj = growthTrajectory(active);
  const trainings = upcomingTrainings(active);
  const apts = aptitudeSuggestions(active.id);
  const t = useT();
  // 30 kişilik rail'de hızlı bulma — arama + kaydırılabilir liste
  const [q, setQ] = useState("");
  const railList = q.trim()
    ? employees.filter((p) => p.name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")))
    : employees;

  return (
    <div className="pusula-profile">
      <aside className="pusula-profile-rail">
        <Eyebrow>{t("e.persons")}</Eyebrow>
        <input
          className="pusula-rail-search"
          type="search"
          placeholder={t("l.searchPerson")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="pusula-profile-list">
          {railList.map((p) => (
            <button
              key={p.id}
              className={`pusula-profile-pick ${p.id === active.id ? "on" : ""}`}
              onClick={() => onSelect(p)}
            >
              <PersonAvatar name={p.name} dark={p.level === MasteryLevel.Coach} size={26} />
              <span>{p.name}</span>
            </button>
          ))}
          {railList.length === 0 && <span className="pusula-rail-empty">{t("l.noresult")}</span>}
        </div>
      </aside>

      <div className="pusula-profile-main">
        <div className="pv4-how pv4-how-block">{t("how.profil")}</div>
        {/* ── KİM ── */}
        <div className="pusula-profile-head">
          <PersonAvatar name={active.name} dark={active.level === MasteryLevel.Coach} size={56} />
          <div>
            <Headline ital={active.name} roman={jobTypeLabel(active.id)} size={30} />
            <div className="pusula-profile-meta">
              <MasteryChip level={active.level} />
              <ConfidenceDots level={active.confidence} />
              <span className="pusula-card-tenure">{tenureOf(active)}</span>
            </div>
            <div className="pusula-reading">
              <span className="pusula-reading-eb">{t("e.reading")}</span>
              {pusulaReading(active).replace(/\*\*/g, "")}
            </div>
          </div>
        </div>

        <div className="pusula-persona">
          <div className="pusula-persona-main">
            <span className="pusula-persona-eb">{t("e.personaEnergy")}</span>
            <div className="pusula-persona-label">{pa.label}</div>
            <div className="pusula-persona-energy">{pa.energy}</div>
          </div>
          <div className="pusula-persona-block">
            <span className="pusula-persona-k">{t("e.cxBehavior")}</span>
            <p>{pa.cx}</p>
          </div>
          <div className="pusula-persona-block">
            <span className="pusula-persona-k">{t("e.pusulaAction")}</span>
            <p>{pa.action}</p>
          </div>
        </div>
        <div className="pusula-persona-live">
          <span className="pusula-persona-livek">{t("e.liveUpdate")}</span>
          {pa.live}
        </div>

        {/* ── NEYDE GÜÇLÜ · kanıtlı yetkinlikler + davranışsal taban ── */}
        <section className="pusula-profile-block">
          <Eyebrow gold>{t("e.strongIn")}</Eyebrow>
          <CompetencyCards personId={active.id} />
          <BehavioralStrip emp={active} />
        </section>

        <div className="pusula-profile-cols">
          {/* ── NEREDE PARLAR · zone uyumu ── */}
          <div className="pusula-profile-col">
            <section className="pusula-profile-block">
              <Eyebrow>{t("e.shines")}</Eyebrow>
              <ZoneFit emp={active} />
            </section>
          </div>

          {/* ── NEREYE GİDİYOR · yörünge + tahmin ── */}
          <div className="pusula-profile-col">
            <section className="pusula-profile-block">
              <Eyebrow>{t("e.trajectory")}</Eyebrow>
              <GrowthTrajectory traj={traj} />
            </section>

            {/* ── AI'IN KATKILARI · tahmin + güven + kanıt + onay hakkı ──
                 Her satır 4 parçalı sunulur (mimari rapor): TAHMİN, GÜVEN(SOFT),
                 KANIT KANALI, ONAY KOÇTA. Keşfedilmemiş ≠ zayıf. */}
            <section className="pusula-profile-block">
              <Eyebrow gold>{pick({ tr: "AI'ın katkıları · tahmin & kanıt", en: "AI contributions · prediction & evidence", es: "Aportes de la IA · predicción y evidencia" })}</Eyebrow>
              <div className="pusula-aic">
                {apts[0] && (
                  <div className="pusula-aic-row">
                    <span className="k">{pick({ tr: "Tahmin", en: "Prediction", es: "Predicción" })}</span>
                    <div className="b">
                      <p>
                        {compLabel(apts[0].comp)}: {provenWord(apts[0].from)} <i>→</i> {provenWord(apts[0].to)}{" "}
                        {pick({ tr: "(2 dönem içinde · temsilî)", en: "(within 2 periods · representative)", es: "(en 2 periodos · representativo)" })}
                      </p>
                      <span className="m">
                        {pick({ tr: "kanıt", en: "evidence", es: "evidencia" })}: {channelLabel(apts[0].evidence.channel)} · {pick({ tr: "onay koçta", en: "coach approves", es: "aprueba el coach" })}
                      </span>
                    </div>
                  </div>
                )}
                {(() => {
                  const d = discoveryFor(active.id);
                  return d ? (
                    <div className="pusula-aic-row">
                      <span className="k disc">{pick({ tr: "Keşif", en: "Discovery", es: "Exploración" })}</span>
                      <div className="b">
                        <p>
                          {compLabel(d.comp)} {pick({ tr: "alanında veri yok — yargı değil; sakin saatte", en: "has no data — not a judgment; in a calm hour,", es: "sin datos — no es juicio; en hora tranquila," })} {d.buddyName} {pick({ tr: "eşliğinde keşif önerildi.", en: "an accompanied discovery shift is suggested.", es: "se sugiere un turno de exploración acompañado." })}
                        </p>
                        <span className="m">{pick({ tr: "soğuk başlangıç — geniş aralık, genel öneri", en: "cold start — wide interval, generic suggestion", es: "arranque frío — intervalo amplio" })}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="pusula-aic-row">
                  <span className="k">{pick({ tr: "Yerleştirme", en: "Placement", es: "Ubicación" })}</span>
                  <div className="b">
                    <p>
                      {personCompetencies(active.id).filter((c) => c.state.kind === "proven").length}{" "}
                      {pick({ tr: "kanıtlı alan zone eşleşmesini besliyor — akşam cebi önerilerinde aday.", en: "proven areas feed zone matching — a candidate in evening-pocket suggestions.", es: "áreas comprobadas alimentan el emparejamiento de zonas." })}
                    </p>
                    <span className="m">{pick({ tr: "kanıt kişide değil, öneridedir", en: "evidence lives on the suggestion, not the person", es: "la evidencia vive en la sugerencia" })}</span>
                  </div>
                </div>
                {notesFor(active.id).length > 0 && (
                  <div className="pusula-aic-row">
                    <span className="k">{pick({ tr: "Hafıza", en: "Memory", es: "Memoria" })}</span>
                    <div className="b">
                      <p>
                        {notesFor(active.id).length} {pick({ tr: "koç notu örüntü motorunu besliyor — yöntemler kurumda kalır.", en: "coach notes feed the pattern engine — methods stay with the company.", es: "notas alimentan el motor de patrones — los métodos quedan en la empresa." })}
                      </p>
                      <span className="m">{pick({ tr: "kanal: kitapçık + koç", en: "channel: booklet + coach", es: "canal: cuadernillo + coach" })}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ── KANIT → ÖNERİ → ONAY · aptitude döngüsü ── */}
        {apts.length > 0 && (
          <section className="pusula-profile-block">
            <Eyebrow gold>{t("e.aptitude")}</Eyebrow>
            <AptitudeStrip items={apts} />
          </section>
        )}

        {/* ── SIRADAKİ ADIM · eğitimler + (varsa) usta aktarımı ── */}
        <div className="pusula-profile-cols">
          <div className="pusula-profile-col">
            <section className="pusula-profile-block pusula-upcoming-block">
              <Eyebrow>{t("e.nextStep")}</Eyebrow>
              <UpcomingTrainings items={trainings} />
            </section>
          </div>
          {showTeaching && (
            <div className="pusula-profile-col">
              <section className="pusula-profile-block">
                <Eyebrow gold>{t("e.teaching")}</Eyebrow>
                {(() => {
                  const tc = teachingText();
                  return (
                    <div className="pusula-teach">
                      <div className="pusula-teach-topic">{tc.topic}</div>
                      <div className="pusula-teach-method">{tc.method}</div>
                      <div className="pusula-teach-confirm">{tc.confirmPrompt}</div>
                    </div>
                  );
                })()}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
