/**
 * Railway'deki FastAPI shift-solver-api ile konuşan server-side client.
 * Tarayıcıya açılmaz — yalnızca tRPC procedure'lardan çağrılır.
 */

export type SolverStaffInput = {
  short_name: string;
  full_name: string;
  group: string;
  competencies: Record<string, number>;
  /** Görev etiketi: COACH | CX | COM | null. Yetkinlik tablosundan (duty). */
  role_tag?: string | null;
  /** Çalışma tipi: FT | PT | null. Yetkinlik tablosundan (employment). */
  contract_type?: string | null;
  /** Sabit çalışma alanı: WOMAN | BASIC | TRF | FITTING_ROOM | … | null. */
  home_area?: string | null;
};

export type SolverShiftInput = {
  short_name: string;
  start_hour: number;
  end_hour: number;
  breaks?: Array<[number, number]>;
  /** Blocking tasklar: [(saat, 'HR'|'TR'|'ISG')]. Pembe tasklar buraya gelmez. */
  tasks?: Array<[number, string]>;
  /** Kişinin sabit alanı — short_name üzerinden personel kaydından eşlenir. */
  home_area?: string | null;
};

export type SolverConfigInput = {
  competency_weight?: number;
  fairness_weight?: number;
  development_weight?: number;
  max_consecutive_hours?: number;
  time_limit_seconds?: number;
};

export type SolveRequest = {
  shift_date: string;
  hours: number[];
  staff: SolverStaffInput[];
  shifts: SolverShiftInput[];
  config?: SolverConfigInput;
  /** Settings → Yasaklar UI'ından gelen kullanıcı yasakları, örn ["ZONE_4","ZONE_5"]. */
  forbidden_pairs?: Array<[string, string]>;
  /** Kişi-rol bias: { 'Fadime': { 'KABIN': -100, 'SPRINTER': 80 } } */
  person_role_biases?: Record<string, Record<string, number>>;
};

export type SolveResponse = {
  status: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "UNKNOWN";
  chart: Array<{ role: string; hour: number; persons: string[] }>;
  quality_score: number | null;
  warnings: string[];
  errors: string[];
  elapsed_seconds: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;

function getSolverUrl(): string {
  const url = process.env.SHIFT_SOLVER_URL;
  if (!url) {
    throw new Error(
      "SHIFT_SOLVER_URL is not configured. Set it in Vercel env or .env.local.",
    );
  }
  return url.replace(/\/$/, "");
}

export async function solveShift(req: SolveRequest): Promise<SolveResponse> {
  const base = getSolverUrl();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Solver ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as SolveResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function pingSolver(): Promise<{ ok: boolean; url: string; status?: number }> {
  const base = getSolverUrl();
  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    return { ok: res.ok, url: base, status: res.status };
  } catch {
    return { ok: false, url: base };
  }
}
