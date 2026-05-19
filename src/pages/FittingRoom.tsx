import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Smartphone, Sparkles } from "lucide-react";
import { CabinCurtain, CABIN_THEMES, type CabinKey } from "@/components/CabinCurtain";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { SoftButton } from "@/components/SoftButton";

const FASHION_IMAGES = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85&auto=format&sat=-100",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85&auto=format&sat=-100",
];

const MARQUEE_WORDS = [
  "THE FITTING ROOM",
  "·",
  "4 SCENARIOS",
  "·",
  "3 CABINS",
  "·",
  "ZARA · 2026",
  "·",
  "THE ACADEMY",
  "·",
  "AN OLARAK ZARA",
  "·",
];

export default function FittingRoom() {
  const navigate = useNavigate();
  const testUrl = `${window.location.origin}/test`;

  return (
    <div className="min-h-screen bg-zara text-ink relative overflow-hidden">
      {/* Header */}
      <header className="relative z-30 px-4 sm:px-6 md:px-12 py-5 flex justify-between items-center border-b border-zara animate-fade-down">
        <div className="flex items-center gap-3">
          <div className="font-serif font-semibold text-xl sm:text-2xl tracking-[-0.02em] text-ink">ZARA</div>
          <div className="hidden md:block w-px h-5" style={{ background: "var(--zara-line-strong)" }} />
          <div className="hidden md:block text-[10px] tracking-[0.32em] font-sans uppercase text-ink/50">
            The Academy · 2026
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">
            <span className="hidden sm:inline">LIVE SESSION</span>
            <span className="sm:hidden">LIVE</span>
          </span>
        </div>
      </header>

      {/* ───────────── HERO ───────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 pt-10 sm:pt-14 md:pt-16 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Issue marker */}
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12 animate-fade-up">
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">ISSUE 01</div>
            <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">FITTING ROOM TRAINING</div>
          </div>

          {/* Centered headline first (always) */}
          <div className="text-center max-w-5xl mx-auto animate-fade-up delay-100">
            <h1 className="font-serif text-[15vw] sm:text-[12vw] md:text-[9vw] lg:text-[7.5vw] xl:text-[6.5vw] leading-[0.92] tracking-[-0.03em] text-ink">
              Test &amp;{" "}
              <span className="italic font-light">3 Kabin</span>
              <br className="hidden sm:block" />
              {" "}Sürprizi.
            </h1>
            <p className="mt-5 sm:mt-6 max-w-md mx-auto text-sm sm:text-base text-ink/55 font-sans leading-relaxed px-4">
              4 senaryo. Tek bir an. Müşterinin gününü kurtaran ya da kaybettiren karar.
              Doğru kabini bulun.
            </p>
          </div>

          {/* Mobile: stacked CTA + 2-col image grid below.
              Desktop: symmetric 5/2/5 cluster. */}

          {/* CTA + QR — always centered, full width on mobile */}
          <div className="mt-10 sm:mt-14 flex flex-col items-center gap-5 animate-fade-up delay-300 sm:hidden">
            <div className="relative p-2.5 bg-white shadow-sm">
              <QRCodeSVG value={testUrl} size={120} level="M" bgColor="#ffffff" fgColor="#1A1614" className="block" />
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: "var(--zara-ink)" }} />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: "var(--zara-ink)" }} />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: "var(--zara-ink)" }} />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: "var(--zara-ink)" }} />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.25em] uppercase text-ink/50">
              <Smartphone size={10} /> Telefonunuzla başlayın
            </div>
            <SoftButton
              variant="primary"
              tone="ink"
              size="lg"
              onClick={() => navigate("/test")}
              iconRight={<ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />}
            >
              Eğitime Başla
            </SoftButton>
          </div>

          {/* Mobile: 2-col image row below CTA */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:hidden">
            <div className="animate-slide-l delay-200">
              <div className="aspect-[3/4] overflow-hidden bg-zara-alt">
                <img src={FASHION_IMAGES[0]} alt="" className="w-full h-full object-cover grayscale" />
              </div>
              <div className="mt-2 text-[9px] font-mono tracking-[0.2em] uppercase text-ink/40">THE WELCOME</div>
            </div>
            <div className="animate-slide-r delay-200">
              <div className="aspect-[3/4] overflow-hidden bg-zara-alt">
                <img src={FASHION_IMAGES[1]} alt="" className="w-full h-full object-cover grayscale" />
              </div>
              <div className="mt-2 text-[9px] font-mono tracking-[0.2em] uppercase text-ink/40 text-right">THE MOMENT</div>
            </div>
          </div>

          {/* Desktop: symmetric image + CTA cluster (sm and up) */}
          <div className="hidden sm:grid mt-14 md:mt-16 grid-cols-12 gap-4 md:gap-8 items-center max-w-6xl mx-auto">
            <div className="col-span-3 lg:col-span-4 animate-slide-l delay-200">
              <div className="aspect-[3/4] overflow-hidden bg-zara-alt">
                <img src={FASHION_IMAGES[0]} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1200ms]" />
              </div>
              <div className="mt-3 text-[10px] font-mono tracking-[0.25em] uppercase text-ink/40">FIG. 01 — THE WELCOME</div>
            </div>

            <div className="col-span-6 lg:col-span-4 flex flex-col items-center gap-5 animate-fade-up delay-300">
              <div className="relative p-2.5 bg-white shadow-sm">
                <QRCodeSVG value={testUrl} size={110} level="M" bgColor="#ffffff" fgColor="#1A1614" className="block" />
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: "var(--zara-ink)" }} />
                <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: "var(--zara-ink)" }} />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: "var(--zara-ink)" }} />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: "var(--zara-ink)" }} />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.25em] uppercase text-ink/50">
                <Smartphone size={10} /> Telefonunuzla başlayın
              </div>
              <SoftButton
                variant="primary"
                tone="ink"
                size="lg"
                onClick={() => navigate("/test")}
                iconRight={<ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />}
              >
                Eğitime Başla
              </SoftButton>
            </div>

            <div className="col-span-3 lg:col-span-4 animate-slide-r delay-200">
              <div className="aspect-[3/4] overflow-hidden bg-zara-alt">
                <img src={FASHION_IMAGES[1]} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1200ms]" />
              </div>
              <div className="mt-3 text-[10px] font-mono tracking-[0.25em] uppercase text-ink/40 text-right">FIG. 02 — THE MOMENT</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── MARQUEE STRIP ───────────── */}
      <section
        className="relative z-10 border-y overflow-hidden py-5 sm:py-6"
        style={{ borderColor: "var(--zara-line)", background: "var(--zara-bg-alt)" }}
      >
        <div className="marquee">
          {[...Array(3)].map((_, dup) => (
            <div key={dup} className="inline-flex items-center gap-6 sm:gap-10 px-3 sm:px-5">
              {MARQUEE_WORDS.map((w, i) => (
                <span
                  key={`${dup}-${i}`}
                  className={`font-serif text-2xl sm:text-3xl md:text-4xl tracking-[-0.01em] ${
                    w === "·" ? "text-[var(--zara-gold)]" : "text-ink/80 italic"
                  }`}
                >
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-16 sm:py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll variant="fade-up">
            <div className="flex items-end justify-between mb-8 sm:mb-10 pb-4 border-b border-zara gap-4">
              <div>
                <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">CHAPTER ONE</div>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl text-ink tracking-[-0.02em]">
                  Nasıl <span className="italic font-light">Çalışır</span>
                </h2>
              </div>
              <div className="hidden md:block text-[10px] font-mono tracking-[0.3em] uppercase text-ink/30 whitespace-nowrap">
                03 STEPS · 4 QUESTIONS · 3 OUTCOMES
              </div>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--zara-line)" }}>
            {[
              {
                n: "01",
                title: "TARA",
                desc: "QR kodunu tarayarak dijital eğitim platformuna anında erişin.",
                img: FASHION_IMAGES[2],
              },
              {
                n: "02",
                title: "ÖĞREN",
                desc: "4 prova odası senaryosuyla müşteri deneyiminin ardındaki anı keşfedin.",
                img: FASHION_IMAGES[3],
              },
              {
                n: "03",
                title: "TEST ET",
                desc: "Cevaplarınız sizi 3 kabinden birine yönlendirecek. Hangisi sizinki?",
                img: FASHION_IMAGES[0],
              },
            ].map((item, i) => (
              <RevealOnScroll key={i} variant="fade-up" delay={i * 120}>
                <div className="bg-zara group cursor-default p-7 sm:p-8 lg:p-10 transition-colors duration-500 hover:bg-zara-alt h-full">
                  <div className="flex items-baseline justify-between mb-6 sm:mb-8">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--zara-gold)]">
                      / {item.n}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/30">
                      STEP
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink/55 font-sans leading-relaxed max-w-[28ch]">
                    {item.desc}
                  </p>
                  <div className="mt-7 sm:mt-8 aspect-[16/9] overflow-hidden bg-zara-alt">
                    <img
                      src={item.img}
                      alt=""
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms]"
                    />
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 3 CABIN PREVIEW ───────────── */}
      <section
        className="relative z-10 py-16 sm:py-20 md:py-28 overflow-hidden"
        style={{ background: "var(--zara-bg-alt)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll variant="fade-up">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[var(--zara-gold)] mb-3">
                · CHAPTER TWO
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-ink tracking-[-0.03em] leading-[0.95]">
                Üç <span className="italic font-light">Kabin.</span><br />
                Tek <span className="italic font-light">Sonuç.</span>
              </h2>
              <p className="mt-5 max-w-md mx-auto text-sm text-ink/55 font-sans">
                Cevaplarınız sizi bu üç perdeden birine götürecek. Hangisinin arkasında olduğunuzu yalnızca siz açabilirsiniz.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 md:gap-8 max-w-5xl mx-auto items-end">
            {(["baslangic", "gelisim", "altin"] as CabinKey[]).map((k, i) => (
              <RevealOnScroll
                key={k}
                variant={i === 0 ? "slide-l" : i === 2 ? "slide-r" : "fade-up"}
                delay={i * 150}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/40">
                      KABİN
                    </span>
                    <span
                      className="font-serif text-2xl italic"
                      style={{ color: CABIN_THEMES[k].accent }}
                    >
                      {CABIN_THEMES[k].no}
                    </span>
                  </div>
                  <CabinCurtain
                    cabinKey={k}
                    revealed={false}
                    size="sm"
                    showHint={false}
                    showDescription={false}
                  />
                  <div className="text-center mt-2">
                    <div
                      className="text-[10px] font-mono tracking-[0.25em] uppercase"
                      style={{ color: CABIN_THEMES[k].accent }}
                    >
                      {CABIN_THEMES[k].range} PUAN
                    </div>
                    <div className="font-serif text-base text-ink/70 italic mt-1">
                      {CABIN_THEMES[k].title} {CABIN_THEMES[k].titleItalic}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll variant="fade-up" delay={400}>
            <div className="flex justify-center mt-12 sm:mt-14">
              <SoftButton
                variant="outline"
                tone="ink"
                size="lg"
                onClick={() => navigate("/test")}
                iconLeft={<Sparkles size={13} />}
                iconRight={<ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />}
              >
                Hangisini Açacaksınız
              </SoftButton>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ───────────── MANIFESTO ───────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 sm:py-28 md:py-36">
        <div className="max-w-5xl mx-auto text-center">
          <RevealOnScroll variant="parallax">
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40 mb-8">
              · MANIFESTO
            </div>
            <blockquote className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-ink tracking-[-0.02em] leading-[1.1]">
              <span className="italic font-light">"</span>Müşteri sadece bir{" "}
              <span className="italic font-light">kıyafet</span> aramıyor.
              <br />
              Bir <span className="italic font-light">an</span> arıyor.
              <span className="italic font-light">"</span>
            </blockquote>
            <div className="mt-8 sm:mt-12 inline-flex items-center gap-3">
              <div className="w-12 h-px" style={{ background: "var(--zara-gold)" }} />
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/50">
                ZARA · THE ACADEMY
              </span>
              <div className="w-12 h-px" style={{ background: "var(--zara-gold)" }} />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zara">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/40 text-center sm:text-left">
            © 2026 ZARA · DIGITAL TRAINING
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/30 hidden sm:inline">
              v 2.0
            </span>
            <button
              onClick={() => navigate("/admin")}
              className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/30 hover:text-ink transition-colors"
            >
              · Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
