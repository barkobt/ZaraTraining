import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, ArrowRight, Send, Loader2, Check } from "lucide-react";
import { QUESTIONS } from "@contracts/constants";
import { saveLocal } from "@/hooks/useLocalParticipant";
import { SoftButton } from "@/components/SoftButton";

const CORNER_IMAGES = [
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&h=900&fit=crop&q=85&auto=format&sat=-100",
];

export default function TestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nameFromUrl = searchParams.get("name") || "";

  const [name, setName] = useState(nameFromUrl);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(nameFromUrl ? 0 : -1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Submit: tRPC first, localStorage fallback on any error so the flow always completes.
  const submitMutation = trpc.participant.submit.useMutation({
    onSuccess: (data) => navigate(`/sonuc/${data.id}`),
    onError: () => {
      const local = saveLocal(name.trim(), answers);
      navigate(`/sonuc/${local.id}`);
    },
  });

  useEffect(() => {
    const next = CORNER_IMAGES[(currentStep + 1) % CORNER_IMAGES.length];
    const img = new Image();
    img.src = next;
  }, [currentStep]);

  const handleNameSubmit = () => {
    if (name.trim()) setCurrentStep(0);
  };

  const handleSelect = (optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [String(currentStep + 1)]: optionKey }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setDirection("forward");
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    submitMutation.mutate({ name: name.trim(), answers });
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentStep];
  const selectedAnswer = answers[String(currentStep + 1)];

  // ── Name entry ──
  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-zara text-ink flex items-center justify-center relative overflow-hidden px-4">
        <img
          src={CORNER_IMAGES[0]}
          alt=""
          className="absolute top-0 left-0 w-1/3 max-w-md h-full object-cover opacity-40 grayscale animate-fade-in hidden sm:block"
        />
        <img
          src={CORNER_IMAGES[3]}
          alt=""
          className="absolute top-0 right-0 w-1/3 max-w-md h-full object-cover opacity-40 grayscale animate-fade-in hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--zara-bg)] via-[var(--zara-bg)]/30 to-[var(--zara-bg)]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center space-y-10">
            <div className="animate-fade-down">
              <div className="font-serif font-semibold text-2xl tracking-[-0.02em] text-ink">ZARA</div>
              <div className="mt-1 text-[10px] tracking-[0.32em] font-mono uppercase text-ink/40">
                The Academy
              </div>
            </div>

            <div className="space-y-3 animate-fade-up delay-100">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)]">
                · WELCOME
              </div>
              <h2 className="font-serif text-5xl md:text-6xl text-ink tracking-[-0.03em] leading-[0.95]">
                Hoş<br />
                <span className="italic font-light">Geldiniz</span>
              </h2>
              <p className="text-xs text-ink/50 font-sans tracking-wider mt-4">
                Teste başlamadan önce adınızı girin.
              </p>
            </div>

            <div className="space-y-6 animate-fade-up delay-200">
              <input
                type="text"
                placeholder="Adınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="w-full bg-transparent border-b border-ink/20 px-2 py-3 text-ink text-center placeholder:text-ink/20 focus:outline-none focus:border-[var(--zara-gold)] transition-colors text-xl font-serif tracking-wide"
              />
              <SoftButton
                variant="primary"
                tone="ink"
                size="lg"
                onClick={handleNameSubmit}
                disabled={!name.trim()}
                iconRight={<ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />}
              >
                Başla
              </SoftButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Question screen ──
  return (
    <div className="min-h-screen bg-zara text-ink flex flex-col relative overflow-hidden">
      <div key={`bg-${currentStep}`} className="absolute inset-0 pointer-events-none animate-fade-in">
        <img
          src={CORNER_IMAGES[currentStep % CORNER_IMAGES.length]}
          alt=""
          className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-25 grayscale hidden md:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--zara-bg)] via-[var(--zara-bg)] to-transparent" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 px-4 sm:px-6 md:px-12 py-4 sm:py-5 flex items-center justify-between border-b border-zara">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40 hover:text-ink transition-colors"
        >
          <ArrowLeft size={12} />
          <span className="hidden sm:inline">ZARA · ACADEMY</span>
          <span className="sm:hidden">ZARA</span>
        </button>
        <div className="hidden sm:flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/40">CHAPTER</span>
          <span className="font-serif text-lg italic text-ink">
            {String(currentStep + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] text-ink/30">/</span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/40">
            {String(QUESTIONS.length).padStart(2, "0")}
          </span>
        </div>
        <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-ink/40 tabular-nums">
          {Math.round(progress)}%
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 h-[2px] bg-ink/5">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--zara-gold)] transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 w-1.5 h-1.5 -translate-y-[2px] rounded-full bg-[var(--zara-gold)] shadow-[0_0_8px_rgba(184,147,90,0.7)] transition-all duration-700"
          style={{ left: `calc(${progress}% - 3px)` }}
        />
      </div>

      {/* Step dots */}
      <div className="relative z-10 px-4 sm:px-6 md:px-12 py-3 sm:py-4 flex items-center justify-center gap-1.5">
        {QUESTIONS.map((_, i) => {
          const answered = answers[String(i + 1)];
          const isCurrent = i === currentStep;
          return (
            <button
              key={i}
              onClick={() => {
                if (answered || i <= currentStep) {
                  setDirection(i > currentStep ? "forward" : "backward");
                  setCurrentStep(i);
                }
              }}
              className={`h-1 transition-all duration-500 ease-out ${
                isCurrent
                  ? "w-10 bg-[var(--zara-ink-soft)]"
                  : answered
                  ? "w-6 bg-[var(--zara-gold)]"
                  : "w-6 bg-ink/15 hover:bg-ink/30"
              }`}
              aria-label={`Question ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Question Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-4 md:px-12 py-4 md:py-6">
        <div
          key={currentStep}
          className={`w-full max-w-3xl ${
            direction === "forward" ? "animate-slide-r" : "animate-slide-l"
          }`}
        >
          <div className="bg-white shadow-[0_30px_80px_-30px_rgba(26,22,20,0.25)] relative">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--zara-gold)] to-transparent" />

            <div className="p-5 sm:p-8 md:p-12 space-y-6 md:space-y-8">
              {/* Question header */}
              <div className="flex items-baseline justify-between pb-4 sm:pb-6 border-b border-zara">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--zara-gold)]">
                    SCENARIO
                  </span>
                  <span className="font-serif text-3xl sm:text-4xl italic text-ink leading-none">
                    {String(currentQuestion.id).padStart(2, "0")}
                  </span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/30">
                  / {String(QUESTIONS.length).padStart(2, "0")}
                </span>
              </div>

              {/* Question text */}
              <p className="font-serif text-lg sm:text-xl md:text-[26px] text-ink leading-[1.4] tracking-[-0.01em] animate-fade-up delay-100">
                {currentQuestion.text}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selectedAnswer === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelect(opt.key)}
                      className={`group w-full text-left relative overflow-hidden border transition-all duration-300 ease-out animate-fade-up`}
                      style={{
                        animationDelay: `${150 + i * 80}ms`,
                        borderColor: isSelected ? "var(--zara-gold)" : "var(--zara-line-strong)",
                        background: isSelected ? "var(--zara-gold-tint)" : "transparent",
                        boxShadow: isSelected ? "0 0 0 1px var(--zara-gold)" : "none",
                      }}
                    >
                      <span
                        className={`absolute inset-0 transition-transform duration-500 origin-left ${
                          isSelected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                        style={{ background: "rgba(184, 147, 90, 0.05)" }}
                      />
                      <div className="relative flex items-stretch min-h-[56px] sm:min-h-[64px]">
                        {/* Letter badge — soft cream + gold-outlined when selected */}
                        <div
                          className="flex-shrink-0 w-12 sm:w-14 md:w-16 flex items-center justify-center border-r transition-all duration-300"
                          style={{
                            borderColor: isSelected ? "var(--zara-gold)" : "var(--zara-line-strong)",
                            background: isSelected ? "var(--zara-bg-warm)" : "transparent",
                          }}
                        >
                          <span
                            className="font-serif text-2xl italic transition-colors duration-300"
                            style={{
                              color: isSelected ? "var(--zara-gold)" : "rgba(26,22,20,0.45)",
                            }}
                          >
                            {opt.key}
                          </span>
                        </div>

                        {/* Option text */}
                        <div className="flex-1 px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 flex items-center justify-between gap-3">
                          <span
                            className={`text-sm md:text-[15px] leading-relaxed font-sans transition-colors ${
                              isSelected ? "text-ink" : "text-ink/70 group-hover:text-ink"
                            }`}
                          >
                            {opt.text}
                          </span>
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? "bg-[var(--zara-gold)] border-[var(--zara-gold)] scale-100"
                                : "border-ink/15 scale-90"
                            }`}
                          >
                            {isSelected && <Check size={11} className="text-white" />}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-zara gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40 hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={12} />
                  Önceki
                </button>

                {currentStep === QUESTIONS.length - 1 ? (
                  <SoftButton
                    variant="primary"
                    tone="ink"
                    onClick={handleSubmit}
                    disabled={!selectedAnswer || submitMutation.isPending}
                    iconLeft={
                      submitMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )
                    }
                  >
                    {submitMutation.isPending ? "Hesaplanıyor" : "Sonuçları Göster"}
                  </SoftButton>
                ) : (
                  <SoftButton
                    variant="primary"
                    tone="ink"
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                    iconRight={<ArrowRight size={13} className="transition-transform duration-500 group-hover:translate-x-1" />}
                  >
                    Sonraki
                  </SoftButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
