import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GenerateResult } from "./ChartResult";

/**
 * Chart sonucunu A4 landscape **tek sayfa** PDF olarak indir.
 * Boyutlandırma: autoTable parametreleri agresif sıkıştırılır, başlık + chart + sorumlular
 * + uyarılar tek sayfaya sığar.
 */
export function exportChartToPdf(result: GenerateResult, shiftDate: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();   // 297
  const pageHeight = doc.internal.pageSize.getHeight(); // 210
  const margin = 10;

  // ─── Header (kompakt: 22mm) ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("ZARA · ATELYE", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Shift Organizer · Mağaza 3643", margin, 17);

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

  // ─── Chart Tablosu (DİKEY: rows=saat, cols=rol) ───
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = [...new Set(result.chart.map((c) => c.role))];
  const byKey = new Map<string, string>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons.join(" · "));

  const head = [["Saat", ...roles]];
  const body = hours.map((h) => [
    `${String(h).padStart(2, "0")}:00`,
    ...roles.map((r) => byKey.get(`${h}|${r}`) ?? "—"),
  ]);

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
      0: {
        fontStyle: "bold",
        fillColor: [245, 245, 244],
        cellWidth: 26,
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
    doc.text("Günün Sorumluları", margin, afterY);
    afterY += 1;

    // Yatay 5 hücre — tek satırda
    autoTable(doc, {
      startY: afterY + 1,
      head: [respEntries.map(([role]) => role)],
      body: [respEntries.map(([, person]) => person ?? "—")],
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
    doc.text("Uyarılar", margin, afterY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80);
    afterY += 3;
    const max = 3;
    const shown = result.warnings.slice(0, max);
    for (const w of shown) {
      if (afterY > pageHeight - 10) break;
      const lines = doc.splitTextToSize(`• ${w}`, pageWidth - margin * 2);
      doc.text(lines.slice(0, 1), margin, afterY);
      afterY += 3;
    }
    if (result.warnings.length > max) {
      doc.setTextColor(140);
      doc.text(`+ ${result.warnings.length - max} uyarı daha`, margin, afterY);
    }
  }

  // ─── Footer ───
  doc.setFontSize(6.5);
  doc.setTextColor(160);
  doc.text(
    `ZARA · Atelye · ${shiftDate}`,
    pageWidth / 2,
    pageHeight - 4,
    { align: "center" },
  );

  doc.save(`shift-${shiftDate}.pdf`);
}
