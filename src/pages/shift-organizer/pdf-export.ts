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
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        if (be - bs <= 0.5 + 1e-6) {
          const h = Math.floor(bs);
          const set = halfBreakSetByHour.get(h) ?? new Set<string>();
          set.add(s.short_name);
          halfBreakSetByHour.set(h, set);
        }
      }
    }
  }
  const labelName = (name: string, hour: number): string =>
    halfBreakSetByHour.get(hour)?.has(name) ? `${name} 1/2` : name;

  // Mola hesapla — saat → ad listesi (yarım mola "1/2" suffix'iyle)
  const breaksByHour = new Map<number, string[]>();
  if (shifts) {
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        const isHalf = be - bs <= 0.5 + 1e-6;
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const arr = breaksByHour.get(h) ?? [];
          const label = isHalf ? `${s.short_name} 1/2` : s.short_name;
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
