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
import { aptitudeSuggestions } from "../data-competency";
import { tenureOf } from "../data-staff";
import { useT } from "../i18n";

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

  return (
    <div className="pusula-profile">
      <aside className="pusula-profile-rail">
        <Eyebrow>{t("e.persons")}</Eyebrow>
        <div className="pusula-profile-list">
          {employees.map((p) => (
            <button
              key={p.id}
              className={`pusula-profile-pick ${p.id === active.id ? "on" : ""}`}
              onClick={() => onSelect(p)}
            >
              <PersonAvatar name={p.name} dark={p.level === MasteryLevel.Coach} size={26} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="pusula-profile-main">
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
