// src/pages/pusula/i18n.ts
// Hafif i18n — TR/EN/ES. Görünür iskelet (nav · başlıklar · butonlar · filtreler ·
// güvence ibareleri) çevrilir. Domain içeriği (kitapçık topic'leri, koç notları,
// öneriler) bu pasta TR kalır. t("key") → aktif dildeki metin.

import { createContext, useContext } from "react";

export type Lang = "tr" | "en" | "es";
export const LANGS: Lang[] = ["tr", "en", "es"];

type Tri = { tr: string; en: string; es: string };
const S: Record<string, Tri> = {
  // ── nav ──
  "nav.insan": { tr: "İnsan", en: "People", es: "Personas" },
  "nav.gelisim": { tr: "Gelişim", en: "Development", es: "Desarrollo" },
  "nav.sonuc": { tr: "Sonuç", en: "Outcome", es: "Resultado" },
  "hint.kim": { tr: "Kim", en: "Who", es: "Quién" },
  "hint.nasil": { tr: "Nasıl büyür", en: "How they grow", es: "Cómo crece" },
  "hint.ne": { tr: "Ne değişir", en: "What changes", es: "Qué cambia" },
  "item.ekip": { tr: "Ekip", en: "Team", es: "Equipo" },
  "item.profil": { tr: "Profil", en: "Profile", es: "Perfil" },
  "item.defter": { tr: "Gelişim Defteri", en: "Development Log", es: "Cuaderno" },
  "item.hafiza": { tr: "Öğrenen Hafıza", en: "Learning Memory", es: "Memoria" },
  "item.usta": { tr: "Usta Yolu", en: "Mentor Path", es: "Ruta de Mentor" },
  "item.yerlestirme": { tr: "Yerleştirme", en: "Placement", es: "Asignación" },
  "sub.ekip": { tr: "Yaşayan roster", en: "Living roster", es: "Plantilla viva" },
  "sub.profil": { tr: "Derin okuma", en: "Deep read", es: "Lectura profunda" },
  "sub.defter": { tr: "Takip · yetkinlik · dönem", en: "Tracking · competency · period", es: "Seguimiento · competencia" },
  "sub.hafiza": { tr: "Koçluk arşivi", en: "Coaching archive", es: "Archivo de coaching" },
  "sub.usta": { tr: "Mentor eşleşme", en: "Mentor matching", es: "Emparejamiento" },
  "sub.yerlestirme": { tr: "Canlı chart", en: "Live chart", es: "Cuadro en vivo" },
  "item.saha": { tr: "Saha Krokisi", en: "Floor Plan", es: "Plano" },
  "sub.saha": { tr: "Zone + canlı trafik", en: "Zones + live traffic", es: "Zonas + tráfico" },

  // ── view başlıkları (ital · roman) ──
  "t.ekip.i": { tr: "Yaşayan", en: "Living", es: "Equipo" },
  "t.ekip.r": { tr: "Ekip", en: "Team", es: "Vivo" },
  "t.profilSub": {
    tr: "İnsan birincil — rol-tipi ve yaşam evresine göre ayrı izlenir.",
    en: "People first — tracked separately by job type and lifecycle stage.",
    es: "Personas primero — seguidas por tipo de rol y etapa.",
  },
  "t.ekipSub": {
    tr: "İnsan birincil — rol-tipi ve yaşam evresine göre ayrı izlenir.",
    en: "People first — tracked by job type and lifecycle stage.",
    es: "Personas primero — por tipo de rol y etapa de carrera.",
  },
  "t.defter.i": { tr: "Gelişim", en: "Development", es: "Cuaderno" },
  "t.defter.r": { tr: "Defteri", en: "Log", es: "de Desarrollo" },
  "t.hafiza.i": { tr: "Öğrenen", en: "Learning", es: "Memoria" },
  "t.hafiza.r": { tr: "Hafıza", en: "Memory", es: "Viva" },
  "t.usta.i": { tr: "Usta", en: "Mentor", es: "Ruta de" },
  "t.usta.r": { tr: "Yolu", en: "Path", es: "Mentor" },
  "t.yer.i": { tr: "Akşam", en: "Evening", es: "Turno" },
  "t.yer.r": { tr: "Yerleşimi", en: "Placement", es: "Vespertino" },
  "t.yer.sub": {
    tr: "Pusula önerir; koç tek tek uygular. Her kabul cebi biraz daha rahatlatır — öneri, dayatma değil.",
    en: "Pusula suggests; the coach applies one by one. Each acceptance eases the pocket a little more — a suggestion, not a mandate.",
    es: "Pusula sugiere; el coach aplica uno a uno. Cada aceptación relaja un poco más el hueco — sugerencia, no imposición.",
  },
  "l.applied": { tr: "uygulandı", en: "applied", es: "aplicado" },

  // ── filtreler ──
  "f.jobtype": { tr: "İş tipi", en: "Job type", es: "Tipo" },
  "f.lifecycle": { tr: "Yaşam evresi", en: "Lifecycle", es: "Etapa" },
  "f.all": { tr: "Tümü", en: "All", es: "Todos" },

  // ── butonlar ──
  "b.apply": { tr: "Uygula", en: "Apply", es: "Aplicar" },
  "b.undo": { tr: "Geri al", en: "Undo", es: "Deshacer" },
  "b.applyAll": { tr: "Hepsini uygula", en: "Apply all", es: "Aplicar todo" },
  "b.reset": { tr: "Sıfırla", en: "Reset", es: "Reiniciar" },
  "b.reoptimize": { tr: "Yeniden optimize", en: "Re-optimize", es: "Re-optimizar" },
  "b.learning": { tr: "Öğreniyor…", en: "Learning…", es: "Aprendiendo…" },
  "b.save": { tr: "Durumu Kaydet", en: "Save status", es: "Guardar" },
  "b.confirm": { tr: "Onayla", en: "Confirm", es: "Confirmar" },
  "b.edit": { tr: "Düzenle", en: "Edit", es: "Editar" },
  "b.fullProfile": { tr: "Tam profil →", en: "Full profile →", es: "Perfil completo →" },
  "b.openProfile": { tr: "Profili aç →", en: "Open profile →", es: "Abrir perfil →" },
  "c.strong": { tr: "Güçlü", en: "Strong", es: "Fuerte" },
  "c.growing": { tr: "Gelişiyor", en: "Growing", es: "En desarrollo" },

  // ── güvence ibareleri ──
  "a.decision": { tr: "Karar sizde — öneri, dayatma değil", en: "Your decision — a suggestion, not a mandate", es: "Tu decisión — sugerencia, no imposición" },
  "a.constraints": { tr: "Sert kısıtlar korundu: mola · kapasite · yetkinlik", en: "Hard constraints kept: breaks · capacity · competency", es: "Restricciones: descansos · capacidad · competencia" },
  "a.worker": { tr: "Bu profili çalışan da görür", en: "The worker sees this profile too", es: "El empleado también ve este perfil" },
  "a.noscore": { tr: "Skor yok, sıralama yok — yalnız nitel okuma", en: "No score, no ranking — qualitative read only", es: "Sin puntaje ni ranking — solo lectura cualitativa" },

  // ── ortak eyebrow ──
  "e.thesis": { tr: "Pusula'nın tezi", en: "Pusula's thesis", es: "Tesis de Pusula" },

  // ── Profil eyebrow/etiketleri ──
  "e.persons": { tr: "Kişiler", en: "People", es: "Personas" },
  "e.reading": { tr: "Pusula okuması", en: "Pusula reading", es: "Lectura de Pusula" },
  "e.personaEnergy": { tr: "Satış personası · enerji", en: "Selling persona · energy", es: "Persona de venta · energía" },
  "e.cxBehavior": { tr: "CX davranışı", en: "CX behavior", es: "Comportamiento CX" },
  "e.pusulaAction": { tr: "Pusula aksiyonu", en: "Pusula action", es: "Acción de Pusula" },
  "e.liveUpdate": { tr: "Canlı güncelleme", en: "Live update", es: "Actualización en vivo" },
  "e.areaSignals": { tr: "Alan sinyalleri · dinamik", en: "Area signals · dynamic", es: "Señales de área · dinámico" },
  "e.curve": { tr: "Gelişim eğrisi", en: "Development curve", es: "Curva de desarrollo" },
  "e.curveWord": { tr: "Son haftalarda istikrarlı gelişiyor.", en: "Improving steadily in recent weeks.", es: "Mejora de forma constante en las últimas semanas." },
  "e.asaKpi": { tr: "ASA → kanıt KPI", en: "ASA → evidence KPI", es: "ASA → KPI de evidencia" },
  "e.provenKpi": { tr: "Kanıtlanan güç · KPI", en: "Proven strength · KPI", es: "Fortaleza probada · KPI" },
  "e.skills": { tr: "Beceri matrisi", en: "Skill matrix", es: "Matriz de habilidades" },
  "e.teaching": { tr: "Usta Aktarımı", en: "Mastery Transfer", es: "Transferencia de Maestría" },
  "e.asaStrength": { tr: "ASA güç dağılımı", en: "ASA strength map", es: "Mapa de fuerza ASA" },
  "e.trajectory": { tr: "Gelişim yörüngesi · tahmin", en: "Growth trajectory · forecast", es: "Trayectoria de desarrollo · pronóstico" },
  "e.roleReady": { tr: "Rol uygunluğu · hazırlık", en: "Role fit · readiness", es: "Encaje de rol · preparación" },
  "e.upcoming": { tr: "Yaklaşan eğitimler", en: "Upcoming trainings", es: "Formaciones próximas" },
  "l.confidence": { tr: "Güven", en: "Confidence", es: "Confianza" },

  // ── Profil v2 (hikâye akışı) ──
  "e.strongIn": { tr: "Neyde güçlü · kanıtlı yetkinlikler", en: "Strong in · proven competencies", es: "Fortalezas · competencias probadas" },
  "e.behavioral": { tr: "Davranışsal taban · defterden", en: "Behavioral base · from the booklet", es: "Base conductual · del cuadernillo" },
  "e.unexplored": { tr: "Keşfedilmemiş alanlar", en: "Unexplored areas", es: "Áreas sin explorar" },
  "e.shines": { tr: "Nerede parlar · zone uyumu", en: "Where they shine · zone fit", es: "Dónde brilla · encaje de zona" },
  "e.aptitude": { tr: "Kanıt → Öneri → Onay", en: "Evidence → Suggestion → Approval", es: "Evidencia → Sugerencia → Aprobación" },
  "e.nextStep": { tr: "Sıradaki adım", en: "Next step", es: "Próximo paso" },
  "e.zoneWants": { tr: "Bu zone ne ister", en: "What this zone demands", es: "Qué exige esta zona" },
  "e.whoFits": { tr: "Kim uyar · kanıttan", en: "Who fits · from evidence", es: "Quién encaja · por evidencia" },
  "l.pendingCoach": { tr: "koç onayı bekliyor", en: "awaiting coach approval", es: "pendiente del coach" },
  "l.aptApproved": { tr: "Onaylandı — Orquest'e işlenir", en: "Approved — written to Orquest", es: "Aprobado — se registra en Orquest" },
  "l.evidence": { tr: "kanıt", en: "evidence", es: "evidencia" },
  "l.teachBadge": { tr: "Öğretebilir", en: "Can teach", es: "Puede enseñar" },
  "l.growthFit": { tr: "gelişim fırsatı", en: "growth opportunity", es: "oportunidad de desarrollo" },
  "b.approveApt": { tr: "Onayla", en: "Approve", es: "Aprobar" },
  "b.plan": { tr: "Planla", en: "Schedule", es: "Planificar" },
  "l.planned": { tr: "Planlandı", en: "Scheduled", es: "Planificado" },
  "l.searchPerson": { tr: "Kişi ara…", en: "Search person…", es: "Buscar persona…" },
  "l.noresult": { tr: "Eşleşen kişi yok", en: "No matching person", es: "Sin coincidencias" },

  // ── v3 kabuk: tam-ekran menü + Bugün ön sayfası ──
  "item.bugun": { tr: "Bugün", en: "Today", es: "Hoy" },
  "sub.bugun": { tr: "koçun ön sayfası", en: "the coach's front page", es: "portada del coach" },
  "b.menu": { tr: "Menü", en: "Menu", es: "Menú" },
  "a11y.closeMenu": { tr: "Menüyü kapat", en: "Close menu", es: "Cerrar menú" },
  "e.approvalQueue": { tr: "Onay kuyruğu", en: "Approval queue", es: "Cola de aprobación" },
  "e.discoveries": { tr: "Keşif fırsatları", en: "Discovery opportunities", es: "Oportunidades de descubrimiento" },
  "e.todaysMatch": { tr: "Bugünün eşleşmesi", en: "Today's pairing", es: "Emparejamiento de hoy" },
  "e.openTopics": { tr: "Defterde açık", en: "Open in the booklet", es: "Abierto en el cuadernillo" },
  "e.eveningPocket": { tr: "Akşam cebi", en: "Evening pocket", es: "Hueco vespertino" },
  "b.goPlacement": { tr: "Yerleştirmeye git", en: "Go to placement", es: "Ir a asignación" },
  "l.allClear": { tr: "Hepsi tamam — bekleyen yok", en: "All clear — nothing pending", es: "Todo al día — nada pendiente" },
  "l.openTopicsN": { tr: "açık konu", en: "open topics", es: "temas abiertos" },
  "a11y.close": { tr: "Kapat", en: "Close", es: "Cerrar" },
  "a11y.backBrain": { tr: "Brain'e dön", en: "Back to Brain", es: "Volver a Brain" },

  // ── iş tipi (jobType) ──
  "job.mudur": { tr: "Müdür", en: "Manager", es: "Gerente" },
  "job.commercial": { tr: "Commercial", en: "Commercial", es: "Commercial" },
  "job.sales": { tr: "Satış Danışmanı", en: "Sales Assistant", es: "Asesor de Ventas" },
};

export function tr(key: string, lang: Lang): string {
  return S[key]?.[lang] ?? S[key]?.tr ?? key;
}

// ── Üretilmiş içerik (data-program) için aktif dil — render'da set edilir,
// çağrı imzalarını değiştirmeden lang-aware metin sağlar. ──
let _active: Lang = "tr";
export const setActiveLang = (l: Lang) => {
  _active = l;
};
export const activeLang = (): Lang => _active;
/** Üç dilli seç: pick({tr,en,es}). */
export function pick(t: Tri): string {
  return t[_active] ?? t.tr;
}
export type { Tri };

export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "tr",
  setLang: () => {},
});

export function useLang() {
  return useContext(LangCtx);
}
export function useT() {
  const { lang } = useLang();
  return (key: string) => tr(key, lang);
}
