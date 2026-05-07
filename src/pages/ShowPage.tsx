import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, EyeOff, Play } from "lucide-react";
import { CabinCurtain, CABIN_THEMES, type CabinKey } from "@/components/CabinCurtain";
import { SoftButton } from "@/components/SoftButton";

const CABIN_ORDER: CabinKey[] = ["baslangic", "gelisim", "altin"];

export default function ShowPage() {
  const navigate = useNavigate();
  const { data: participants } = trpc.admin.list.useQuery(undefined, {
    refetchInterval: 4000,
  });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const revealAllSequence = async () => {
    setRevealed({});
    for (const key of CABIN_ORDER) {
      await new Promise((r) => setTimeout(r, 1200));
      setRevealed((prev) => ({ ...prev, [key]: true }));
    }
  };

  const toggleReveal = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closeAll = () => setRevealed({});

  // Keyboard: 1/2/3 toggle, A reveal-all, ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") toggleReveal("baslangic");
      else if (e.key === "2") toggleReveal("gelisim");
      else if (e.key === "3") toggleReveal("altin");
      else if (e.key === "Escape") closeAll();
      else if (e.key.toLowerCase() === "a") void revealAllSequence();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cabinPeople = (key: string) =>
    participants?.filter((p) => p.cabin === key).sort((a, b) => b.totalScore - a.totalScore) || [];

  const totalCount = participants?.length || 0;

  return (
    <div className="min-h-screen bg-zara text-ink flex flex-col relative overflow-hidden">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(184,147,90,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 md:px-12 py-5 flex items-center justify-between border-b border-zara animate-fade-down">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40 hover:text-ink transition-colors"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">ZARA · ACADEMY</span>
            <span className="sm:hidden">ZARA</span>
          </button>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
            <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">
              SHOW MODE · {totalCount}/40
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SoftButton
            variant="primary"
            tone="ink"
            size="sm"
            onClick={revealAllSequence}
            iconLeft={<Play size={11} />}
          >
            Sırayla Aç
          </SoftButton>
          <SoftButton
            variant="outline"
            tone="ink"
            size="sm"
            onClick={closeAll}
            iconLeft={<EyeOff size={11} />}
          >
            Hepsini Kapat
          </SoftButton>
        </div>
      </header>

      {/* Title */}
      <div className="relative z-10 text-center pt-8 sm:pt-10 pb-6 sm:pb-8 px-4 animate-fade-up">
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)] mb-3">
          · THE GRAND REVEAL ·
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-[-0.03em] leading-[0.95] text-ink">
          3 Kabin <span className="italic font-light">Sürprizi</span>
        </h1>
        <p className="mt-4 text-xs font-mono tracking-[0.25em] uppercase text-ink/40">
          Hangisi sizinki?
        </p>
      </div>

      {/* Stage */}
      <main className="relative z-10 flex-1 flex items-end justify-center px-4 md:px-8 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-7xl w-full">
          {CABIN_ORDER.map((cabinKey, index) => {
            const theme = CABIN_THEMES[cabinKey];
            const isRevealed = revealed[cabinKey] || false;
            const people = cabinPeople(cabinKey);

            return (
              <div
                key={cabinKey}
                className="flex flex-col items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${100 + index * 150}ms` }}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/40">
                    KABİN
                  </span>
                  <span className="font-serif text-3xl italic" style={{ color: theme.accent }}>
                    {theme.no}
                  </span>
                </div>

                <CabinCurtain
                  cabinKey={cabinKey}
                  revealed={isRevealed}
                  onClick={() => toggleReveal(cabinKey)}
                  people={people}
                  size="md"
                  showHint={true}
                  showPeople={true}
                  showDescription={true}
                />

                <SoftButton
                  variant="outline"
                  tone={cabinKey === "altin" ? "gold" : cabinKey === "baslangic" ? "bronze" : "stone"}
                  size="sm"
                  onClick={() => toggleReveal(cabinKey)}
                >
                  {isRevealed ? "Kapat" : "Aç"}
                </SoftButton>

                <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/30">
                  {people.length} KİŞİ
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zara py-4 text-center">
        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/30">
          1·2·3 KABİN AÇ · A SIRAYLA · ESC KAPAT
        </span>
      </footer>
    </div>
  );
}
