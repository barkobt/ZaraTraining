import { Eyebrow, Headline } from "../../brain/primitives";
import { asaKpiMap, employees, teachingCard } from "../data";
import { MasteryLevel, type Employee } from "../types";
import { PersonAvatar } from "../components/PersonAvatar";
import { MasteryChip } from "../components/MasteryChip";
import { ConfidenceDots } from "../components/ConfidenceDots";
import { AreaSignals } from "../components/AreaSignals";
import { SkillMatrix } from "../components/SkillMatrix";
import { TendencyCurve } from "../components/TendencyCurve";
import { areaSignals, pusulaReading, sellingPersona } from "../data-program";

/**
 * Profil görünümü — seçili kişinin tam derin profili. Sol şerit kişi seçici.
 * ASA (+kanıt) · ASA→KPI köprüsü · beceri matrisi · gelişim eğrisi · (varsa) Usta Aktarımı.
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

  return (
    <div className="pusula-profile">
      <aside className="pusula-profile-rail">
        <Eyebrow>Kişiler</Eyebrow>
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
        <div className="pusula-profile-head">
          <PersonAvatar name={active.name} dark={active.level === MasteryLevel.Coach} size={56} />
          <div>
            <Headline ital={active.name} roman={active.role} size={30} />
            <div className="pusula-profile-meta">
              <MasteryChip level={active.level} />
              <ConfidenceDots level={active.confidence} />
              <span className="pusula-card-tenure">{active.tenure}</span>
            </div>
            <div className="pusula-reading">
              <span className="pusula-reading-eb">Pusula okuması</span>
              {pusulaReading(active).replace(/\*\*/g, "")}
            </div>
          </div>
        </div>

        <div className="pusula-persona">
          <div className="pusula-persona-main">
            <span className="pusula-persona-eb">Satış personası · enerji</span>
            <div className="pusula-persona-label">{pa.label}</div>
            <div className="pusula-persona-energy">{pa.energy}</div>
          </div>
          <div className="pusula-persona-block">
            <span className="pusula-persona-k">CX davranışı</span>
            <p>{pa.cx}</p>
          </div>
          <div className="pusula-persona-block">
            <span className="pusula-persona-k">Pusula aksiyonu</span>
            <p>{pa.action}</p>
          </div>
        </div>

        <div className="pusula-profile-cols">
          {/* Sol kolon: ASA (+ kanıt) ve gelişim eğrisi */}
          <div className="pusula-profile-col">
            <section className="pusula-profile-block">
              <Eyebrow>Alan sinyalleri · dinamik</Eyebrow>
              <AreaSignals signals={areaSignals(active)} />
            </section>

            <section className="pusula-profile-block">
              <Eyebrow>Gelişim eğrisi</Eyebrow>
              <TendencyCurve points={active.tendency} />
              <div className="pusula-profile-curveword">Son haftalarda istikrarlı gelişiyor.</div>
            </section>

            <section className="pusula-profile-block">
              <Eyebrow>ASA → kanıt KPI</Eyebrow>
              <div className="pusula-asakpi">
                {asaKpiMap.map((m) => (
                  <div key={m.asa} className="pusula-asakpi-row">
                    <span className="pusula-asakpi-asa">{m.asa}</span>
                    <span className="pusula-asakpi-arrow">→</span>
                    <span className="pusula-asakpi-kpi">{m.kpi}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sağ kolon: ASA→KPI köprüsü, beceri matrisi, (varsa) Usta Aktarımı */}
          <div className="pusula-profile-col">
            <section className="pusula-profile-block">
              <Eyebrow>Kanıtlanan güç · KPI</Eyebrow>
              <div className="pusula-kpis">
                {active.kpis.map((k) => (
                  <div key={k.label} className="pusula-kpi">
                    <span className="pusula-kpi-label">{k.label}</span>
                    <span className="pusula-kpi-val">{k.value}</span>
                    {k.evidence && <span className="pusula-kpi-ev">{k.evidence}</span>}
                  </div>
                ))}
              </div>
            </section>

            <section className="pusula-profile-block">
              <Eyebrow>Beceri matrisi</Eyebrow>
              <SkillMatrix skills={active.skills} />
            </section>

            {showTeaching && (
              <section className="pusula-profile-block">
                <Eyebrow gold>Usta Aktarımı</Eyebrow>
                <div className="pusula-teach">
                  <div className="pusula-teach-topic">{teachingCard.topic}</div>
                  <div className="pusula-teach-method">{teachingCard.method}</div>
                  <div className="pusula-teach-confirm">{teachingCard.confirmPrompt}</div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
