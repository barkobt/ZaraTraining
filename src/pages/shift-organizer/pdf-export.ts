import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GenerateResult, ShiftInputForChart } from "./ChartResult";
import { ROBOTO_REGULAR_BASE64 } from "./fonts/roboto-regular-base64";

/**
 * Günün operasyonel bilgileri — chart1.pdf alt kısmında listelenen alanlar.
 * Tümü opsiyonel; boş olanlar PDF'te gizlenir.
 */
export type ChartAltInfo = {
  aksiyon?: string;       // "Pantolon, Bermuda, Elbise, Çanta, Ecobag"
  cxQr?: string;          // "45"
  ipod?: string;          // "Meral"
  tempe?: string;         // "Sevim"
  istek?: string;         // "Selin"
};

/**
 * Sistemin rol etiketleri — user spec (2026-05-22): "runnerı kaldırdık".
 * Yeni sıra: KABİN → KABİN WELCOMER → SPRINTER → WELCOME → ZONE 2-5 → MOLA.
 * chart1.pdf'teki "RUNNER/WELCOMER" terminolojisi DEĞİL — bizim rol adlarımız
 * uppercase Türkçe yazılır, kelime değişimi yok.
 */
const ROLE_ORDER = [
  "KABİN",
  "KABİN WELCOMER",
  "SPRINTER",
  "WELCOME",
  "ZONE 2",
  "ZONE 3",
  "ZONE 4",
  "ZONE 5",
];

const ROLE_LABELS: Record<string, string> = {
  KABİN: "KABİN",
  "KABİN WELCOMER": "KABİN WELCOMER",
  SPRINTER: "SPRİNTER",          // Türkçe glyph — Roboto destekler
  WELCOME: "WELCOME",
  "ZONE 2": "ZONE 2",
  "ZONE 3": "ZONE 3",
  "ZONE 4": "ZONE 4",
  "ZONE 5": "ZONE 5",
};

function roleLabel(r: string): string {
  return ROLE_LABELS[r] ?? r;
}

function sortRoles(roles: string[]): string[] {
  return [...roles].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a);
    const bi = ROLE_ORDER.indexOf(b);
    if (ai < 0 && bi < 0) return a.localeCompare(b);
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}

/** chart1 saat formatı: "10:00:00" (saniyeli) — referansa birebir. */
function fmtHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00:00`;
}

/** chart1 tarih formatı: "21.04.2026" — TR locale gün.ay.yıl. */
function fmtDate(iso: string): string {
  // "2026-05-22" → "22.05.2026"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/**
 * Chart sonucunu **chart1.pdf paritesinde** PDF olarak indir.
 *
 * Layout (Portrait A4):
 *   - Üstte italik "Günlük Chart" başlık
 *   - Tablo: 1 tarih hücresi + 12 saat hücresi × 9 rol satırı (8 rol + MOLA)
 *   - Sarı header satırı + sarı sol sütun
 *   - Ferah hücreler (~20mm yüksek), büyük font (~9pt)
 *   - Boş hücreler tamamen boş (placeholder yok)
 *   - Mola satırı tablo İÇİNDE — sarı sol etiket, hücrelerinde mola yapan kişiler
 *   - Alt'ta opsiyonel info: aksiyon familyaları, CX QR, IPOD, Tempe, İstek noktası
 */
export function exportChartToPdf(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
  altInfo?: ChartAltInfo,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();   // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 10;

  // ─── Roboto-Regular font embed (Türkçe karakter desteği) ───
  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR_BASE64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");  // bold alias regular'a
  doc.setFont("Roboto", "normal");

  // ─── Başlık: italik "Günlük Chart" — chart1 referans ───
  // Roboto-Italic embed etmiyoruz (bundle ekonomisi); başlık jsPDF italic emulation ile
  doc.setFont("Roboto", "normal");
  doc.setFontSize(16);
  doc.setTextColor(0);
  // İtalik karakterleri elle eğmek yerine düz Roboto bold + spaced caps yaklaşımı
  // chart1 görsel olarak italik diyor ama "Günlük Chart" iki kelime; düz bold bırakıyoruz.
  doc.text("Günlük Chart", pageWidth / 2, 14, { align: "center" });

  // ─── Tablo verisi ───
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = sortRoles([...new Set(result.chart.map((c) => c.role))]);
  const byKey = new Map<string, string[]>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons);

  // Yarım mola tespiti (≤30dk) — saat → set(name)
  // ChartResult ile aynı mantık: yarım molada olan kişi hem MOLA satırında
  // hem normal rol hücrelerinde "X 1/2" suffix'iyle gösterilir.
  const halfBreakSetByHour = new Map<number, Set<string>>();
  if (shifts) {
    const mark = (h: number, name: string) => {
      const set = halfBreakSetByHour.get(h) ?? new Set<string>();
      set.add(name);
      halfBreakSetByHour.set(h, set);
    };
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        // Saat başına KESİŞİM: kısmî kapsanan her saat "1/2" işaretlenir
        // (12:30-13:30 molası 12 ve 13'ün yarısını kapsar — ikisi de kısmî).
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov > 1e-6 && ov < 1 - 1e-6) mark(h, s.short_name);
        }
      }
      // Yarım saat giriş/çıkış: sınır slotu yarım → "1/2" (ChartResult ile aynı).
      if (s.start_hour % 1 === 0.5) mark(Math.floor(s.start_hour), s.short_name);
      if (s.end_hour % 1 === 0.5) mark(Math.floor(s.end_hour), s.short_name);
    }
  }
  const labelName = (name: string, hour: number): string =>
    halfBreakSetByHour.get(hour)?.has(name) ? `${name} 1/2` : name;

  // Mola — saat başına kesişim: tam kapsanan saat tam etiket, kısmî "1/2"
  // (1 saatlik buçuklu mola artık 2 tam saat olarak GÖRÜNMEZ).
  const breaksByHour = new Map<number, string[]>();
  if (shifts) {
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov <= 1e-6) continue;
          const arr = breaksByHour.get(h) ?? [];
          const label = ov >= 1 - 1e-6 ? s.short_name : `${s.short_name} 1/2`;
          if (!arr.includes(label)) arr.push(label);
          breaksByHour.set(h, arr);
        }
      }
    }
  }

  // ─── Head: [tarih_hücresi, saat1, saat2, ...] (hepsi sarı) ───
  const head = [
    [fmtDate(shiftDate), ...hours.map(fmtHour)],
  ];

  // ─── Body: 8 rol satırı + MOLA satırı ───
  const body: string[][] = [];
  for (const r of roles) {
    const row = [
      roleLabel(r),
      ...hours.map((h) =>
        (byKey.get(`${h}|${r}`) ?? [])
          .map((p) => labelName(p, h))
          .join("\n"),
      ),
    ];
    body.push(row);
  }
  // MOLA satırı (her zaman ekle — boş olsa bile chart1 referansında var)
  body.push([
    "MOLA",
    ...hours.map((h) => (breaksByHour.get(h) ?? []).join("\n")),
  ]);

  // ─── Layout hesabı ───
  // Sayfanın ~%80'i tablo: 297 - margin*2 - 14 (başlık) - 50 (alt info reservation) = ~213mm
  // 9 row × ~22mm = 198mm + 1 header row × 14mm = 212mm. Tam oturur.
  // Saat sütun genişliği: (210 - 20 margin - 22 rol) / 12 saat ≈ 14mm.
  // 7pt fontla 14mm hücreye ~14-16 karakter sığar (Kaan Ovezoglu, Sevilay OK).
  const tableHeight = 22;  // mm per row (data rows)

  autoTable(doc, {
    startY: 22,
    head,
    body,
    theme: "grid",
    styles: {
      font: "Roboto",
      fontSize: 7,                // ↓ 8.5 → 7 (isim sığması için)
      cellPadding: 1.5,           // ↓ 2.5 → 1.5
      minCellHeight: tableHeight,
      valign: "middle",
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [20, 20, 20],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [255, 230, 128],   // chart1 sarı
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      minCellHeight: 9,
      cellPadding: 1.5,
    },
    columnStyles: {
      // İlk sütun: tarih/rol etiketi (sarı, bold, ortalı, biraz daha geniş)
      0: {
        fillColor: [255, 230, 128],
        fontStyle: "bold",
        halign: "center",
        cellWidth: 26,            // ↑ 22 → 26 (KABİN WELCOMER tek satıra sığsın)
        fontSize: 8,
      },
    },
    didParseCell: (data) => {
      // Boş hücreler tamamen boş — "—" placeholder yok
      const txt = data.cell.text;
      if (txt.length === 1 && (txt[0] === "" || txt[0] === "—")) {
        data.cell.text = [""];
      }
    },
    tableWidth: pageWidth - margin * 2,
    margin: { left: margin, right: margin, top: 22 },
  });

  // ─── Alt info satırları ───
  // chart1: "Haftanın aksiyon familyaları: ...", "CX QR hedefi: ...", vb.
  // Sadece dolu olanlar yazılır. Bold key + normal value.
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 14;

  // Günün Sorumluları (Liderlik, CX, Runner Lider, iPod, Aksiyon) — Chart UI'sında
  // ResponsibilitiesPanel ile seçilir, DB'de charts.responsibilities jsonb'sine
  // persist olur. PDF altında ayrı bir bölüm olarak listelenir.
  const resp = (result.responsibilities ?? {}) as Record<string, string | null | undefined>;
  const respItems: Array<{ key: string; value: string | undefined }> = [
    { key: "Liderlik", value: resp["Liderlik"] ?? undefined },
    { key: "CX Sorumlusu", value: resp["CX Sorumlusu"] ?? undefined },
    { key: "Runner Lider", value: resp["Runner Lider"] ?? undefined },
    { key: "iPod Sorumlusu", value: resp["iPod Sorumlusu"] ?? undefined },
    { key: "Aksiyon Sorumlusu", value: resp["Aksiyon Sorumlusu"] ?? undefined },
  ];
  const hasResp = respItems.some((it) => it.value && it.value.trim());

  if (hasResp) {
    // Başlık: "Günün Sorumluları"
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text("Günün Sorumluları", margin, y);
    y += 6;
    for (const it of respItems) {
      if (!it.value || !it.value.trim()) continue;
      if (y > pageHeight - 12) break;
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20);
      const labelText = `${it.key}: `;
      doc.text(labelText, margin, y);
      const labelWidth = doc.getTextWidth(labelText);
      doc.setFont("Roboto", "bold");
      doc.text(it.value, margin + labelWidth, y);
      y += 7;
    }
    y += 4; // alt info bölümünden önce bir nefes alanı
  }

  const altItems: Array<{ key: string; value: string | undefined; bold?: boolean }> = [
    { key: "Haftanın aksiyon familyaları", value: altInfo?.aksiyon, bold: true },
    { key: "CX QR hedefi", value: altInfo?.cxQr },
    { key: "IPOD Satışı hedefi / sorumlusu", value: altInfo?.ipod, bold: true },
    { key: "Tempe / ACC sorumlusu", value: altInfo?.tempe, bold: true },
    { key: "İstek noktası sorumlusu", value: altInfo?.istek, bold: true },
  ];

  for (const it of altItems) {
    if (!it.value || !it.value.trim()) continue;
    if (y > pageHeight - 12) break;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20);
    const labelText = `${it.key}: `;
    doc.text(labelText, margin, y);
    const labelWidth = doc.getTextWidth(labelText);
    if (it.bold) {
      doc.setFont("Roboto", "bold");
    }
    doc.text(it.value, margin + labelWidth, y);
    y += 7;
  }

  doc.save(`shift-${shiftDate}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
//  ALAN-BAZLI (area-based) PDF — AYRI ÇIKTI. exportChartToPdf'e DOKUNMAZ.
//
//  Aynı grid mantığı (saatler üstte, hücrede kişiler) ama tek büyük tablo yerine
//  5 ayrı alan tablosu: Woman, Basic, TRF, Fitting Room, Sprinter. Her alanın
//  satırları o alanın alt-rolleri:
//    Woman        → Welcome, Zone 2
//    Basic        → Zone 3, Zone 4
//    TRF          → Zone 5
//    Fitting Room → Kabin Welcomer, Kabin
//    Sprinter     → Sprinter
//
//  Veri AYNI mevcut chart sonucundan (result.chart) gelir — rol→alan eşlemesiyle
//  bölünür. Yeni solver gerektirmez. Sarı yerine alan renkleriyle şık görünüm.
// ════════════════════════════════════════════════════════════════════════════

type AreaGlyphShape = "circle" | "square" | "triDown" | "triUp" | "diamond" | "ring";
type AreaTableDef = {
  label: string;
  sub: string;
  color: [number, number, number];
  glyph: AreaGlyphShape;
  roles: string[]; // result.chart'taki rol adları (Türkçe enum değerleri)
};

/**
 * Renkler + geometrik semboller design-system -3 (AREA_VISUAL) ile aynı —
 * UI'daki AreaGlyph ile birebir eşleşir. Eski doygun renklerin (Tailwind 600)
 * yerine yumuşak editorial palet.
 */
const AREA_TABLES: AreaTableDef[] = [
  { label: "WOMAN", sub: "Welcome · Zone 1-2", color: [194, 90, 124], glyph: "circle", roles: ["WELCOME", "ZONE 2"] },
  { label: "BASIC", sub: "Zone 3-4", color: [63, 102, 168], glyph: "square", roles: ["ZONE 3", "ZONE 4"] },
  { label: "TRF", sub: "Zone 5", color: [198, 125, 51], glyph: "triDown", roles: ["ZONE 5"] },
  { label: "FITTING ROOM", sub: "Kabin", color: [135, 91, 166], glyph: "diamond", roles: ["KABİN WELCOMER", "KABİN"] },
  { label: "SPRINTER", sub: "Joker", color: [91, 147, 85], glyph: "triUp", roles: ["SPRINTER"] },
];

/**
 * Alan glyph'ini PDF header band'ine beyaz çizer (renkli zemin üstünde).
 * cx,cy = merkez (mm), s = kenar/çap (mm). AreaGlyph (SVG) ile aynı sembol seti.
 */
function drawAreaGlyph(doc: jsPDF, shape: AreaGlyphShape, cx: number, cy: number, s: number) {
  const h = s / 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  switch (shape) {
    case "square":
      doc.rect(cx - h, cy - h, s, s, "F");
      break;
    case "circle":
      doc.circle(cx, cy, h, "F");
      break;
    case "triDown":
      doc.triangle(cx - h, cy - h, cx + h, cy - h, cx, cy + h, "F");
      break;
    case "triUp":
      doc.triangle(cx, cy - h, cx + h, cy + h, cx - h, cy + h, "F");
      break;
    case "diamond":
      doc.triangle(cx, cy - h, cx + h, cy, cx, cy + h, "F");
      doc.triangle(cx, cy - h, cx - h, cy, cx, cy + h, "F");
      break;
    case "ring":
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, h, "S");
      doc.circle(cx, cy, h * 0.4, "F");
      break;
  }
}

// Alan kodu (staff.home_area) → tabloda hangi mola satırına düşeceği.
const AREA_LABEL_BY_CODE: Record<string, string> = {
  WOMAN: "WOMAN",
  BASIC: "BASIC",
  TRF: "TRF",
  FITTING_ROOM: "FITTING ROOM",
  SPRINTER: "SPRINTER",
};

/** Rengi beyaza doğru açar (tint). amount=0 → aynı, 1 → beyaz. */
function lighten(c: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(c[0] + (255 - c[0]) * amount),
    Math.round(c[1] + (255 - c[1]) * amount),
    Math.round(c[2] + (255 - c[2]) * amount),
  ];
}

export function exportAreaChartToPdf(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
  altInfo?: ChartAltInfo,
  /** { shortName: home_area | null } — mola satırını doğru alana yazmak için. */
  staffAreaByShortName?: Record<string, string | null>,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableWidth = pageWidth - margin * 2;

  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR_BASE64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  // Başlık
  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text("Günlük Chart — Alan Bazlı", pageWidth / 2, 13, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(fmtDate(shiftDate), pageWidth / 2, 18, { align: "center" });

  // ─── Ortak veri: saatler + (hour|role)→kişiler ───
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const byKey = new Map<string, string[]>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons);

  // Yarım mola / yarım giriş-çıkış → "X 1/2" (mevcut PDF ile aynı kural)
  const halfBreakSetByHour = new Map<number, Set<string>>();
  const breaksByHourArea = new Map<string, string[]>(); // "hour|AREA_LABEL" → kişiler
  if (shifts) {
    const markHalf = (h: number, name: string) => {
      const set = halfBreakSetByHour.get(h) ?? new Set<string>();
      set.add(name);
      halfBreakSetByHour.set(h, set);
    };
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        // saat başına kesişim: kısmî kapsanan her saat "1/2"
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov > 1e-6 && ov < 1 - 1e-6) markHalf(h, s.short_name);
        }
      }
      if (s.start_hour % 1 === 0.5) markHalf(Math.floor(s.start_hour), s.short_name);
      if (s.end_hour % 1 === 0.5) markHalf(Math.floor(s.end_hour), s.short_name);
    }
    // Molaları alana göre dağıt — kişinin home_area'sı hangi tablo ise oraya.
    for (const s of shifts) {
      const code = staffAreaByShortName?.[s.short_name] ?? null;
      const areaLabel = code ? AREA_LABEL_BY_CODE[code] : undefined;
      if (!areaLabel) continue; // alanı yoksa hiçbir mola satırında gösterme
      for (const [bs, be] of s.breaks ?? []) {
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const ov = Math.min(be, h + 1) - Math.max(bs, h);
          if (ov <= 1e-6) continue;
          const key = `${h}|${areaLabel}`;
          const arr = breaksByHourArea.get(key) ?? [];
          const label = ov >= 1 - 1e-6 ? s.short_name : `${s.short_name} 1/2`;
          if (!arr.includes(label)) arr.push(label);
          breaksByHourArea.set(key, arr);
        }
      }
    }
  }
  const labelName = (name: string, hour: number): string =>
    halfBreakSetByHour.get(hour)?.has(name) ? `${name} 1/2` : name;

  let y = 24;
  const ROW_H = 11;

  for (const area of AREA_TABLES) {
    // Bu alan için tablo yüksekliği tahmini → sayfa taşarsa yeni sayfa.
    const dataRows = area.roles.length + 1; // alt-roller + MOLA
    const estH = 7 /*başlık bandı*/ + 8 /*head*/ + dataRows * ROW_H + 5;
    if (y + estH > pageHeight - margin) {
      doc.addPage();
      y = margin + 4;
    }

    // Renkli başlık bandı + geometrik alan sembolü (AreaGlyph ile aynı)
    doc.setFillColor(area.color[0], area.color[1], area.color[2]);
    doc.rect(margin, y, tableWidth, 7, "F");
    drawAreaGlyph(doc, area.glyph, margin + 4, y + 3.5, 3.4);
    doc.setTextColor(255);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    const labelX = margin + 8;
    doc.text(`${area.label}`, labelX, y + 4.9);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.text(area.sub, labelX + doc.getTextWidth(area.label) + 4, y + 4.9);
    y += 7;

    const head = [["", ...hours.map(fmtHour)]];
    const body: string[][] = [];
    for (const r of area.roles) {
      body.push([
        roleLabel(r),
        ...hours.map((h) =>
          (byKey.get(`${h}|${r}`) ?? []).map((p) => labelName(p, h)).join("\n"),
        ),
      ]);
    }
    // MOLA satırı — bu alana ait molalar
    body.push([
      "MOLA",
      ...hours.map((h) => (breaksByHourArea.get(`${h}|${area.label}`) ?? []).join("\n")),
    ]);

    const headTint = lighten(area.color, 0.78);
    const labelTint = lighten(area.color, 0.88);

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "grid",
      styles: {
        font: "Roboto",
        fontSize: 7,
        cellPadding: 1.5,
        minCellHeight: ROW_H,
        valign: "middle",
        halign: "center",
        lineColor: [210, 210, 210],
        lineWidth: 0.2,
        textColor: [25, 25, 25],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: headTint,
        textColor: [40, 40, 40],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
        minCellHeight: 7,
        cellPadding: 1,
      },
      columnStyles: {
        0: {
          fillColor: labelTint,
          textColor: [area.color[0], area.color[1], area.color[2]],
          fontStyle: "bold",
          halign: "left",
          cellWidth: 28,
          fontSize: 7.5,
        },
      },
      didParseCell: (data) => {
        const txt = data.cell.text;
        if (txt.length === 1 && (txt[0] === "" || txt[0] === "—")) {
          data.cell.text = [""];
        }
        // MOLA satırı sol etiketini gri yap (rol değil)
        if (data.section === "body" && data.column.index === 0 && data.cell.raw === "MOLA") {
          data.cell.styles.textColor = [120, 120, 120];
        }
      },
      tableWidth,
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ─── Alt bilgi (sorumlular + altInfo) — mevcut PDF ile aynı içerik ───
  renderAreaBottomInfo(doc, y, result, altInfo, pageHeight, margin);

  doc.save(`shift-${shiftDate}-alan.pdf`);
}

/** Sorumlular + günün operasyonel bilgileri — alan PDF'inin altına. */
function renderAreaBottomInfo(
  doc: jsPDF,
  startY: number,
  result: GenerateResult,
  altInfo: ChartAltInfo | undefined,
  pageHeight: number,
  margin: number,
) {
  let y = startY + 6;
  if (y > pageHeight - 20) {
    doc.addPage();
    y = margin + 4;
  }

  const resp = (result.responsibilities ?? {}) as Record<string, string | null | undefined>;
  const respItems = [
    { key: "Liderlik", value: resp["Liderlik"] },
    { key: "CX Sorumlusu", value: resp["CX Sorumlusu"] },
    { key: "Runner Lider", value: resp["Runner Lider"] },
    { key: "iPod Sorumlusu", value: resp["iPod Sorumlusu"] },
    { key: "Aksiyon Sorumlusu", value: resp["Aksiyon Sorumlusu"] },
  ];
  if (respItems.some((it) => it.value && it.value.trim())) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text("Günün Sorumluları", margin, y);
    y += 6;
    for (const it of respItems) {
      if (!it.value || !it.value.trim()) continue;
      if (y > pageHeight - 12) break;
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20);
      const lt = `${it.key}: `;
      doc.text(lt, margin, y);
      doc.setFont("Roboto", "bold");
      doc.text(it.value, margin + doc.getTextWidth(lt), y);
      y += 7;
    }
    y += 4;
  }

  const altItems = [
    { key: "Haftanın aksiyon familyaları", value: altInfo?.aksiyon },
    { key: "CX QR hedefi", value: altInfo?.cxQr },
    { key: "IPOD Satışı hedefi / sorumlusu", value: altInfo?.ipod },
    { key: "Tempe / ACC sorumlusu", value: altInfo?.tempe },
    { key: "İstek noktası sorumlusu", value: altInfo?.istek },
  ];
  for (const it of altItems) {
    if (!it.value || !it.value.trim()) continue;
    if (y > pageHeight - 12) break;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20);
    const lt = `${it.key}: `;
    doc.text(lt, margin, y);
    doc.setFont("Roboto", "bold");
    doc.text(it.value, margin + doc.getTextWidth(lt), y);
    y += 7;
  }
}
