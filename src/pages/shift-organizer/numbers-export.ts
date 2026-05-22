import type { GenerateResult, ShiftInputForChart } from "./ChartResult";

/**
 * Numbers / Excel uyumlu styled export.
 *
 * Strateji: HTML table → .xls dosya olarak indir.
 * Hem Apple Numbers hem Microsoft Excel HTML tabloları native açar ve
 * inline CSS stillerini (renk, font, border, alignment) korur.
 * Bu sayede PDF export ile aynı görsel kaliteyi düzenlenebilir olarak sunarız.
 *
 * Layout (PDF paritesi):
 *   - Başlık: "Günlük Chart — {tarih}"
 *   - Tablo: sarı header, sarı sol sütun, grid border, ortalanmış hücreler
 *   - MOLA satırı, TASK satırı, AKTİF İŞ GÜCÜ satırı
 *   - Günün Sorumluları bölümü
 */

const ROLE_ORDER = [
  "KABİN", "KABİN WELCOMER", "SPRINTER", "WELCOME",
  "ZONE 2", "ZONE 3", "ZONE 4", "ZONE 5",
];
const ROLE_LABELS: Record<string, string> = {
  KABİN: "KABİN",
  "KABİN WELCOMER": "KABİN WELCOMER",
  SPRINTER: "SPRİNTER",
  WELCOME: "WELCOME",
  "ZONE 2": "ZONE 2", "ZONE 3": "ZONE 3", "ZONE 4": "ZONE 4", "ZONE 5": "ZONE 5",
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

function fmtHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00:00`;
}

function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Shared styles (CSS string) ───
const YELLOW = "#FFE680";
const YELLOW_LIGHT = "#FFF8DC";
const FONT = "'Roboto', 'Helvetica Neue', sans-serif";
const CELL_STYLE = `font-family:${FONT}; font-size:9pt; padding:6px 4px; text-align:center; vertical-align:middle; border:1px solid #000;`;
const HEADER_STYLE = `${CELL_STYLE} background:${YELLOW}; font-weight:bold;`;
const ROLE_CELL_STYLE = `${CELL_STYLE} background:${YELLOW}; font-weight:bold; text-align:center; font-size:8pt;`;
const MOLA_BG = `${CELL_STYLE} background:${YELLOW_LIGHT};`;

export function exportChartToNumbers(
  result: GenerateResult,
  shiftDate: string,
  shifts?: ShiftInputForChart[],
  altInfo?: { aksiyon?: string; cxQr?: string; ipod?: string; tempe?: string; istek?: string },
) {
  const hours = [...new Set(result.chart.map((c) => c.hour))].sort((a, b) => a - b);
  const roles = sortRoles([...new Set(result.chart.map((c) => c.role))]);

  const byKey = new Map<string, string[]>();
  for (const c of result.chart) byKey.set(`${c.hour}|${c.role}`, c.persons);

  // Yarım mola tespiti
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
  const displayName = (name: string, hour: number): string =>
    halfBreakSetByHour.get(hour)?.has(name) ? `${name} 1/2` : name;

  // Mola / Task / Aktif hesapla
  const breaksByHour = new Map<number, string[]>();
  const tasksByHour = new Map<number, string[]>();
  const activeByHour = new Map<number, number>();
  if (shifts) {
    for (const h of hours) {
      let count = 0;
      for (const s of shifts) {
        if (h < s.start_hour || h >= s.end_hour) continue;
        const fullBreak = (s.breaks ?? []).some(([bs, be]) => bs <= h && be >= h + 1);
        const onTask = (s.tasks ?? []).some(([th]) => th === h);
        if (fullBreak || onTask) continue;
        const halfBreak = (s.breaks ?? []).some(([bs, be]) => {
          const dur = be - bs;
          return dur <= 0.5 + 1e-6 && Math.floor(bs) === h;
        });
        count += halfBreak ? 0.5 : 1;
      }
      activeByHour.set(h, count);
    }
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
      for (const [h, t] of s.tasks ?? []) {
        const arr = tasksByHour.get(h) ?? [];
        arr.push(`${s.short_name} (${t})`);
        tasksByHour.set(h, arr);
      }
    }
  }

  // ─── HTML build ───
  const lines: string[] = [];
  lines.push(`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">`);
  lines.push(`<head><meta charset="utf-8"><style>`);
  lines.push(`@page { size: A4 portrait; margin: 10mm; }`);
  lines.push(`body { font-family: ${FONT}; }`);
  lines.push(`</style></head><body>`);

  // Başlık
  lines.push(`<p style="text-align:center; font-family:${FONT}; font-size:16pt; font-style:italic; margin-bottom:8px;">Günlük Chart</p>`);

  // Tablo başlat
  lines.push(`<table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%;">`);

  // Header row: tarih + saatler
  lines.push(`<tr>`);
  lines.push(`<td style="${HEADER_STYLE} width:80px;">${esc(fmtDate(shiftDate))}</td>`);
  for (const h of hours) {
    lines.push(`<td style="${HEADER_STYLE}">${esc(fmtHour(h))}</td>`);
  }
  lines.push(`</tr>`);

  // Rol satırları
  for (const r of roles) {
    lines.push(`<tr>`);
    lines.push(`<td style="${ROLE_CELL_STYLE}">${esc(roleLabel(r))}</td>`);
    for (const h of hours) {
      const persons = byKey.get(`${h}|${r}`) ?? [];
      const labeled = persons.map((p) => displayName(p, h));
      const cellContent = labeled.length > 0 ? esc(labeled.join("\n")) : "";
      lines.push(`<td style="${CELL_STYLE} white-space:pre-wrap;">${cellContent}</td>`);
    }
    lines.push(`</tr>`);
  }

  // MOLA satırı
  if (breaksByHour.size > 0) {
    lines.push(`<tr>`);
    lines.push(`<td style="${ROLE_CELL_STYLE}">MOLA</td>`);
    for (const h of hours) {
      const names = breaksByHour.get(h) ?? [];
      lines.push(`<td style="${MOLA_BG} white-space:pre-wrap;">${esc(names.join("\n"))}</td>`);
    }
    lines.push(`</tr>`);
  }

  // TASK satırı
  if (tasksByHour.size > 0) {
    lines.push(`<tr>`);
    lines.push(`<td style="${ROLE_CELL_STYLE} background:#FFD6D6;">TASK</td>`);
    for (const h of hours) {
      const items = tasksByHour.get(h) ?? [];
      lines.push(`<td style="${CELL_STYLE} background:#FFF0F0; white-space:pre-wrap;">${esc(items.join("\n"))}</td>`);
    }
    lines.push(`</tr>`);
  }

  // AKTİF İŞ GÜCÜ satırı
  if (activeByHour.size > 0) {
    lines.push(`<tr>`);
    lines.push(`<td style="${ROLE_CELL_STYLE} background:#E8E8E8;">AKTİF İŞ GÜCÜ</td>`);
    for (const h of hours) {
      const v = activeByHour.get(h) ?? 0;
      lines.push(`<td style="${CELL_STYLE} background:#F5F5F5; font-weight:bold;">${v}</td>`);
    }
    lines.push(`</tr>`);
  }

  lines.push(`</table>`);

  // ─── Günün Sorumluları ───
  const resp = (result.responsibilities ?? {}) as Record<string, string | null | undefined>;
  const respItems = [
    { key: "Liderlik", value: resp["Liderlik"] },
    { key: "CX Sorumlusu", value: resp["CX Sorumlusu"] },
    { key: "Runner Lider", value: resp["Runner Lider"] },
    { key: "iPod Sorumlusu", value: resp["iPod Sorumlusu"] },
    { key: "Aksiyon Sorumlusu", value: resp["Aksiyon Sorumlusu"] },
  ].filter((it) => it.value && it.value.trim());

  if (respItems.length > 0) {
    lines.push(`<br/>`);
    lines.push(`<p style="font-family:${FONT}; font-size:10pt; font-weight:bold; margin-bottom:4px;">Günün Sorumluları</p>`);
    for (const it of respItems) {
      lines.push(`<p style="font-family:${FONT}; font-size:10pt; margin:2px 0;">${esc(it.key)}: <b>${esc(it.value!)}</b></p>`);
    }
  }

  // ─── Alt Info (aksiyon, CX QR, iPod, tempe, istek) ───
  const altItems = [
    { key: "Haftanın aksiyon familyaları", value: altInfo?.aksiyon },
    { key: "CX QR hedefi", value: altInfo?.cxQr },
    { key: "IPOD Satışı hedefi / sorumlusu", value: altInfo?.ipod },
    { key: "Tempe / ACC sorumlusu", value: altInfo?.tempe },
    { key: "İstek noktası sorumlusu", value: altInfo?.istek },
  ].filter((it) => it.value && it.value.trim());

  if (altItems.length > 0) {
    lines.push(`<br/>`);
    for (const it of altItems) {
      lines.push(`<p style="font-family:${FONT}; font-size:10pt; margin:2px 0;">${esc(it.key)}: <b>${esc(it.value!)}</b></p>`);
    }
  }

  lines.push(`</body></html>`);

  // ─── İndir ───
  const html = lines.join("\n");
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shift-${shiftDate}.xls`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
