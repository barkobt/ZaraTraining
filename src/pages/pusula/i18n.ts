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

  // ── güvence ibareleri ──
  "a.decision": { tr: "Karar sizde — öneri, dayatma değil", en: "Your decision — a suggestion, not a mandate", es: "Tu decisión — sugerencia, no imposición" },
  "a.constraints": { tr: "Sert kısıtlar korundu: mola · kapasite · yetkinlik", en: "Hard constraints kept: breaks · capacity · competency", es: "Restricciones: descansos · capacidad · competencia" },
  "a.worker": { tr: "Bu profili çalışan da görür", en: "The worker sees this profile too", es: "El empleado también ve este perfil" },
  "a.noscore": { tr: "Skor yok, sıralama yok — yalnız nitel okuma", en: "No score, no ranking — qualitative read only", es: "Sin puntaje ni ranking — solo lectura cualitativa" },

  // ── ortak eyebrow ──
  "e.thesis": { tr: "Pusula'nın tezi", en: "Pusula's thesis", es: "Tesis de Pusula" },
};

export function tr(key: string, lang: Lang): string {
  return S[key]?.[lang] ?? S[key]?.tr ?? key;
}

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
