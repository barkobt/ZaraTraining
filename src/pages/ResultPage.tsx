import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { CabinCurtain, CABIN_THEMES, type CabinKey } from "@/components/CabinCurtain";
import { SoftButton } from "@/components/SoftButton";
import { getLocal } from "@/hooks/useLocalParticipant";

function useCountUp(target: number, duration = 1400, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) {
      setVal(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

type View = "closed" | "opened" | "all";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isLocal = !!id?.startsWith("local-");
  const localData = useMemo(() => (isLocal && id ? getLocal(id) : null), [isLocal, id]);

  const numericId = Number(id);
  const isNumeric = !isLocal && !isNaN(numericId);

  const { data: remoteData, isLoading } = trpc.participant.getById.useQuery(
    { id: numericId },
    { enabled: isNumeric }
  );

  const data = localData ?? remoteData;
  const cabinKey = (data?.cabin as CabinKey) || "gelisim";

  const [view, setView] = useState<View>("closed");
  const [allRevealed, setAllRevealed] = useState<Record<CabinKey, boolean>>({
    baslangic: false,
    gelisim: false,
    altin: false,
  });

  // Auto-stagger reveal when entering "all" view
  useEffect(() => {
    if (view !== "all") {
      setAllRevealed({ baslangic: false, gelisim: false, altin: false });
      return;
    }
    const timers: number[] = [];
    const order: CabinKey[] = ["baslangic", "gelisim", "altin"];
    order.forEach((k, i) => {
      timers.push(
        window.setTimeout(() => {
          setAllRevealed((prev) => ({ ...prev, [k]: true }));
        }, 400 + i * 600)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [view]);

  const score = useCountUp(data?.totalScore ?? 0, 1400, !!data && view === "opened");

  if (isLoading && !localData) {
    return (
      <div className="min-h-screen bg-zara flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={20} className="text-ink/40 animate-spin" />
          <p className="text-ink/40 font-mono text-[10px] tracking-[0.3em] uppercase">
            Sonuçlar Hesaplanıyor
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zara flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-ink/40 font-serif">Sonuç bulunamadı.</p>
          <button onClick={() => navigate("/")} className="text-xs underline text-ink/50">
            Ana Sayfa
          </button>
        </div>
      </div>
    );
  }

  const theme = CABIN_THEMES[cabinKey];

  return (
    <div className="min-h-screen bg-zara text-ink relative overflow-hidden flex flex-col">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle, ${theme.accent}26 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 md:px-12 py-5 flex items-center justify-between border-b border-zara animate-fade-down">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40 hover:text-ink transition-colors"
        >
          <ArrowLeft size={12} />
          <span className="hidden sm:inline">ZARA · ACADEMY</span>
          <span className="sm:hidden">ZARA</span>
        </button>
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40 truncate max-w-[60%]">
          RESULT · {data.name?.toUpperCase()}
        </div>
      </header>

      {/* === VIEW: CLOSED — kişi kendi kabinini açar === */}
      {view === "closed" && (
        <main key="v-closed" className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl flex flex-col items-center text-center gap-8 animate-fade-up">
            <div className="space-y-3">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)]">
                · YOUR PRIVATE REVEAL
              </div>
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-[-0.03em] leading-[0.95] text-ink">
                Kabininiz <span className="italic font-light">hazır.</span>
              </h1>
              <p className="text-sm sm:text-base text-ink/55 font-sans max-w-md mx-auto leading-relaxed">
                {data.name}, sizin için ayrılan kabin perde arkasında. Açmak için tıklayın.
              </p>
            </div>

            <div className="w-full max-w-[280px] sm:max-w-[400px] animate-scale-fade delay-200">
              <CabinCurtain
                cabinKey={cabinKey}
                revealed={false}
                onClick={() => setView("opened")}
                size="lg"
                showHint={true}
                showDescription={false}
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40 animate-fade-in delay-500">
              <Sparkles size={11} className="text-[var(--zara-gold)]" />
              KABİNE TIKLAYIN
            </div>
          </div>
        </main>
      )}

      {/* === VIEW: OPENED — kabin açıldı, skor kartı belirir === */}
      {view === "opened" && (
        <main key="v-opened" className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 sm:py-12 gap-8 sm:gap-10">
          {/* Cabin (revealed) */}
          <div className="w-full max-w-[300px] sm:max-w-[420px] animate-fade-up">
            <CabinCurtain
              cabinKey={cabinKey}
              revealed={true}
              size="lg"
              showHint={false}
              showDescription={true}
            />
          </div>

          {/* Score card */}
          <div
            className="relative w-full max-w-3xl bg-white shadow-[0_30px_80px_-30px_rgba(26,22,20,0.25)] animate-fade-up delay-700 overflow-hidden"
          >
            <div
              className="h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Score */}
              <div
                className="p-8 sm:p-10 md:p-12 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r"
                style={{
                  background: `linear-gradient(180deg, ${theme.accent}0d 0%, transparent 100%)`,
                  borderColor: "var(--zara-line)",
                }}
              >
                <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
                  TOPLAM PUAN
                </div>
                <div className="mt-3 flex items-baseline justify-center gap-2">
                  <span
                    className="font-serif font-light text-[88px] sm:text-[120px] md:text-[150px] leading-[0.85] tracking-[-0.05em] tabular-nums"
                    style={{ color: theme.accent }}
                  >
                    {score}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl text-ink/30 italic">/12</span>
                </div>
                <div
                  className="mt-5 w-12 h-px"
                  style={{ background: theme.accent }}
                />
                <div className="mt-5 text-[10px] font-mono tracking-[0.3em] uppercase text-ink/50">
                  · {data.name} ·
                </div>
              </div>

              {/* Cabin label */}
              <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-center">
                <div
                  className="text-[10px] font-mono tracking-[0.3em] uppercase mb-2"
                  style={{ color: theme.accent }}
                >
                  KABİNİNİZ
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[-0.02em] leading-[1] text-ink">
                  {data.cabinName?.split(" ")[0]}
                  <br />
                  <span className="italic font-light" style={{ color: theme.accent }}>
                    {data.cabinName?.split(" ").slice(1).join(" ")}
                  </span>
                </h2>
                <p className="mt-3 text-xs font-sans tracking-[0.15em] uppercase text-ink/50">
                  — {data.label}
                </p>
                <p className="mt-5 text-sm text-ink/65 italic font-serif leading-relaxed">
                  {data.description}
                </p>
              </div>
            </div>

            {/* Long text */}
            <div
              className="p-6 sm:p-8 md:p-12 border-t"
              style={{ background: "var(--zara-bg)", borderColor: "var(--zara-line)" }}
            >
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40 mb-4">
                · SİZE NOTUMUZ
              </div>
              <p className="text-sm text-ink/75 leading-relaxed font-sans whitespace-pre-line">
                {data.longText}
              </p>
            </div>

            <div className="px-6 sm:px-8 md:px-12 py-4 border-t border-zara">
              <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-ink/30 text-center">
                Bu test sizi yargılamak için değildi · Her puan, gelişim için bir başlangıçtır
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-3xl animate-fade-up delay-1000">
            <SoftButton
              variant="outline"
              tone="gold"
              onClick={() => setView("all")}
              iconLeft={<Sparkles size={13} />}
              fullWidth
              className="sm:!w-auto sm:flex-1"
            >
              Tüm Kabinleri Göster
            </SoftButton>
            <SoftButton
              variant="primary"
              tone="ink"
              onClick={() => navigate("/")}
              iconLeft={<ArrowLeft size={13} />}
              fullWidth
              className="sm:!w-auto sm:flex-1"
            >
              Ana Sayfa
            </SoftButton>
            <SoftButton
              variant="ghost"
              size="md"
              onClick={() => navigate("/test")}
              iconLeft={<RotateCcw size={12} />}
              fullWidth
              className="sm:!w-auto"
            >
              Yeniden
            </SoftButton>
          </div>
        </main>
      )}

      {/* === VIEW: ALL — 3 kabin staggered === */}
      {view === "all" && (
        <main key="v-all" className="relative z-10 flex-1 flex flex-col px-4 py-8 sm:py-12 gap-8 sm:gap-12">
          <div className="text-center max-w-3xl mx-auto animate-fade-up">
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)] mb-3">
              · THE FULL PICTURE
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-[-0.03em] leading-[0.95] text-ink">
              Üç <span className="italic font-light">Kabin</span>
            </h2>
            <p className="mt-4 text-sm text-ink/55 font-sans">
              Her senaryonun farklı bir hikayesi var. İşte tüm kabinlerin perdeleri:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl w-full mx-auto items-end">
            {(["baslangic", "gelisim", "altin"] as CabinKey[]).map((k, i) => {
              const isMine = k === cabinKey;
              return (
                <div
                  key={k}
                  className="flex flex-col items-center gap-4 animate-fade-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/40">
                      KABİN
                    </span>
                    <span
                      className="font-serif text-3xl italic"
                      style={{ color: CABIN_THEMES[k].accent }}
                    >
                      {CABIN_THEMES[k].no}
                    </span>
                    {isMine && (
                      <span
                        className="text-[9px] font-mono tracking-[0.25em] uppercase px-2 py-0.5"
                        style={{ background: `${CABIN_THEMES[k].accent}1f`, color: CABIN_THEMES[k].accent }}
                      >
                        SİZİN
                      </span>
                    )}
                  </div>

                  <CabinCurtain
                    cabinKey={k}
                    revealed={!!allRevealed[k]}
                    onClick={() =>
                      setAllRevealed((prev) => ({ ...prev, [k]: !prev[k] }))
                    }
                    size="md"
                    showHint={false}
                    showDescription={true}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <SoftButton
              variant="primary"
              tone="ink"
              onClick={() => setView("opened")}
              iconLeft={<ArrowLeft size={13} />}
            >
              Kabinime Geri Dön
            </SoftButton>
          </div>
        </main>
      )}

      {/* Footer marker */}
      <footer className="relative z-10 border-t border-zara py-4 text-center mt-auto">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/30">
          ZARA · THE ACADEMY · 2026
        </span>
      </footer>
    </div>
  );
}
