import jsPDF from "jspdf";
import autoTable, { type Styles } from "jspdf-autotable";
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

/** Kesirli saat: 14 → "14", 14.5 → "14.5". 1/2'ler 0.5 sayılır; saat alt-toplamı
 *  ve günlük toplam (toplam insan-saat) buçuklu olabilir. */
function fmtHalf(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Tarih eyebrow'unu (charSpace ile) TAM ortalanmış çizer — jsPDF'in align
 *  center'ı charSpace'i hesaba katmadığı için genişliği elle hesaplıyoruz. */
function drawCenteredEyebrow(doc: jsPDF, text: string, centerX: number, y: number, charSpace: number) {
  const w = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
  doc.text(text, centerX - w / 2, y, { charSpace });
}

// ─── "Günün Bilgileri" ikonları — jsPDF vektör primitifleriyle çizilen ince
//     line-icon set (DS altın aksan #B8935A). EMOJİ YOK; kurumsal, editöryel. ───
type InfoIcon = "leader" | "qr" | "runner" | "phone" | "action" | "bag" | "plus";

function drawInfoIcon(doc: jsPDF, type: InfoIcon, cx: number, cy: number) {
  doc.setDrawColor(184, 147, 90);
  doc.setFillColor(184, 147, 90);
  doc.setLineWidth(0.3);
  switch (type) {
    case "leader": // dolu eşkenar dörtgen — liderlik aksanı
      doc.triangle(cx, cy - 1.3, cx + 1.1, cy, cx, cy + 1.3, "F");
      doc.triangle(cx, cy - 1.3, cx - 1.1, cy, cx, cy + 1.3, "F");
      break;
    case "runner": // sağ ok — akış / runner
      doc.line(cx - 1.3, cy, cx + 1.2, cy);
      doc.line(cx + 1.2, cy, cx + 0.5, cy - 0.6);
      doc.line(cx + 1.2, cy, cx + 0.5, cy + 0.6);
      break;
    case "phone": // telefon — iPod
      doc.roundedRect(cx - 0.85, cy - 1.4, 1.7, 2.8, 0.35, 0.35, "S");
      doc.line(cx - 0.35, cy + 0.95, cx + 0.35, cy + 0.95);
      break;
    case "action": // askı — aksiyon familyaları
      doc.line(cx - 1.3, cy + 0.7, cx + 1.3, cy + 0.7);
      doc.line(cx - 1.3, cy + 0.7, cx, cy - 0.5);
      doc.line(cx + 1.3, cy + 0.7, cx, cy - 0.5);
      doc.line(cx, cy - 0.5, cx, cy - 1.1);
      break;
    case "bag": // çanta — Tempe / ACC (aksesuar)
      doc.roundedRect(cx - 1.0, cy - 0.4, 2.0, 1.9, 0.25, 0.25, "S");
      doc.line(cx - 0.55, cy - 0.4, cx - 0.4, cy - 1.3);
      doc.line(cx + 0.55, cy - 0.4, cx + 0.4, cy - 1.3);
      doc.line(cx - 0.4, cy - 1.3, cx + 0.4, cy - 1.3);
      break;
    case "plus": // artı — istek noktası
      doc.line(cx, cy - 1.2, cx, cy + 1.2);
      doc.line(cx - 1.2, cy, cx + 1.2, cy);
      break;
    case "qr": // QR kare — CX QR
      doc.rect(cx - 1.0, cy - 1.0, 0.8, 0.8, "F");
      doc.rect(cx + 0.2, cy - 1.0, 0.8, 0.8, "F");
      doc.rect(cx - 1.0, cy + 0.2, 0.8, 0.8, "F");
      doc.rect(cx + 0.2, cy + 0.2, 0.8, 0.8, "S");
      break;
  }
  doc.setLineWidth(0.2);
}

type InfoItem = { icon: InfoIcon; key: string; value: string };

/**
 * "Günün Bilgileri" panelini çizer (sorumlular + altInfo): ince altın ayraç +
 * serif başlık, her satırda ikon + aralıklı uppercase anahtar + mürekkep değer.
 * Sayfa taşarsa YENİ SAYFA açar (eskiden `break` ile kesiliyordu → alan PDF'inde
 * "1-2 satır yazılıp gerisi çıkmıyor" bug'ı). Final y döner.
 */
function renderDayInfo(
  doc: jsPDF,
  startY: number,
  result: GenerateResult,
  altInfo: ChartAltInfo | undefined,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  /** Günlük toplam insan-saat (örn 97.5) — başlık satırının sağ ucunda gösterilir. */
  grandTotal?: number,
): number {
  const resp = (result.responsibilities ?? {}) as Record<string, string | null | undefined>;
  const items: InfoItem[] = [];
  const add = (icon: InfoIcon, key: string, value: string | null | undefined) => {
    if (value && value.trim()) items.push({ icon, key, value: value.trim() });
  };
  add("leader", "Liderlik", resp["Liderlik"]);
  add("qr", "CX Sorumlusu", resp["CX Sorumlusu"]);
  add("runner", "Runner Lider", resp["Runner Lider"]);
  add("phone", "iPod Sorumlusu", resp["iPod Sorumlusu"]);
  add("action", "Aksiyon Sorumlusu", resp["Aksiyon Sorumlusu"]);
  add("action", "Haftanın aksiyon familyaları", altInfo?.aksiyon);
  add("qr", "CX QR hedefi", altInfo?.cxQr);
  add("phone", "iPod satışı hedefi / sorumlusu", altInfo?.ipod);
  add("bag", "Tempe / ACC sorumlusu", altInfo?.tempe);
  add("plus", "İstek noktası sorumlusu", altInfo?.istek);
  if (items.length === 0) return startY;

  const bottom = pageHeight - margin;
  let y = startY;

  // İnce altın ayraç + serif başlık
  doc.setDrawColor(184, 147, 90);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  y += 6.5;
  doc.setFont("times", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(26, 22, 20);
  doc.text("Günün Bilgileri", margin, y);
  // Sağ uçta günlük toplam insan-saat (1/2'ler 0.5) — serif değer + mono etiket.
  if (grandTotal != null) {
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.setTextColor(26, 22, 20);
    const tv = `${fmtHalf(grandTotal)} sa`;
    doc.text(tv, pageWidth - margin, y, { align: "right" });
    const tvW = doc.getTextWidth(tv);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(150, 138, 120);
    doc.text("GÜNLÜK TOPLAM", pageWidth - margin - tvW - 3, y, { align: "right", charSpace: 0.15 });
  }
  y += 7;

  // ── ASLA yeni sayfaya taşma. Önce tek sütunda adaptif yükseklikle dene; sığmazsa
  //    İKİ SÜTUNA geç (sağdaki boşluk). Her şey TEK sayfada kalır. ──
  const topY = y;
  const avail = Math.max(8, bottom - topY);
  const MIN_RH = 5.0;
  const MAX_RH = 7.2;
  // Tek sütunda OKUNAKLI (≥MIN_RH) yükseklikle sığar mı? Sığmazsa 2 sütuna geç.
  // rowH'u available alandan TÜRET (taban clamp YOK) → rowsPerCol*rowH ≤ avail,
  // yani ASLA sayfa altına taşmaz (kullanıcı: yeni sayfa açma, yana geç).
  const cols = Math.min(MAX_RH, avail / items.length) < MIN_RH ? 2 : 1;
  const rowsPerCol = Math.ceil(items.length / cols);
  const rowH = Math.min(MAX_RH, avail / rowsPerCol);
  const colW = (pageWidth - margin * 2) / cols;
  const valSize = cols === 2 ? 8.4 : 9;

  items.forEach((it, i) => {
    const col = Math.floor(i / rowsPerCol);
    const x = margin + col * colW;
    const yy = topY + (i - col * rowsPerCol) * rowH;
    drawInfoIcon(doc, it.icon, x + 1.9, yy - 1.0);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.1);
    doc.setTextColor(150, 138, 120);
    const keyT = it.key.toLocaleUpperCase("tr-TR");
    doc.text(keyT, x + 6.5, yy, { charSpace: 0.2 });
    const kw = doc.getTextWidth(keyT) + 0.2 * Math.max(0, keyT.length - 1) + 3.5;
    doc.setFontSize(valSize);
    doc.setTextColor(26, 22, 20);
    const valX = x + 6.5 + kw;
    // Değer sütun sınırını aşmasın (2-sütunda uzun "aksiyon familyaları").
    doc.text(it.value, valX, yy, { maxWidth: Math.max(20, x + colW - valX - 2) });
  });
  return topY + rowsPerCol * rowH;
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

  // ─── Başlık: SERİF "Günlük Chart" (jsPDF built-in Times — editöryel DS serif
  //     hissi, "ü" WinAnsi'de var) + altına TAM ortalı aralıklı tarih eyebrow ───
  doc.setFont("times", "normal");
  doc.setFontSize(21);
  doc.setTextColor(26, 22, 20); // DS mürekkep #1A1614
  doc.text("Günlük Chart", pageWidth / 2, 15, { align: "center" });
  // Tarih eyebrow: "17 · 06 · 2026" — geniş aralık, sıcak stone, tam ortalı
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 138, 120);
  drawCenteredEyebrow(doc, fmtDate(shiftDate).split(".").join("  ·  "), pageWidth / 2, 20.5, 0.5);

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

  // ─── Saat başına AKTİF (alt toplam) — 1/2'ler 0.5 sayılır → kesirli (örn 14.5).
  //     Günlük toplam = Σ = toplam insan-saat (örn 97.5). ───
  const loadByHour = new Map<number, number>();
  for (const h of hours) {
    let sum = 0;
    for (const r of roles) {
      for (const p of byKey.get(`${h}|${r}`) ?? []) {
        sum += halfBreakSetByHour.get(h)?.has(p) ? 0.5 : 1;
      }
    }
    loadByHour.set(h, sum);
  }
  const grandTotal = [...loadByHour.values()].reduce((a, b) => a + b, 0);
  const maxLoad = Math.max(1, ...loadByHour.values());

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

  // Editöryel palet (DS): şampanya-altın header/sol sütun, mürekkep yazı,
  // ince sıcak-gri grid, krem alt-satır tonu. Tablo YAPISI değişmez.
  const CHAMPAGNE: [number, number, number] = [233, 216, 181]; // #E9D8B5
  const INK: [number, number, number] = [26, 22, 20];          // #1A1614
  const WARM_LINE: [number, number, number] = [201, 192, 178]; // sıcak stone
  const CREAM_ALT: [number, number, number] = [250, 248, 243]; // #FAF8F3

  // Saat sütunlarının x-geometrisini yakala (yoğunluk şeridi tablo ile hizalı çizilsin).
  const colGeom = new Map<number, { cx: number; x: number; w: number }>();

  autoTable(doc, {
    startY: 24,
    head,
    body,
    theme: "grid",
    didDrawCell: (data) => {
      if (data.section === "head") {
        colGeom.set(data.column.index, {
          cx: data.cell.x + data.cell.width / 2,
          x: data.cell.x,
          w: data.cell.width,
        });
      }
    },
    styles: {
      font: "Roboto",
      fontSize: 7,                // ↓ 8.5 → 7 (isim sığması için)
      cellPadding: 1.5,           // ↓ 2.5 → 1.5
      minCellHeight: tableHeight,
      valign: "middle",
      halign: "center",
      lineColor: WARM_LINE,
      lineWidth: 0.2,
      textColor: INK,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: CHAMPAGNE,
      textColor: INK,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      minCellHeight: 9,
      cellPadding: 1.5,
    },
    // Çift sıralarda çok hafif krem ton — okunabilirlik, sakin editöryel his.
    alternateRowStyles: {
      fillColor: CREAM_ALT,
    },
    columnStyles: {
      // İlk sütun: tarih/rol etiketi (şampanya, bold, ortalı, biraz daha geniş).
      // columnStyles alternateRowStyles'ı ezer → sol sütun her satırda altın kalır.
      0: {
        fillColor: CHAMPAGNE,
        textColor: INK,
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
        return;
      }
      // Uzun isim/çok kişi sütunu taşırmasın: en uzun satıra göre fontu kademeli
      // küçült (tablo yapısı korunur, hücre genişler/taşar yerine yazı sığar).
      if (data.section === "body" && data.column.index > 0) {
        const longest = txt.reduce((m, t) => Math.max(m, t.length), 0);
        if (longest > 14) data.cell.styles.fontSize = 5.5;
        else if (longest > 11) data.cell.styles.fontSize = 6;
      }
    },
    tableWidth: pageWidth - margin * 2,
    margin: { left: margin, right: margin, top: 24 },
  });

  const tableFinalY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  // ─── GÜN RİTMİ şeridi: saat başına AKTİF altın bar + kesirli alt-toplam + pik ───
  const stripTop = tableFinalY + 3;
  const barMaxH = 5.5;
  const baseY = stripTop + barMaxH;
  const numY = baseY + 3;
  const c0 = colGeom.get(0);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(150, 138, 120);
  if (c0) doc.text("AKTİF", c0.x + 1.5, baseY - 0.8, { charSpace: 0.12 });
  for (let i = 1; i <= hours.length; i++) {
    const g = colGeom.get(i);
    if (!g) continue;
    const load = loadByHour.get(hours[i - 1]) ?? 0;
    const barH = Math.max(0.4, (load / maxLoad) * barMaxH);
    const isPeak = Math.abs(load - maxLoad) < 1e-9 && load > 0;
    const bw = Math.min(3.6, g.w * 0.4);
    if (isPeak) doc.setFillColor(184, 147, 90); // tam altın
    else doc.setFillColor(214, 198, 165); // açık altın tint
    doc.rect(g.cx - bw / 2, baseY - barH, bw, barH, "F");
    if (isPeak) {
      // pik saatin üstünde minik altın üçgen göz-çıpası
      doc.setFillColor(184, 147, 90);
      doc.triangle(g.cx - 1, stripTop - 1.8, g.cx + 1, stripTop - 1.8, g.cx, stripTop - 0.4, "F");
    }
    doc.setFontSize(6.4);
    doc.setTextColor(26, 22, 20);
    doc.text(fmtHalf(load), g.cx, numY, { align: "center" });
  }

  // ─── Günün Bilgileri (sorumlular + altInfo) — ikonlu; sağ-altta günlük toplam ───
  renderDayInfo(doc, numY + 4, result, altInfo, pageWidth, pageHeight, margin, grandTotal);

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

  // Başlık — SERİF (built-in Times) + tam ortalı tarih eyebrow (ana PDF ile aynı dil)
  doc.setFont("times", "normal");
  doc.setFontSize(19);
  doc.setTextColor(26, 22, 20);
  doc.text("Günlük Chart", pageWidth / 2, 14, { align: "center" });
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 138, 120);
  drawCenteredEyebrow(
    doc,
    "ALAN BAZLI  ·  " + fmtDate(shiftDate).split(".").join("  ·  "),
    pageWidth / 2,
    19.5,
    0.5,
  );

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

  // Günlük toplam insan-saat (1/2'ler 0.5). Ana PDF ile BİREBİR aynı sonuç için
  // aynı kaynaktan (byKey = hour|role deduped) sayıyoruz — iki ayrı hesap sapmasın.
  let areaGrandTotal = 0;
  for (const [key, persons] of byKey) {
    const h = Number(key.split("|")[0]);
    for (const p of persons) areaGrandTotal += halfBreakSetByHour.get(h)?.has(p) ? 0.5 : 1;
  }

  // Tüm 5 tablo + Günün Bilgileri TEK sayfaya sığsın diye sıkı yükseklikler.
  let y = 23;
  const ROW_H = 8.5;
  const BAND_H = 6.2;
  // Saat sütunları 5 tabloda BİREBİR aynı grid (alt alta hizalı) — sabit genişlik.
  const COL0_W = 26;
  const hourW = (tableWidth - COL0_W) / hours.length;

  for (const area of AREA_TABLES) {
    // Bu alan için tablo yüksekliği tahmini → sayfa taşarsa yeni sayfa.
    const dataRows = area.roles.length + 1; // alt-roller + MOLA
    const estH = BAND_H + 7 /*head*/ + dataRows * ROW_H + 8 /*AKTİF şeridi + gap*/;
    if (y + estH > pageHeight - margin) {
      doc.addPage();
      y = margin + 4;
    }

    // Renkli başlık bandı + geometrik alan sembolü (AreaGlyph ile aynı)
    doc.setFillColor(area.color[0], area.color[1], area.color[2]);
    doc.rect(margin, y, tableWidth, BAND_H, "F");
    drawAreaGlyph(doc, area.glyph, margin + 4, y + BAND_H / 2, 3.2);
    doc.setTextColor(255);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8.5);
    const labelX = margin + 8;
    doc.text(area.label, labelX, y + BAND_H / 2 + 1.0);
    // Etiket genişliğini BOLD ölç (font küçültülmeden) — yoksa alt-yazı bitişik
    // düşüyordu ("FITTING ROOMKabin"). + boşluk payı.
    const labelW = doc.getTextWidth(area.label);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.text(area.sub, labelX + labelW + 5, y + BAND_H / 2 + 1.0);
    y += BAND_H;

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

    const areaColGeom = new Map<number, { cx: number; x: number; w: number }>();
    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "grid",
      didDrawCell: (data) => {
        if (data.section === "head") {
          areaColGeom.set(data.column.index, {
            cx: data.cell.x + data.cell.width / 2,
            x: data.cell.x,
            w: data.cell.width,
          });
        }
      },
      styles: {
        font: "Roboto",
        fontSize: 6.8,
        cellPadding: 1.2,
        minCellHeight: ROW_H,
        valign: "middle",
        halign: "center",
        lineColor: [201, 192, 178], // ana PDF ile aynı sıcak-gri grid
        lineWidth: 0.2,
        textColor: [25, 25, 25],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: headTint,
        textColor: [40, 40, 40],
        fontStyle: "bold",
        fontSize: 6.5,
        halign: "center",
        minCellHeight: 6,
        cellPadding: 1,
      },
      // Sabit sütun genişlikleri → 5 tablonun saat kutuları birebir hizalı.
      columnStyles: ((): Record<number, Partial<Styles>> => {
        const cs: Record<number, Partial<Styles>> = {
          0: {
            fillColor: labelTint,
            textColor: [area.color[0], area.color[1], area.color[2]],
            fontStyle: "bold",
            halign: "left",
            cellWidth: COL0_W,
            fontSize: 7,
          },
        };
        for (let i = 1; i <= hours.length; i++) cs[i] = { cellWidth: hourW };
        return cs;
      })(),
      didParseCell: (data) => {
        const txt = data.cell.text;
        if (txt.length === 1 && (txt[0] === "" || txt[0] === "—")) {
          data.cell.text = [""];
        }
        // Uzun isim sütunu taşırmasın — kademeli font küçültme (ana PDF ile aynı).
        if (data.section === "body" && data.column.index > 0) {
          const longest = txt.reduce((m, t) => Math.max(m, t.length), 0);
          if (longest > 14) data.cell.styles.fontSize = 5.5;
          else if (longest > 11) data.cell.styles.fontSize = 6;
        }
        // MOLA satırı sol etiketini gri yap (rol değil)
        if (data.section === "body" && data.column.index === 0 && data.cell.raw === "MOLA") {
          data.cell.styles.textColor = [120, 120, 120];
        }
      },
      tableWidth,
      margin: { left: margin, right: margin },
    });

    const areaFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // ── Bu alanın AKTİF şeridi: saat başına kişi (1/2'ler 0.5), alan rengiyle.
    //    Boş saatler "0" → alanlar-arası dengesizlik (WOMAN dolu / TRF boş) görünür. ──
    const aBarMaxH = 3;
    const aBaseY = areaFinalY + 1.5 + aBarMaxH;
    const aNumY = aBaseY + 2.5;
    const aLoad = hours.map((h) =>
      area.roles.reduce(
        (n, r) =>
          n +
          (byKey.get(`${h}|${r}`) ?? []).reduce(
            (m, p) => m + (halfBreakSetByHour.get(h)?.has(p) ? 0.5 : 1),
            0,
          ),
        0,
      ),
    );
    const aMax = Math.max(1, ...aLoad);
    const a0 = areaColGeom.get(0);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(5.6);
    doc.setTextColor(150, 138, 120);
    if (a0) doc.text("AKTİF", a0.x + 1.5, aBaseY - 0.4, { charSpace: 0.1 });
    for (let i = 1; i <= hours.length; i++) {
      const g = areaColGeom.get(i);
      if (!g) continue;
      const load = aLoad[i - 1];
      const bw = Math.min(3.2, g.w * 0.38);
      if (load > 0) {
        doc.setFillColor(area.color[0], area.color[1], area.color[2]);
        const barH = Math.max(0.4, (load / aMax) * aBarMaxH);
        doc.rect(g.cx - bw / 2, aBaseY - barH, bw, barH, "F");
      }
      doc.setFontSize(5.6);
      if (load > 0) doc.setTextColor(26, 22, 20);
      else doc.setTextColor(180, 175, 168);
      doc.text(fmtHalf(load), g.cx, aNumY, { align: "center" });
    }
    y = aNumY + 3;
  }

  // ─── Günün Bilgileri — ana PDF ile AYNI ikonlu/sayfa-taşması güvenli renderer.
  //     Eski renderAreaBottomInfo `break` ile kesiyordu → "1-2 satır yazılıp
  //     gerisi çıkmıyor" bug'ı. renderDayInfo taşınca yeni sayfa açar. ───
  renderDayInfo(doc, y + 6, result, altInfo, pageWidth, pageHeight, margin, areaGrandTotal);

  doc.save(`shift-${shiftDate}-alan.pdf`);
}
