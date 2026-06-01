import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { BuenasDiasForm } from "./components/BuenasDiasForm";
import { ActionBar, ActualsForm } from "./components/ActionBar";
import { CalibrationBanner } from "./components/CalibrationBanner";
import type { PdfPayload } from "@/lib/buenas-dias/pdf";
import { Loader2 } from "lucide-react";
import { Link } from "react-router";
import {
  emptyReyonGrid,
  type ReyonGrid,
  type Reyon,
  type UrunGrubu,
  type Weather,
} from "@contracts/buenas-dias";

/**
 * Buenas Dias bugün sayfası — sabah toplantısı için form.
 *
 * Akış:
 *   1) `days.ensure(today)` — kayıt yoksa TASLAK olarak yarat
 *   2) `days.getByDate(today)` — günü oku
 *   3) `challenge.status(today)` — Motor B + A↔B rozeti
 *   4) `days.derived(today)` — Compran/Productivity/Gap
 *   5) `weather.today` — bağlam şeridi için sıcaklık vb.
 *
 * Faz 4b: TASLAK durumda inline-edit. Bir ref_reyon hücresi değişince
 * 600 ms debounce sonra `calculateAndSave` tetiklenir; Motor A yeniden hesap +
 * target_reyon DB'de güncellenir.
 */
export default function BuenasDiasToday() {
  const today = useMemo(() => todayIstanbul(), []);

  const ensure = trpc.buenasDias.days.ensure.useMutation();
  const calcAndSave = trpc.buenasDias.days.calculateAndSave.useMutation();

  const dayQuery = trpc.buenasDias.days.getByDate.useQuery({ date: today });
  const challengeQuery = trpc.buenasDias.challenge.status.useQuery({ today });
  const derivedQuery = trpc.buenasDias.days.derived.useQuery({ date: today });
  const weatherQuery = trpc.buenasDias.weather.today.useQuery();
  const settingsQuery = trpc.buenasDias.settings.get.useQuery();

  // Inline-edit lokal taslağı — kullanıcı yazarken anında reflect edilsin.
  // DB'ye debounce'lu yazılır; cevap geldiğinde dayQuery yenilenir.
  const [draftRef, setDraftRef] = useState<RefShape | null>(null);
  const [draftPlannedSint, setDraftPlannedSint] = useState<number | null>(null);

  // İlk yükleme: DB'den gelen ref değerlerini lokal taslağa kopyala.
  // Sonraki yüklemelerde de senkron tut — ama kullanıcı yazarken üstüne yazma.
  useEffect(() => {
    if (!dayQuery.data) return;
    if (!draftRef) {
      setDraftRef({
        totalAdet: dayQuery.data.refTotalAdet ?? 0,
        totalTl: dayQuery.data.refTotalTl ?? 0,
        visit: dayQuery.data.refVisit ?? null,
        reyon: (dayQuery.data.refReyon as ReyonGrid | null) ?? emptyReyonGrid(),
      });
      setDraftPlannedSint(dayQuery.data.plannedSint ?? null);
    }
  }, [dayQuery.data, draftRef]);

  // Debounce — kullanıcı yazarken her tuş için DB'ye gitmesin.
  const debouncedSave = useDebouncedCallback((ref: RefShape, plannedSint: number | null) => {
    calcAndSave.mutate(
      {
        date: today,
        ref: {
          totalAdet: ref.totalAdet,
          totalTl: ref.totalTl,
          visit: ref.visit,
          reyon: ref.reyon,
        },
        plannedSint: plannedSint ?? undefined,
      },
      {
        onSuccess: () => {
          dayQuery.refetch();
          challengeQuery.refetch();
          derivedQuery.refetch();
        },
      },
    );
  }, 600);

  const handleReyonRefChange = useCallback(
    (r: Reyon, u: UrunGrubu, value: number) => {
      if (!draftRef) return;
      const newReyon: ReyonGrid = {
        ...draftRef.reyon,
        [r]: { ...draftRef.reyon[r], [u]: value },
      };
      // Toplam adet 9 hücrenin toplamı (tutarlılık için form-side önizleme;
      // sunucu gerçek hesabı yapacak).
      const totalAdet = sumGrid(newReyon);
      const newRef: RefShape = { ...draftRef, reyon: newReyon, totalAdet };
      setDraftRef(newRef);
      debouncedSave(newRef, draftPlannedSint);
    },
    [draftRef, draftPlannedSint, debouncedSave],
  );

  const handlePlannedSintChange = useCallback(
    (value: number | null) => {
      setDraftPlannedSint(value);
      if (draftRef) debouncedSave(draftRef, value);
    },
    [draftRef, debouncedSave],
  );

  // Sayfaya girince bir kez ensure çağır; var olan kaydı bozmaz.
  useEffect(() => {
    if (!ensure.isPending && !ensure.isSuccess && !ensure.isError) {
      ensure.mutate(
        { date: today },
        {
          onSuccess: () => {
            dayQuery.refetch();
            derivedQuery.refetch();
            challengeQuery.refetch();
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const loading =
    dayQuery.isLoading ||
    challengeQuery.isLoading ||
    derivedQuery.isLoading ||
    weatherQuery.isLoading ||
    settingsQuery.isLoading ||
    ensure.isPending;

  const status = dayQuery.data?.status as
    | "TASLAK"
    | "ONAYLANDI"
    | "GERCEKLESTI"
    | undefined;
  const editable = status === "TASLAK";

  return (
    <div className="zt-editorial so-shell">
      <header className="so-head">
        <div className="so-brand">
          <div className="bn">Buenas <em>Dias</em></div>
          <div className="bs num">{today}</div>
        </div>
        <div className="so-tabs" style={{ gap: 16 }}>
          {calcAndSave.isPending && (
            <span className="eb" style={{ color: "var(--zara-gold-deep)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Loader2 className="h-3 w-3 animate-spin" /> kaydediliyor
            </span>
          )}
          <Link to="/buenas-dias/setup" className="so-tab">Setup</Link>
          <Link to="/" className="so-tab">← Atelye</Link>
        </div>
      </header>

      <main className="content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && (
          <div className="flex items-center gap-2 text-neutral-500 py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Hazırlanıyor…</span>
          </div>
        )}

        {!loading && dayQuery.data && (
          <>
            <CalibrationBanner
              onChanged={() => {
                // Katsayı uygulandığında türev hesaplar değişebilir; sayfayı senkronlayalım.
                dayQuery.refetch();
                challengeQuery.refetch();
              }}
            />

            <ActionBar
              status={status!}
              date={today}
              hasActuals={hasRequiredActuals(dayQuery.data)}
              onChanged={() => {
                dayQuery.refetch();
                challengeQuery.refetch();
                derivedQuery.refetch();
              }}
              pdfPayload={buildPdfPayload(dayQuery.data, derivedQuery.data, challengeQuery.data, settingsQuery.data, today)}
            />

            <BuenasDiasForm
              day={dayQuery.data}
              challenge={challengeQuery.data}
              derived={derivedQuery.data}
              weather={weatherQuery.data}
              settings={settingsQuery.data}
              today={today}
              editable={editable}
              draftRef={draftRef}
              draftPlannedSint={draftPlannedSint}
              onReyonRefChange={handleReyonRefChange}
              onPlannedSintChange={handlePlannedSintChange}
            />

            {status === "ONAYLANDI" && (
              <ActualsForm
                date={today}
                initial={{
                  actualTotalAdet: dayQuery.data.actualTotalAdet,
                  actualTotalTl: dayQuery.data.actualTotalTl,
                  actualVisit: dayQuery.data.actualVisit,
                  actualFis: dayQuery.data.actualFis,
                  actualSint: dayQuery.data.actualSint,
                  actualGap: dayQuery.data.actualGap,
                }}
                onChanged={() => {
                  dayQuery.refetch();
                  derivedQuery.refetch();
                }}
              />
            )}
          </>
        )}

        {!loading && !dayQuery.data && (
          <div className="text-center text-neutral-500 py-12">
            Bugünün kaydı yok. Sayfa yenilenince oluşturulur.
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

export type RefShape = {
  totalAdet: number;
  totalTl: number;
  visit: number | null;
  reyon: ReyonGrid;
};

function sumGrid(g: ReyonGrid): number {
  let s = 0;
  for (const r of ["kadin", "erkek", "cocuk"] as const) {
    for (const u of ["tekstil", "tempe", "parfum"] as const) {
      s += g[r]?.[u] ?? 0;
    }
  }
  return s;
}

/**
 * PDF için payload üretir — Today.tsx'in tRPC sorgu çıktılarını PdfPayload tipine map'ler.
 * Veriler henüz hazır değilse null döner (PDF butonu görünmez).
 */
function buildPdfPayload(
  day: { [k: string]: unknown } | null | undefined,
  derived: { [k: string]: unknown } | null | undefined,
  challenge: { [k: string]: unknown } | null | undefined,
  settings: { [k: string]: unknown } | null | undefined,
  date: string,
): PdfPayload | null {
  if (!day) return null;
  return {
    date,
    day: day as PdfPayload["day"],
    derived: (derived as PdfPayload["derived"]) ?? null,
    challenge: (challenge as PdfPayload["challenge"]) ?? null,
    settings: (settings as PdfPayload["settings"]) ?? null,
  };
}

function hasRequiredActuals(day: {
  actualTotalTl: number | null;
  actualTotalAdet: number | null;
  actualVisit: number | null;
  actualFis: number | null;
}): boolean {
  return (
    day.actualTotalTl != null &&
    day.actualTotalAdet != null &&
    day.actualVisit != null &&
    day.actualFis != null
  );
}

/** Türkiye lokal bugünün tarihini YYYY-MM-DD olarak verir. */
function todayIstanbul(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/**
 * Basit debounce — son çağrıyı `wait` ms sonra fire eder.
 * useRef sayesinde her render'da yeni timer yaratmaz.
 */
function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, wait: number): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), wait);
    }) as T,
    [wait],
  );
}

// Tip imzası — Weather contract'tan tekrar export edilmesini sağlamak için referans tut.
export type { Weather };
