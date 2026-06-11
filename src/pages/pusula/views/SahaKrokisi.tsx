import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, MapPin, Footprints, ShieldAlert, DoorOpen, Users, TrendingUp, UserPlus, Check } from "lucide-react";
import { Eyebrow, Headline } from "../../brain/primitives";
import { byId, employees } from "../data";
import { compShort, compShortCaps, personCompetencies, rankForZoneByNeeds, zoneFitReason, type CompKey, type CompNeed } from "../data-competency";
import { bestFlexFor } from "../staffing";
import { MasteryLevel } from "../types";
import { FLOOR_ZONES, markerSize, trafficLevel, trafficLabel, zoneLabel, zoneMetric, driverLabel, deptLabel, DEPTS, type ZoneDriver, type Dept } from "../data-floor";
import { PersonAvatar } from "../components/PersonAvatar";
import { MasteryChip } from "../components/MasteryChip";
import { usePersistentState } from "../session-store";
import { pick, useT } from "../i18n";

const LEVEL_TONE: Record<string, string> = {
  Zirve: "var(--zara-gold)",
  Yoğun: "var(--zara-gold-soft)",
  Dengede: "var(--zara-sage)",
  Sakin: "var(--zara-line-strong)",
};

/** Üç reyon bölümü → ayırt edici ton (kullanıcının beyaz çizgilerle ayırdığı bölümler). */
// monokromda bölümler TONLA ayrışır: kadın = dolu siyah · çocuk = açık grİ · erkek = orta grİ
const DEPT_TONE: Record<Exclude<Dept, null>, string> = {
  kadin: "#0a0a0a",
  cocuk: "rgba(0,0,0,0.34)",
  erkek: "#6f6f6f",
};
const deptTone = (d: Dept): string => (d ? DEPT_TONE[d] : "var(--zara-line-strong)");

const DRIVER_ICON: Record<ZoneDriver, typeof Footprints> = {
  footfall: Footprints,
  alarm: ShieldAlert,
  fitting: DoorOpen,
  queue: Users,
  sellthrough: TrendingUp,
};

/** Sakin zone için keşif adayı: zone'un BİRİNCİL talebi kendisinde hiç kanıtsız ilk kişi. */
function discoveryCandidate(needs: CompNeed[]): { name: string; comp: CompKey } | null {
  if (!needs.length) return null;
  const primary = [...needs].sort((a, b) => b.weight - a.weight)[0].comp;
  for (const e of employees) {
    const pc = personCompetencies(e.id).find((p) => p.comp === primary);
    if (pc?.state.kind === "unexplored") return { name: e.name.split(" ")[0], comp: primary };
  }
  return null;
}

/**
 * Saha Krokisi — Pusula gerçek mağaza planını ve zone'ları TANIR. Her zone bir
 * SÜRÜCÜ METRİKten beslenir (Welcome → ziyaret + ürün alarmı; reyon → sell-through;
 * kabin → trafik/bekleme; kasa → kuyruk) ve canlı yoğunluğu dinamik (pulse) markörle
 * gösterilir. Rol olan zone'a tıkla → Pusula "kimi koyar + neden" önerir VE müsait
 * (boşta) bir eli o zone'a EŞLER. NİTEL — skor yok.
 */
export function SahaKrokisi() {
  const t = useT();
  const [selId, setSelId] = useState("welcome");
  // eklenen müsait eller görünüm değişiminde kaybolmasın
  const [added, setAdded] = usePersistentState<Record<string, string>>("saha.added", {}); // zoneId → eklenen flex id
  const sel = FLOOR_ZONES.find((z) => z.id === selId) ?? FLOOR_ZONES[0];
  const lvl = trafficLevel(sel.traffic);
  // eşleşme = zone TALEBİ (needs) × kişi KANITI — pozisyon adı değil, yetkinlik
  const ranked = sel.needs.length
    ? rankForZoneByNeeds(sel.needs)
        .map(byId)
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .slice(0, 2)
    : [];
  // müsait eşleme: boşta havuzdan, ön cepheye atanmışları hariç tutarak talebe en uygun
  const flex = sel.role ? bestFlexFor(sel.role, ranked.map((p) => p.id)) : null;
  const discCand = sel.needs.length && sel.traffic < 62 ? discoveryCandidate(sel.needs) : null;
  const addedId = added[sel.id];
  const addedPerson = addedId ? byId(addedId) : null;

  return (
    <div className="pkroki">
      <div className="pusula-place-head">
        <div>
          <Headline ital={pick({ tr: "Saha", en: "Floor", es: "Sala" })} roman={pick({ tr: "Krokisi", en: "Plan", es: "Plano" })} size={32} />
          <div className="pusula-sub">
            {pick({
              tr: "Pusula krokiyi ve zone'ları tanır — her zone kendi metriğinden beslenir; Welcome ziyaret + ürün alarmından, reyon sell-through'dan.",
              en: "Pusula recognizes the plan and zones — each zone fed by its own metric; Welcome from visits + product alarm, the floor from sell-through.",
              es: "Pusula reconoce el plano y las zonas — cada zona alimentada por su métrica; Welcome por visitas + alarma de producto, la sala por sell-through.",
            })}
          </div>
          <div className="pv4-how">{t("how.saha")}</div>
        </div>
        <span className="pkroki-badge">
          <Compass size={12} strokeWidth={1.8} /> {FLOOR_ZONES.filter((z) => z.area === "on").length} {pick({ tr: "zone tanındı", en: "zones recognized", es: "zonas reconocidas" })}
        </span>
      </div>

      {/* bölüm lejantı — Kadın / Çocuk / Erkek */}
      <div className="pkroki-legend">
        {DEPTS.map((d) => (
          <span key={d} className="pkroki-legend-item">
            <i style={{ background: DEPT_TONE[d] }} /> {deptLabel(d)}
          </span>
        ))}
      </div>

      <div className="pkroki-grid">
        {/* kroki sahnesi */}
        <div className="pkroki-stage">
          <img src="/pusula-plan.png" alt={pick({ tr: "Mağaza krokisi", en: "Store floor plan", es: "Plano de la tienda" })} className="pkroki-plan" />
          {FLOOR_ZONES.map((z) => {
            const size = markerSize(z.traffic);
            const hot = z.traffic >= 85;
            const on = selId === z.id;
            const tone = deptTone(z.dept);
            return (
              <button
                key={z.id}
                className={`pkroki-marker ${on ? "on" : ""} ${z.area === "context" ? "ctx" : ""}`}
                style={{ left: `${z.x}%`, top: `${z.y}%`, ["--dept" as string]: tone }}
                onClick={() => setSelId(z.id)}
              >
                <span className={`pkroki-dot ${hot ? "hot" : ""}`} style={{ width: size, height: size, borderColor: tone, color: tone }}>
                  <span className="pkroki-ring" style={{ borderColor: tone }} />
                  <MapPin size={Math.round(size * 0.38)} strokeWidth={1.6} />
                </span>
                <span className="pkroki-lab">
                  {zoneLabel(z).split(" · ")[0]} <em>· {trafficLabel(z.traffic).toLowerCase()}</em>
                </span>
              </button>
            );
          })}
        </div>

        {/* tavsiye paneli */}
        <aside className="pkroki-panel">
          <Eyebrow>{pick({ tr: "Seçili alan", en: "Selected area", es: "Área seleccionada" })}</Eyebrow>
          <div className="pkroki-zonehead">
            <div className="pkroki-zonename">{zoneLabel(sel).split(" · ")[0]}</div>
            <span className="pkroki-zonedept" style={{ color: deptTone(sel.dept) }}>{deptLabel(sel.dept)}</span>
          </div>

          {/* sürücü metrik çipleri */}
          <div className="pkroki-drivers">
            {sel.drivers.map((d) => {
              const DIcon = DRIVER_ICON[d];
              return (
                <span key={d} className={`pkroki-driver ${d}`}>
                  <DIcon size={12} strokeWidth={1.8} /> {driverLabel(d)}
                </span>
              );
            })}
          </div>

          {/* zone TALEBİ — bu zone hangi yetkinlikleri ister (ağırlık noktalarıyla) */}
          {sel.needs.length > 0 && (
            <div className="pkroki-traffic">
              <span className="pkroki-traffic-k">{t("e.zoneWants")}</span>
              <div className="pkroki-needs">
                {[...sel.needs]
                  .sort((a, b) => b.weight - a.weight)
                  .map((n) => (
                    <span key={n.comp} className="pkroki-need">
                      {compShortCaps(n.comp)} <i>{"●".repeat(n.weight)}</i>
                    </span>
                  ))}
              </div>
              {sel.pressure && <div className="pkroki-pressure">{pick(sel.pressure)}</div>}
            </div>
          )}

          <div className="pkroki-traffic">
            <span className="pkroki-traffic-k">{pick({ tr: "Canlı metrik", en: "Live metric", es: "Métrica en vivo" })}</span>
            <span className="pkroki-traffic-lvl" style={{ color: LEVEL_TONE[lvl] }}>{trafficLabel(sel.traffic)}</span>
            <div className="pkroki-traffic-bar">
              <motion.i
                animate={{ width: `${sel.traffic}%` }}
                transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                style={{ background: LEVEL_TONE[lvl] }}
              />
            </div>
            <div className="pkroki-metric-read">{zoneMetric(sel)}</div>
          </div>

          {sel.role ? (
            <>
              <div className="pkroki-eb2">{t("e.whoFits")}</div>
              <div className="pkroki-people">
                {ranked.map((p) => (
                  <div key={p.id} className="pkroki-person">
                    <PersonAvatar name={p.name} dark={p.level === MasteryLevel.Coach} size={30} />
                    <div className="pkroki-person-id">
                      <span className="pkroki-person-name">{p.name}</span>
                      <span className="pkroki-person-why">
                        {zoneFitReason(p.id, sel.needs) ??
                          pick({ tr: "talep × kanıt eşleşmesi", en: "demand × evidence match", es: "demanda × evidencia" })}
                      </span>
                    </div>
                    <MasteryChip level={p.level} />
                  </div>
                ))}
                {/* eklenen müsait el — placed listesine akar */}
                {addedPerson && (
                  <motion.div className="pkroki-person added" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ease: [0.22, 0.61, 0.36, 1] }}>
                    <PersonAvatar name={addedPerson.name} dark={addedPerson.level === MasteryLevel.Coach} size={30} />
                    <div className="pkroki-person-id">
                      <span className="pkroki-person-name">{addedPerson.name}</span>
                      <span className="pkroki-person-why pkroki-added-why">
                        <Check size={11} strokeWidth={2.4} /> {pick({ tr: "müsaitten eklendi", en: "added from available", es: "añadido de disponibles" })}
                      </span>
                    </div>
                    <button className="pkroki-undo" onClick={() => setAdded((a) => { const n = { ...a }; delete n[sel.id]; return n; })}>
                      {pick({ tr: "geri al", en: "undo", es: "deshacer" })}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* müsait eşleme — boştaki eli bu zone'a ekle */}
              {flex && !addedPerson && (
                <div className="pkroki-flex">
                  <UserPlus size={13} strokeWidth={1.8} />
                  <span className="pkroki-flex-txt">
                    {flex.discovery
                      ? pick({
                          tr: `Keşif eşleme: ${flex.name} bu alanın işini hiç denemedi — buddy eşliğinde keşif olarak eklenebilir (hem gelişim hem sinyal)`,
                          en: `Discovery match: ${flex.name} has never tried this area's work — can be added as discovery with a buddy (growth and signal)`,
                          es: `Coincidencia de descubrimiento: ${flex.name} nunca probó este trabajo — puede añadirse como descubrimiento con buddy`,
                        })
                      : pick({
                          tr: `Müsait eşleme: ${flex.name} → bu zone'a ekle (${flex.fit})`,
                          en: `Available match: ${flex.name} → add to this zone (${flex.fit})`,
                          es: `Coincidencia disponible: ${flex.name} → añadir a esta zona (${flex.fit})`,
                        })}
                  </span>
                  <button className="pkroki-flex-add" onClick={() => setAdded((a) => ({ ...a, [sel.id]: flex.id }))}>
                    {flex.discovery
                      ? pick({ tr: "Keşif olarak ekle", en: "Add as discovery", es: "Añadir como descubrimiento" })
                      : pick({ tr: "Ekle", en: "Add", es: "Añadir" })}
                  </button>
                </div>
              )}

              <div className="pkroki-advice">
                {sel.traffic >= 85
                  ? pick({
                      tr: `Zirve — ${ranked[0]?.name.split(" ")[0]} ile tepe-saat kapsamasını güçlendir.`,
                      en: `Peak — strengthen peak-hour coverage with ${ranked[0]?.name.split(" ")[0]}.`,
                      es: `Pico — refuerza la cobertura de hora pico con ${ranked[0]?.name.split(" ")[0]}.`,
                    })
                  : sel.traffic >= 62
                    ? pick({
                        tr: `Yoğunlaşıyor — ${ranked[0]?.name.split(" ")[0]} burada en güçlü el.`,
                        en: `Getting busy — ${ranked[0]?.name.split(" ")[0]} is the strongest hand here.`,
                        es: `Se está concurriendo — ${ranked[0]?.name.split(" ")[0]} es la mano más fuerte aquí.`,
                      })
                    : discCand
                    ? pick({
                        tr: `Dengede — keşif alanı: ${discCand.name} burada ${compShort(discCand.comp)} sinyali toplayabilir (buddy eşliğinde).`,
                        en: `Balanced — discovery area: ${discCand.name} could build ${compShort(discCand.comp)} signal here (with a buddy).`,
                        es: `Equilibrado — área de descubrimiento: ${discCand.name} puede generar señal de ${compShort(discCand.comp)} aquí (con buddy).`,
                      })
                    : pick({
                        tr: "Dengede — esnek tut; gelişen biri için iyi keşif alanı.",
                        en: "Balanced — keep it flexible; a good discovery area for someone developing.",
                        es: "Equilibrado — mantenlo flexible; buena área de descubrimiento para alguien en desarrollo.",
                      })}
              </div>
            </>
          ) : (
            <div className="pkroki-ctxnote">
              {pick({
                tr: "Bağlam alanı — Pusula buraya doğrudan kadro atamaz; metrik akışı izlenir ve komşu zone'ları besler.",
                en: "Context area — Pusula doesn't assign staff here directly; the metric flow is watched and feeds neighboring zones.",
                es: "Área de contexto — Pusula no asigna personal aquí directamente; se observa el flujo de la métrica y alimenta las zonas vecinas.",
              })}
            </div>
          )}

          <div className="pusula-assure pusula-assure-row">
            <span>{pick({ tr: "Metrik = saha verisi, kişi skoru değil", en: "Metric = floor data, not a person score", es: "Métrica = datos de sala, no una puntuación personal" })}</span>
            <span>{pick({ tr: "Karar koçundur — öneri, dayatma değil", en: "The decision is the coach's — a suggestion, not a mandate", es: "La decisión es del coach — sugerencia, no imposición" })}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
