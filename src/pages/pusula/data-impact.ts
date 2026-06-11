// src/pages/pusula/data-impact.ts
// ETKİ — gelişim → performans bağı (sunumun 7. ve 9. slaytlarının ekran hâli).
// İddia: kişi seviye atladıkça BİREYSEL conversion yükselir; gelişmeden kalsaydı
// çizgisi düz kalırdı — aradaki fark insan gelişiminden gelir.
// TÜM SAYILAR TEMSİLÎDİR (pilot hedefi); sahadan gerçek veri gelince değişir.

import { pick } from "./i18n";

export interface ImpactStage {
  key: string;
  label: string;
  /** gelişen kişinin bireysel conversion'ı (%) */
  grown: number;
  /** gelişmeden kalsaydı (%) — düz referans */
  flat: number;
}

/** Seviye ekseni: Yeni → Yetkin → Usta → Öğretebilir. */
export function impactCurve(): ImpactStage[] {
  return [
    { key: "yeni", label: pick({ tr: "Yeni", en: "New", es: "Nuevo" }), grown: 16, flat: 16 },
    { key: "yetkin", label: pick({ tr: "Yetkin", en: "Proficient", es: "Competente" }), grown: 19, flat: 16 },
    { key: "usta", label: pick({ tr: "Usta", en: "Master", es: "Maestro" }), grown: 22, flat: 16 },
    { key: "ogretebilir", label: pick({ tr: "Öğretebilir", en: "Can teach", es: "Puede enseñar" }), grown: 25, flat: 16 },
  ];
}

/** Öneri isabeti — dönem dönem yükselir (geriye dönük test). */
export const HIT_RATE = [62, 71, 80, 86];

export interface ImpactStat {
  v: string;
  k: string;
  s: string;
}

export function impactStats(): ImpactStat[] {
  return [
    {
      v: "+9",
      k: pick({ tr: "puan · bireysel conversion", en: "pts · individual conversion", es: "ptos · conversión individual" }),
      s: pick({ tr: "Yeni → Öğretebilir yolculuğunda", en: "across the New → Can-teach journey", es: "en el viaje Nuevo → Puede enseñar" }),
    },
    {
      v: "−2",
      k: pick({ tr: "hafta · ramp süresi", en: "weeks · ramp time", es: "semanas · tiempo de adaptación" }),
      s: pick({ tr: "eksiksiz, sıralı oryantasyonla", en: "with a complete, ordered onboarding", es: "con una incorporación completa y ordenada" }),
    },
    {
      v: "−40%",
      k: pick({ tr: "koç hazırlık süresi", en: "coach prep time", es: "tiempo de preparación del coach" }),
      s: pick({ tr: "plan/rapor taslakları hazır geldiği için", en: "drafts arrive ready for plans/reports", es: "los borradores llegan listos" }),
    },
    {
      v: "%100",
      k: pick({ tr: "örtük bilgi korunur", en: "tacit knowledge retained", es: "conocimiento tácito retenido" }),
      s: pick({ tr: "usta ayrılsa da yöntemi kurumda kalır", en: "the method stays even if the master leaves", es: "el método queda aunque se vaya el maestro" }),
    },
  ];
}

export const impactNote = (): string =>
  pick({
    tr: "Göstergeler temsilî pilot hedefidir — sahadan gerçek veri geldikçe geriye dönük testle doğrulanır.",
    en: "Indicators are representative pilot targets — validated by backtesting as real floor data arrives.",
    es: "Los indicadores son objetivos piloto representativos — se validan con backtesting al llegar datos reales.",
  });
