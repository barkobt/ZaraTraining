import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GenerateResult, ShiftInputForChart } from "./ChartResult";

/**
 * Solver Role enum NAME'lerini ekran-dostu Türkçe label'a çevirir.
 * (ChartResult.tsx ROLE_LABELS ile aynı; PDF/Excel export'unda raw enum
 * "KABİN" gözükmesin diye burada da uygulanır — "KAB0N" font bug'ının kaynağı.)
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
  KABİN: "Kabin",
  "KABİN WELCOMER": "Kabin Welcomer",
  SPRINTER: "Sprinter",
  WELCOME: "Welcome",
  "ZONE 2": "Zone 2",
  "ZONE 3": "Zone 3",
  "ZONE 4": "Zone 4",
  "ZONE 5": "Zone 5",
};

/**
 * jsPDF Helvetica/Times Türkçe karakter glyph'lerini (İ, ı, ş, ğ, ü, ö, ç)
 * desteklemez — eksik karakter "0" veya kare olarak basılır ("KABİN"→"KAB0N" bug).
 * Pragmatik çözüm: tüm metni ASCII Latin eşleniğine çevir. Görsel olarak
 * "Şeyma"→"Seyma" gibi gözükür ama bozuk glyph yerine okunabilir.
 */
function asciify(s: string): string {
  return s
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o");
}

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

/**
 * Chart sonucunu A4 landscape **tek sayfa** PDF olarak indir.
 * Boyutlandırma: autoTable parametreleri agresif sıkıştırılır, başlık + chart + sorumlular
 * + uyarılar tek sayfaya sığar.
 */
export function exportChartToPdf(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();   // 297
  const pageHeight = doc.internal.pageSize.getHeight(); // 210
  const margin = 10;

  // ─── Header (kompakt: 22mm) ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(asciify("ZARA · ATELYE"), margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(asciify("Shift Organizer · Mağaza 3643"), margin, 17);

  doc.setFontSize(8);
  doc.setTextColor(40);
  const meta = [
    `Tarih: ${shiftDate}`,
    `Chart #${result.chartId ?? "-"}`,
    `Durum: ${result.status}`,
    result.qualityScore !== null ? `Skor: ${result.qualityScore.toFixed(1)}` : "",
  ].filter(Boolean);
  meta.forEach((m, i) => {
    doc.text(m, pageWidth - margin, 11 + i * 4, { align: "right" });
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, 22, pageWidth - margin, 22);

  // ─── Chart Tablosu (chart1.xlsx referans formatı: rows=ROL, cols=SAAT) ───
  // User spec: "format chart1 ile aynı olmalı". chart1.xlsx pivot'unda
  // satırlar rol (KABİN, RUNNER/KABİN WELCOMER, SPRİNTER, WELCOMER/WELCOME,
  // ZONE 2..5, MOLA), sütunlar saat (10:00-22:00).
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = sortRoles([...new Set(result.chart.map((c) => c.role))]);
  const byKey = new Map<string, string>();
  for (const c of result.chart)
    byKey.set(`${c.hour}|${c.role}`, c.persons.map(asciify).join(" · "));

  // Mola, task ve aktif iş gücü hesaplaması — chart1 stilinde ek satır olarak
  const breaksByHour = new Map<number, string[]>();
  const tasksByHour = new Map<number, string[]>();
  const activeByHour = new Map<number, number>();
  if (shifts) {
    for (const h of hours) {
      let count = 0;
      for (const s of shifts) {
        if (h < s.start_hour || h >= s.end_hour) continue;
        const onBreak = (s.breaks ?? []).some(([bs, be]) => bs <= h && be >= h + 1);
        const onTask = (s.tasks ?? []).some(([th]) => th === h);
        if (!onBreak && !onTask) count++;
      }
      activeByHour.set(h, count);
    }
    for (const s of shifts) {
      for (const [bs, be] of s.breaks ?? []) {
        for (let h = Math.floor(bs); h < Math.ceil(be); h++) {
          const arr = breaksByHour.get(h) ?? [];
          if (!arr.includes(s.short_name)) arr.push(s.short_name);
          breaksByHour.set(h, arr);
        }
      }
      for (const [h, t] of s.tasks ?? []) {
        const arr = tasksByHour.get(h) ?? [];
        arr.push(`${s.short_name} (${t})`);
        tasksByHour.set(h, arr);
      }
    }
  }
  const hasBreaks = breaksByHour.size > 0;
  const hasTasks = tasksByHour.size > 0;
  const hasActive = activeByHour.size > 0;

  // chart1 formatı: ilk sütun = rol etiketi (uppercase asciify), sonraki
  // sütunlar = saat hücreleri (10:00, 11:00, ..., 21:00).
  const hourCols = hours.map((h) => `${String(h).padStart(2, "0")}:00`);
  const head = [["Rol", ...hourCols]];

  const body: string[][] = roles.map((r) => [
    asciify(roleLabel(r)),
    ...hours.map((h) => byKey.get(`${h}|${r}`) ?? "—"),
  ]);
  if (hasBreaks) {
    body.push([
      "Mola",
      ...hours.map((h) => asciify((breaksByHour.get(h) ?? []).join(" · ")) || "—"),
    ]);
  }
  if (hasTasks) {
    body.push([
      "Task (HR/TR/ISG)",
      ...hours.map((h) => asciify((tasksByHour.get(h) ?? []).join(" · ")) || "—"),
    ]);
  }
  if (hasActive) {
    body.push([
      asciify("Aktif İş Gücü"),
      ...hours.map((h) => String(activeByHour.get(h) ?? 0)),
    ]);
  }

  // Sayı: chart için ~ 8 rol × 11 saat. Sığması için font 6.5, padding 1.
  autoTable(doc, {
    startY: 25,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: 1.2,
      halign: "center",
      minCellHeight: 5,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 30, 30],
      cellPadding: 1,
      minCellHeight: 5,
      valign: "middle",
      halign: "center",
      overflow: "linebreak",
    },
    columnStyles: {
      // İlk sütun: rol etiketi (sol hizalı, koyu, daha geniş)
      0: {
        fontStyle: "bold",
        fillColor: [245, 245, 244],
        textColor: [30, 30, 30],
        cellWidth: 30,
        halign: "left",
      },
    },
    margin: { left: margin, right: margin },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.15 },
    tableWidth: pageWidth - margin * 2,
    rowPageBreak: "avoid",
    pageBreak: "avoid",
  });

  let afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;

  // ─── Sorumlular (tek satır, küçük) ───
  const resp = result.responsibilities;
  const respEntries = resp
    ? Object.entries(resp).filter(([, v]) => v)
    : [];
  if (respEntries.length > 0) {
    afterY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(asciify("Günün Sorumluları"), margin, afterY);
    afterY += 1;

    // Yatay 5 hücre — tek satırda
    autoTable(doc, {
      startY: afterY + 1,
      head: [respEntries.map(([role]) => asciify(role))],
      body: [respEntries.map(([, person]) => asciify(person ?? "—"))],
      theme: "plain",
      headStyles: {
        fontSize: 6.5,
        fontStyle: "bold",
        textColor: [120, 120, 120],
        cellPadding: 0.8,
        minCellHeight: 4,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [20, 20, 20],
        cellPadding: 1.5,
        minCellHeight: 6,
      },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
      pageBreak: "avoid",
    });
    afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;
  }

  // ─── Uyarılar (özet, en fazla 3 satır) ───
  if (result.warnings.length > 0 && afterY < pageHeight - 18) {
    afterY += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 90, 0);
    doc.text(asciify("Uyarılar"), margin, afterY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80);
    afterY += 3;
    const max = 3;
    const shown = result.warnings.slice(0, max);
    for (const w of shown) {
      if (afterY > pageHeight - 10) break;
      const lines = doc.splitTextToSize(asciify(`• ${w}`), pageWidth - margin * 2);
      doc.text(lines.slice(0, 1), margin, afterY);
      afterY += 3;
    }
    if (result.warnings.length > max) {
      doc.setTextColor(140);
      doc.text(asciify(`+ ${result.warnings.length - max} uyarı daha`), margin, afterY);
    }
  }

  // ─── Footer ───
  doc.setFontSize(6.5);
  doc.setTextColor(160);
  doc.text(
    asciify(`ZARA · Atelye · ${shiftDate}`),
    pageWidth / 2,
    pageHeight - 4,
    { align: "center" },
  );

  doc.save(`shift-${shiftDate}.pdf`);
}
