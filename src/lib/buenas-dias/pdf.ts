/**
 * Buenas Dias PDF üreteci — spec §6.3 "PDF export" modu.
 *
 * jsPDF + jspdf-autotable kullanır (her ikisi de zaten projede).
 * A4 portrait, sade ve mürekkep dostu. Mevcut basılı formun yapısını korur:
 * başlık + bağlam + mağaza hedef + reyon tablosu + ipod + challenge +
 * sorumlular + dear team / günün sözü.
 *
 * Türkçe karakter desteği: jsPDF default Helvetica/Times Latin-1 set'i
 * (ç, ğ, ı, ö, ş, ü, İ) destekler. Emoji desteği yok — bağlam satırında
 * sembol yerine metin (Açık/Bulutlu/Yağmurlu, Özel gün/Normal) kullanılır.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReyonGrid } from "@contracts/buenas-dias";

export type PdfPayload = {
  date: string; // 'YYYY-MM-DD'
  day: {
    status: string;
    dayType: string;
    isSpecialDay: boolean;
    weather: string;
    targetTotalAdet: number | null;
    targetTotalTl: number | null;
    targetReyon: ReyonGrid | null;
    targetIpod: { kadin: number; erkek: number; cocuk: number; kasa: number } | null;
    refReyon: ReyonGrid | null;
    plannedSint: number | null;
    actualTotalAdet: number | null;
    actualTotalTl: number | null;
    actualVisit: number | null;
    actualFis: number | null;
    actualSint: number | null;
    actualGap: number | null;
    dearTeamKonusu: string | null;
    gununSozu: string | null;
  };
  derived: {
    compran: { actual: number | null; target: number; status: string };
    productivity: { actual: number | null; target: number; status: string };
    gap: { actual: number | null; target: number; status: string };
  } | null;
  challenge: {
    active: boolean;
    cumulativeTl?: number;
    challenge?: { month: string; tier1TargetTl: number; tier2TargetTl: number };
    tier1?: { statusPct: number; todayRequiredTl: number; alreadyMet: boolean };
    tier2?: { statusPct: number; todayRequiredTl: number; alreadyMet: boolean };
  } | null;
  settings: { compranTarget: number; gapTarget: number; productivityTarget: number; defaultStretch: number } | null;
};

export function exportBuenasDiasPdf(payload: PdfPayload): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // A4 mm
  let y = 14;

  // ─── Başlık ────────────────────────────────────────────────────────────────
  doc.setFillColor(20, 20, 20);
  doc.rect(10, 10, W - 20, 8, "F");
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BUENOS DIAS MEETING", W / 2, 16, { align: "center" });
  y = 22;

  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(formatTrDate(payload.date), W / 2, y, { align: "center" });
  y += 5;

  // ─── Bağlam ────────────────────────────────────────────────────────────────
  const ctxParts: string[] = [];
  ctxParts.push(weekdayName(payload.date));
  ctxParts.push(weatherLabel(payload.day.weather));
  ctxParts.push(payload.day.isSpecialDay ? "Özel gün" : "Normal gün");
  if (payload.settings) ctxParts.push(`Stretch +%${Math.round(payload.settings.defaultStretch * 100)}`);
  ctxParts.push(`Durum: ${payload.day.status}`);
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(ctxParts.join("  ·  "), W / 2, y, { align: "center" });
  y += 6;
  doc.setTextColor(0);

  // ─── Mağaza hedef ──────────────────────────────────────────────────────────
  const compran = payload.derived?.compran;
  const prod = payload.derived?.productivity;
  const gap = payload.derived?.gap;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", halign: "center" },
    head: [["MAĞAZA HEDEF", "", "", ""]],
    body: [
      [
        "Compran Hedef",
        payload.settings ? pct(payload.settings.compranTarget) : "—",
        "Compran Oranı",
        compran?.actual != null ? pct(compran.actual) : "—",
      ],
      [
        "Gap Hedef",
        payload.settings ? payload.settings.gapTarget.toFixed(1) : "—",
        "Gap (Adet)",
        gap?.actual != null ? gap.actual.toFixed(1) : "—",
      ],
      [
        "Productivity Hedef",
        payload.settings ? payload.settings.productivityTarget.toFixed(2) : "—",
        "Gerçekleşen Productivity",
        prod?.actual != null ? prod.actual.toFixed(2) : "—",
      ],
      [
        "Planlanan Sint",
        payload.day.plannedSint != null ? payload.day.plannedSint.toFixed(0) : "—",
        "Gerçekleşen Sint",
        payload.day.actualSint != null ? payload.day.actualSint.toFixed(0) : "—",
      ],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { halign: "right", cellWidth: 35 },
      2: { fontStyle: "bold", cellWidth: 55 },
      3: { halign: "right", cellWidth: 35 },
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ─── Reyon Hedef ───────────────────────────────────────────────────────────
  const target = payload.day.targetReyon;
  const refGrid = payload.day.refReyon;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5, halign: "right" },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", halign: "center" },
    head: [["REYON HEDEF (UDS)", "TEKSTİL", "TEMPE", "PARFÜM", "TOPLAM"]],
    body: (["kadin", "erkek", "cocuk"] as const).map((r) => {
      const rowSum = target ? (target[r]?.tekstil ?? 0) + (target[r]?.tempe ?? 0) + (target[r]?.parfum ?? 0) : null;
      return [
        { content: reyonName(r), styles: { halign: "left", fontStyle: "bold" } },
        cellWithRef(target?.[r]?.tekstil, refGrid?.[r]?.tekstil),
        cellWithRef(target?.[r]?.tempe, refGrid?.[r]?.tempe),
        cellWithRef(target?.[r]?.parfum, refGrid?.[r]?.parfum),
        rowSum != null ? fmt(rowSum) : "—",
      ];
    }),
    foot: [
      [
        { content: "TOPLAM", styles: { halign: "left", fontStyle: "bold" } },
        sumCol(target, "tekstil"),
        sumCol(target, "tempe"),
        sumCol(target, "parfum"),
        payload.day.targetTotalAdet != null ? fmt(payload.day.targetTotalAdet) : "—",
      ],
    ],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ─── IPOD ─────────────────────────────────────────────────────────────────
  if (payload.day.targetIpod) {
    const t = payload.day.targetIpod;
    const ipodTotal = t.kadin + t.erkek + t.cocuk + t.kasa;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5, halign: "right" },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", halign: "center" },
      head: [["IPOD HEDEF", "KADIN", "ERKEK", "ÇOCUK", "KASA", "TOPLAM"]],
      body: [[
        { content: "Adet", styles: { halign: "left", fontStyle: "bold" } },
        fmt(t.kadin),
        fmt(t.erkek),
        fmt(t.cocuk),
        fmt(t.kasa),
        fmt(ipodTotal),
      ]],
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  }

  // ─── Challenge ────────────────────────────────────────────────────────────
  if (payload.challenge?.active && payload.challenge.challenge) {
    const c = payload.challenge.challenge;
    const t1 = payload.challenge.tier1!;
    const t2 = payload.challenge.tier2!;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", halign: "center" },
      head: [[`CHALLENGE — ${c.month}  ·  Kümülatif: ${fmtTl(payload.challenge.cumulativeTl ?? 0)}`, "", "", ""]],
      body: [
        [
          "Challenge 1 (taban)",
          fmtTl(c.tier1TargetTl),
          `Durum %${Math.round(t1.statusPct * 100)}`,
          `Bugün gereken: ${fmtTl(t1.todayRequiredTl)}`,
        ],
        [
          "Challenge 2 (+%15)",
          fmtTl(c.tier2TargetTl),
          `Durum %${Math.round(t2.statusPct * 100)}`,
          `Bugün gereken: ${fmtTl(t2.todayRequiredTl)}`,
        ],
      ],
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "center", cellWidth: 35 },
        3: { halign: "right", cellWidth: 55 },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  }

  // ─── Sorumlular ────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    head: [["SORUMLULAR", ""]],
    body: [
      ["Adet / Anons", "—"],
      ["Parfüm", "—"],
      ["Tempe", "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ─── Dear Team / Günün Sözü ───────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, minCellHeight: 14 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold", halign: "center" },
    head: [["DEAR TEAM KONUSU", "GÜNÜN SÖZÜ"]],
    body: [[payload.day.dearTeamKonusu ?? "", { content: payload.day.gununSozu ?? "", styles: { fontStyle: "italic" } }]],
  });

  // ─── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Buenas Dias · zaratraining.online · ${payload.date} · oluşturuldu: ${new Date().toLocaleString("tr-TR")}`,
    W / 2,
    pageH - 8,
    { align: "center" },
  );

  doc.save(`buenas-dias-${payload.date}.pdf`);
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function cellWithRef(value: number | undefined | null, ref: number | undefined | null) {
  if (value == null) return "—";
  if (ref == null) return fmt(value);
  // Tek satırda "1545  (geçen 1500)" — autoTable styled cell olarak.
  const sign = value > ref ? "▲" : value < ref ? "▼" : "·";
  return `${fmt(value)}  ${sign} ${fmt(ref)}`;
}

function sumCol(grid: ReyonGrid | null, col: "tekstil" | "tempe" | "parfum"): string {
  if (!grid) return "—";
  const s = (["kadin", "erkek", "cocuk"] as const).reduce((acc, r) => acc + (grid[r]?.[col] ?? 0), 0);
  return fmt(s);
}

function fmt(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

function fmtTl(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} M TL`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} K TL`;
  }
  return `${fmt(n)} TL`;
}

function pct(n: number): string {
  return `%${(n * 100).toFixed(1)}`;
}

function formatTrDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" });
}

function weekdayName(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const name = d.toLocaleDateString("tr-TR", { weekday: "long" });
  return name.charAt(0).toLocaleUpperCase("tr-TR") + name.slice(1);
}

function reyonName(r: "kadin" | "erkek" | "cocuk"): string {
  return r === "kadin" ? "KADIN" : r === "erkek" ? "ERKEK" : "ÇOCUK";
}

function weatherLabel(w: string): string {
  if (w === "sunny") return "Açık (×1.15)";
  if (w === "bad") return "Yağmurlu (×0.85)";
  return "Normal (×1.00)";
}
