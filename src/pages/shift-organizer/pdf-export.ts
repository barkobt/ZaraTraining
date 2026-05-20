import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GenerateResult } from "./ChartResult";

export function exportChartToPdf(result: GenerateResult, shiftDate: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ZARA · ATELYE", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Shift Organizer · Mağaza 3643", 14, 24);

  // Sağ üst köşeye tarih + chart id
  doc.setFontSize(9);
  doc.text(`Tarih: ${shiftDate}`, pageWidth - 14, 18, { align: "right" });
  doc.text(`Chart #${result.chartId ?? "-"}`, pageWidth - 14, 23, { align: "right" });
  doc.text(`Durum: ${result.status}`, pageWidth - 14, 28, { align: "right" });
  if (result.qualityScore !== null) {
    doc.text(`Skor: ${result.qualityScore.toFixed(1)}`, pageWidth - 14, 33, { align: "right" });
  }

  // Çizgi
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(14, 38, pageWidth - 14, 38);

  // ─── Chart Tablosu ───
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = [...new Set(result.chart.map((c) => c.role))];
  const byKey = new Map<string, string>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons.join("·"));

  const head = [["Rol", ...hours.map((h) => `${String(h).padStart(2, "0")}:00`)]];
  const body = roles.map((r) => [r, ...hours.map((h) => byKey.get(`${h}|${r}`) ?? "—")]);

  autoTable(doc, {
    startY: 44,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [245, 245, 244] } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5, lineColor: [200, 200, 200], lineWidth: 0.2 },
  });

  // ─── Sorumlular ───
  let afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? 100;
  const resp = result.responsibilities;
  if (resp && Object.keys(resp).length > 0) {
    afterY += 8;
    if (afterY > 180) {
      doc.addPage();
      afterY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Günün Sorumluları", 14, afterY);
    afterY += 2;

    autoTable(doc, {
      startY: afterY + 2,
      head: [["Rol", "Kişi"]],
      body: Object.entries(resp).filter(([, v]) => v).map(([r, p]) => [r, p]),
      theme: "plain",
      headStyles: { fontSize: 8, fontStyle: "bold", textColor: [120, 120, 120] },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
    afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  // ─── Uyarılar ───
  if (result.warnings.length > 0) {
    afterY += 8;
    if (afterY > 175) {
      doc.addPage();
      afterY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(180, 90, 0);
    doc.text("Uyarılar", 14, afterY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60);
    let y = afterY + 5;
    for (const w of result.warnings.slice(0, 8)) {
      const lines = doc.splitTextToSize(`• ${w}`, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4;
    }
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `ZARA · Atelye · ${shiftDate} · ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" },
    );
  }

  doc.save(`shift-${shiftDate}.pdf`);
}
