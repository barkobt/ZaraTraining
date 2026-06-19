import { useEffect, useMemo, useState } from "react";
import { Download, FileDown, LayoutGrid, Sparkles } from "lucide-react";
import { ResponsibilitiesPanel, type Responsibilities } from "./ResponsibilitiesPanel";
import type { StaffRow } from "./constants";

export type GenerateResult = {
  chartId: number | null;
  status: string;
  qualityScore: number | null;
  warnings: string[];
  errors: string[];
  elapsedSeconds: number;
  chart: Array<{ role: string; hour: number; persons: string[] }>;
  responsibilities?: Responsibilities | null;
};

/**
 * Operasyonel kolon sırası — user spec'i:
 * Kabin → Kabin Welcomer → Sprinter → Welcome → Zone 2/3/4/5 → Mola.
 * Solver "KABİN" gibi Türkçe büyük-harf döner; biz hem sırala hem label map'le
 * gösteririz. (Önceden "KAB0N" gibi font render problemine düşülmüştü.)
 */
const ROLE_ORDER: string[] = [
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
  "KABİN": "Kabin",
  "KABİN WELCOMER": "Kabin Welcomer",
  "SPRINTER": "Sprinter",
  "WELCOME": "Welcome",
  "ZONE 2": "Zone 2",
  "ZONE 3": "Zone 3",
  "ZONE 4": "Zone 4",
  "ZONE 5": "Zone 5",
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

/**
 * GenerateTab veya ArchiveTab'tan gelen shift girdileri (mola hesabı için).
 * Mola kolonu opsiyonel: yoksa gösterilmez.
 */
export type ShiftInputForChart = {
  short_name: string;
  start_hour: number;
  end_hour: number;
  breaks: Array<[number, number]>;
  /** Blocking task'lar: [(saat, 'HR'|'TR'|'ISG')]. Bu saatte chart'ta görünmez. */
  tasks?: Array<[number, string]>;
};

export function ChartResult({
  result,
  staff,
  shifts,
  shiftDate: _shiftDate,
  onExportExcel,
  onExportPdf,
  onExportAreaPdf,
}: {
  result: GenerateResult;
  staff?: StaffRow[];
  shifts?: ShiftInputForChart[];
  shiftDate?: string;
  onExportExcel?: (resp: Responsibilities) => void;
  onExportPdf?: (resp: Responsibilities) => void;
  onExportAreaPdf?: (resp: Responsibilities) => void;
}) {
  // Panelde seçilen sorumlular canlı tutulur; export bunu kullanır (DB'ye yazılan
  // ama generate.data'ya yansımayan seçimler bayat kalmasın → FAZ 8 bind).
  const [liveResp, setLiveResp] = useState<Responsibilities>(result.responsibilities ?? {});
  useEffect(() => {
    setLiveResp(result.responsibilities ?? {});
  }, [result.chartId, result.responsibilities]);

  const cellsByHourRole = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of result.chart) m.set(`${c.hour}|${c.role}`, c.persons);
    return m;
  }, [result.chart]);

  const hours = useMemo(() => {
    const set = new Set<number>();
    for (const c of result.chart) set.add(c.hour);
    return [...set].sort((a, b) => a - b);
  }, [result.chart]);

  /** Sıralı roller — user spec'ine göre (Kabin önce, Zone'lar sonra). */
  const roles = useMemo(() => {
    const set = new Set<string>();
    for (const c of result.chart) set.add(c.role);
    return sortRoles([...set]);
  }, [result.chart]);

  /**
   * Yarım mola (≤30dk) tespiti — kişi adı + saat eşleşmesi.
   * Map<hour, Set<short_name>> — o saatte kişinin yarım molası var mı?
   * Chart'ta hem MOLA satırında hem normal rol hücrelerinde "X 1/2" suffix
   * için kullanılır (user kuralı 2026-05-22: paslaşma vurgusu).
   */
  const halfBreakNamesByHour = useMemo(() => {
    const m = new Map<number, Set<string>>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [bStart, bEnd] of s.breaks ?? []) {
        // KÖKEN BUG (2026-06-12): yalnız ≤30dk molalar işaretleniyordu.
        // 12:30-13:30 gibi buçuklu 1 saatlik mola, saat 12'nin ve 13'ün
        // YARISINI kapsar — iki saatte de "1/2" işareti gerekir. Kural:
        // saatle kesişim 0 < kesişim < 1 ise o saat KISMİ moladır.
        for (let h = Math.floor(bStart); h < Math.ceil(bEnd); h++) {
          const ov = Math.min(bEnd, h + 1) - Math.max(bStart, h);
          if (ov > 1e-6 && ov < 1 - 1e-6) {
            const set = m.get(h) ?? new Set<string>();
            set.add(s.short_name);
            m.set(h, set);
          }
        }
      }
    }
    return m;
  }, [shifts]);

  /**
   * Yarım saat giriş/çıkış tespiti — kişi o saatte sadece yarım çalışıyor.
   * start=10.5 → 10:00 slotu yarım (floor(10.5)=10).
   * end=21.5 → 21:00 slotu yarım (floor(21.5)=21, end exclusive olduğundan 21:00-21:30).
   * Backend bu kişiyi tam slota yazar; chart'ta "1/2" ile paslaşma vurgusu yapılır.
   */
  const halfBoundaryNamesByHour = useMemo(() => {
    const m = new Map<number, Set<string>>();
    if (!shifts) return m;
    const mark = (h: number, name: string) => {
      const set = m.get(h) ?? new Set<string>();
      set.add(name);
      m.set(h, set);
    };
    for (const s of shifts) {
      if (s.start_hour % 1 === 0.5) mark(Math.floor(s.start_hour), s.short_name);
      if (s.end_hour % 1 === 0.5) mark(Math.floor(s.end_hour), s.short_name);
    }
    return m;
  }, [shifts]);

  /** İsmi o saate göre "1/2" suffix'iyle göstersin: yarım mola VEYA yarım giriş/çıkış. */
  const displayName = (name: string, hour: number): string =>
    halfBreakNamesByHour.get(hour)?.has(name) || halfBoundaryNamesByHour.get(hour)?.has(name)
      ? `${name} 1/2`
      : name;

  /** Mola kolonu: tam + yarım mola. Yarım mola "X 1/2" suffix'le yazılır
   *  (özetlenebilir hat). Aynı kişi rol hücresinde de "X 1/2" görünür. */
  const breaksByHour = useMemo(() => {
    const m = new Map<number, string[]>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [bStart, bEnd] of s.breaks ?? []) {
        // KÖKEN BUG (2026-06-12): "12:30-13:30" molası floor/ceil ile hem
        // 12 hem 13'e TAM mola yazıyordu (1 saatlik mola 2 saat görünüyordu).
        // Kural artık SAAT BAŞINA KESİŞİM: saati tam kapsıyorsa tam etiket,
        // kısmî kapsıyorsa "1/2" — toplam görünen mola gerçek süreye eşittir.
        for (let h = Math.floor(bStart); h < Math.ceil(bEnd); h++) {
          const ov = Math.min(bEnd, h + 1) - Math.max(bStart, h);
          if (ov <= 1e-6) continue;
          const full = ov >= 1 - 1e-6;
          const arr = m.get(h) ?? [];
          const label = full ? s.short_name : `${s.short_name} 1/2`;
          if (!arr.includes(label)) arr.push(label);
          m.set(h, arr);
        }
      }
    }
    return m;
  }, [shifts]);


  /** Task kolonu: HR/TR/ISG gibi blocking task'lar. */
  const tasksByHour = useMemo(() => {
    const m = new Map<number, Array<{ name: string; type: string }>>();
    if (!shifts) return m;
    for (const s of shifts) {
      for (const [hour, type] of s.tasks ?? []) {
        const arr = m.get(hour) ?? [];
        arr.push({ name: s.short_name, type });
        m.set(hour, arr);
      }
    }
    return m;
  }, [shifts]);
  const hasTasks = tasksByHour.size > 0;

  /**
   * BOŞTA (idle) kişiler — sahada olup HİÇBİR role atanmamış ve molada da olmayan.
   * Bunlar eskiden chart'ta HİÇ görünmüyordu (KAYBOLUYORDU) → MOLA kolonunda
   * "boşta" olarak gösterilir ki kimse eksik kalmasın. present = shift kapsamı
   * (overlap) − TAM mola − task. (Backend boşta cezasıyla bunları azaltır; kalan
   * = gerçekten yeri olmayan, örn. FR fazlası kabin doluyken.)
   */
  const idleByHour = useMemo(() => {
    const m = new Map<number, string[]>();
    if (!shifts) return m;
    const assigned = new Map<number, Set<string>>();
    for (const c of result.chart) {
      const set = assigned.get(c.hour) ?? new Set<string>();
      for (const p of c.persons) set.add(p.endsWith(" 1/2") ? p.slice(0, -4) : p);
      assigned.set(c.hour, set);
    }
    for (const h of hours) {
      const onBreak = new Set(
        (breaksByHour.get(h) ?? []).map((x) => (x.endsWith(" 1/2") ? x.slice(0, -4) : x)),
      );
      const asg = assigned.get(h) ?? new Set<string>();
      const idle: string[] = [];
      for (const s of shifts) {
        const covers = s.start_hour < h + 1 && s.end_hour > h;
        if (!covers) continue;
        const fullBreak = (s.breaks ?? []).some(([a, b]) => a <= h && b >= h + 1);
        const onTask = (s.tasks ?? []).some(([t]) => t === h);
        if (fullBreak || onTask) continue; // sahada değil
        if (asg.has(s.short_name) || onBreak.has(s.short_name)) continue; // zaten görünüyor
        idle.push(s.short_name);
      }
      if (idle.length) m.set(h, idle);
    }
    return m;
  }, [shifts, result.chart, breaksByHour, hours]);

  /** MOLA kolonu = moladakiler + boştalar (boşta "(boşta)" etiketiyle). */
  const molaByHour = useMemo(() => {
    const m = new Map<number, string[]>();
    const allHours = new Set<number>([...breaksByHour.keys(), ...idleByHour.keys()]);
    for (const h of allHours) {
      const parts = [
        ...(breaksByHour.get(h) ?? []),
        ...(idleByHour.get(h) ?? []).map((n) => `${n} (boşta)`),
      ];
      if (parts.length) m.set(h, parts);
    }
    return m;
  }, [breaksByHour, idleByHour]);
  const hasMola = molaByHour.size > 0;

  /**
   * Aktif İş Gücü = o saatte BİR ROLE ATANMIŞ kişi sayısı (chart'ta görünen).
   * Önceden "sahada bulunan" sayılıyordu; kapasite < kişi sayısı olduğunda
   * (ör. 36 kişi ama saatlik kapasite ~31) atanmayan kişiler de sayıldığı için
   * AKTİF, grid'deki gerçek dağılımdan fazla görünüyordu ("alt toplam yanlış").
   * Artık result.chart'taki rol hücrelerinden distinct kişi sayılır → grid ile
   * birebir tutar.
   */
  const activeWorkforceByHour = useMemo(() => {
    // Kişiyi roller arası TEKİLLE (dual = 1 kişi) ve YARIM (1/2) kişiyi 0.5 say.
    // Backend "İsim 1/2" suffix'i gönderir (yarım giriş/çıkış/mola); aynı kişi
    // o saat tüm hücrelerinde aynı işaretle gelir. Önceden set.size her ismi 1
    // sayıyordu → 1/2'liler şişiriyordu (örn. 21:00 10.5 yerine 11).
    const byHour = new Map<number, Map<string, boolean>>(); // hour → (base → isHalf)
    for (const cell of result.chart) {
      const m = byHour.get(cell.hour) ?? new Map<string, boolean>();
      for (const p of cell.persons) {
        const isHalf = p.endsWith(" 1/2");
        const base = isHalf ? p.slice(0, -4) : p;
        // Herhangi bir hücrede TAM görünürse tam say (AND ile yarım kalır).
        m.set(base, (m.get(base) ?? true) && isHalf);
      }
      byHour.set(cell.hour, m);
    }
    const counts = new Map<number, number>();
    for (const [h, m] of byHour) {
      let total = 0;
      for (const isHalf of m.values()) total += isHalf ? 0.5 : 1;
      counts.set(h, total);
    }
    return counts;
  }, [result.chart]);
  const showActiveRow = activeWorkforceByHour.size > 0;

  return (
    <div className="border border-stone-300">
      <div className="px-4 py-3 border-b border-stone-300 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
        <span className="tracking-[0.25em] uppercase text-stone-500">Sonuç</span>
        <span
          className={`px-2 py-0.5 ${
            result.status === "OPTIMAL"
              ? "bg-emerald-100 text-emerald-700"
              : result.status === "FEASIBLE"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {result.status}
        </span>
        {result.qualityScore != null && (
          <span className="text-stone-600">Skor: {result.qualityScore.toFixed(1)}</span>
        )}
        <span className="text-stone-400">{result.elapsedSeconds.toFixed(2)}s</span>
        {result.chartId && <span className="text-stone-400">#{result.chartId}</span>}
        {result.chart.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            {onExportPdf && (
              <button
                onClick={() => onExportPdf(liveResp)}
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <FileDown size={11} strokeWidth={1.5} /> PDF
              </button>
            )}
            {onExportAreaPdf && (
              <button
                onClick={() => onExportAreaPdf(liveResp)}
                title="Deneysel: alanlara göre (Woman/Basic/TRF/Fitting Room/Sprinter) ayrı 5 tablo. Mevcut PDF'i değiştirmez."
                className="border border-stone-400 text-stone-700 px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <LayoutGrid size={11} strokeWidth={1.5} /> PDF (Alan)
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={() => onExportExcel(liveResp)}
                title="Düzenlenebilir .xlsx — Excel ve Apple Numbers'da açılır"
                className="border border-black px-3 py-1 text-[10px] tracking-[0.2em] uppercase flex items-center gap-1 hover:bg-stone-100"
              >
                <Download size={11} strokeWidth={1.5} /> Excel / Numbers
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pusula önerisi · AI bandı — SEMBOLİK/DEVRE DIŞI. Pusula verisi
          temsilî olduğundan öneri motoru bağlanmadı; tasarım bütünlüğü
          için görünür, buton disabled. Gerçek profillere bağlanınca aktif. */}
      {result.chart.length > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            padding: "10px 16px", borderBottom: "1px solid var(--zara-line-strong)",
            background: "var(--zara-gold-tint)",
          }}
        >
          <Sparkles size={14} strokeWidth={1.6} style={{ color: "var(--zara-gold-deep)", flex: "0 0 auto" }} />
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--zara-gold-deep)" }}>
            Pusula önerisi
          </span>
          <span style={{ fontFamily: "var(--ff-sans)", fontSize: 12.5, fontStyle: "italic", color: "var(--zara-ink-65)" }}>
            Tepe saatlerde yetkinlik dengesini artıracak bir kaydırma önerilebilir.
          </span>
          <button
            type="button"
            disabled
            title="Yakında — Pusula verisi gerçek profillere bağlanınca aktif olacak"
            style={{
              marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", border: "1px solid var(--zara-gold)", background: "transparent",
              fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "var(--zara-gold-deep)", cursor: "not-allowed", opacity: 0.55, whiteSpace: "nowrap",
            }}
          >
            Öneriyi uygula
          </button>
        </div>
      )}

      {result.chart.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-sm">
          {result.status === "INFEASIBLE"
            ? "Çözüm bulunamadı — vardiya tanımı çok kısıtlı olabilir."
            : "Sonuç boş."}
        </div>
      ) : (
        /* DİKEY layout: satırlar = saatler (çok), sütunlar = roller (az).
           Az roller, çok saatler senaryosunda daha okunaklı. */
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-white" style={{ boxShadow: "inset 0 -2px 0 #000" }}>
                <th className="sticky top-0 bg-white text-left p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal w-16">
                  Saat
                </th>
                {roles.map((r) => (
                  <th
                    key={r}
                    className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-600 font-normal"
                  >
                    {roleLabel(r)}
                  </th>
                ))}
                {hasMola && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-amber-700 font-normal">
                    Mola
                  </th>
                )}
                {hasTasks && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-rose-700 font-normal">
                    Task
                  </th>
                )}
                {showActiveRow && (
                  <th className="sticky top-0 bg-white text-center p-2 text-[9px] tracking-[0.25em] uppercase text-stone-500 font-normal">
                    Aktif
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h} className="border-b border-stone-200">
                  <td className="p-2 text-[10px] font-mono tabular-nums text-stone-700 bg-stone-50">
                    {String(h).padStart(2, "0")}:00
                  </td>
                  {roles.map((r) => {
                    const persons = cellsByHourRole.get(`${h}|${r}`) ?? [];
                    // Yarım molalı kişi normal rolde de görünüyorsa "X 1/2"
                    // (paslaşma vurgusu — iki yarım molalı kişi aynı zone'u tutar).
                    const labeled = persons.map((p) => displayName(p, h));
                    return (
                      <td key={r} className="p-2 text-center">
                        {labeled.length === 0 ? (
                          <span className="text-stone-300">—</span>
                        ) : (
                          <span className="leading-tight">{labeled.join(" · ")}</span>
                        )}
                      </td>
                    );
                  })}
                  {hasMola && (
                    <td className="p-2 text-center bg-amber-50/50">
                      {(molaByHour.get(h) ?? []).length === 0 ? (
                        <span className="text-stone-300">—</span>
                      ) : (
                        <span className="leading-tight text-amber-800">
                          {(molaByHour.get(h) ?? []).join(" · ")}
                        </span>
                      )}
                    </td>
                  )}
                  {hasTasks && (
                    <td className="p-2 text-center bg-rose-50/50">
                      {(tasksByHour.get(h) ?? []).length === 0 ? (
                        <span className="text-stone-300">—</span>
                      ) : (
                        <span className="leading-tight text-rose-800">
                          {(tasksByHour.get(h) ?? [])
                            .map((t) => `${t.name} (${t.type})`)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                  )}
                  {showActiveRow && (
                    <td className="p-2 text-center font-mono tabular-nums text-stone-600 bg-stone-50/40">
                      {activeWorkforceByHour.get(h) ?? 0}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="px-4 py-3 border-t border-stone-300 text-xs">
          <div className="text-[9px] tracking-[0.25em] uppercase text-amber-700 mb-1">Uyarılar</div>
          <ul className="list-disc pl-4 text-stone-600 space-y-0.5">
            {result.warnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {staff && result.chart.length > 0 && (
        <div className="px-4 pb-4">
          <ResponsibilitiesPanel
            chartId={result.chartId}
            staff={staff}
            initial={result.responsibilities ?? undefined}
            onChange={setLiveResp}
          />
        </div>
      )}
    </div>
  );
}
