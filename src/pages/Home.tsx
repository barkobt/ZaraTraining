import { useRef } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowRight, Upload, Sparkles, Cpu } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProjectCard, type Project } from "@/components/ProjectCard";
import { ZMark } from "@/components/ZMark";
import { CornerVignette } from "@/components/CornerVignette";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * ZaraTraining landing — tek sayfa, scroll-triggered (GSAP).
 *
 * Brief (2026-06): italik YOK; hero korunur ama elegant bold serif; eski
 * Eğitim/Operasyon/Yakında tabları kaldırıldı. İşlevsel araçlar (Shift
 * Organizer · Buenas Dias · Zara Brain) üstte; Eğitim (Fitting Room) ayrı
 * section'da; Nasıl Çalışır 3 adım; CTA. Palet korunur (krem/altın/ink).
 */

const TOOLS: Project[] = [
  {
    id: "shift-organizer",
    title: "Shift Organizer",
    subtitle: "Operasyon · 01",
    description:
      "Yetkinlik tablonu yönet, Orquest vardiyasını yükle, CP-SAT solver ile günlük chart üret. 2 PDF + 1 Excel çıktısı, mola ve aksiyon yönetimi.",
    href: "/shift-organizer",
    accent: "#1A1614",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "AÇIK",
    index: 0,
  },
  {
    id: "buenas-dias",
    title: "Buenas Dias",
    subtitle: "Operasyon · 02",
    description:
      "Sabah toplantısı için otomatik hedef üretici. Motor A günlük hedefi, Motor B challenge dağıtımını hesaplar; tek tıkla PDF olarak dışa aktarılır.",
    href: "/buenas-dias",
    accent: "#7E6B5B",
    image:
      "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "AÇIK",
    index: 1,
  },
  {
    id: "brain",
    title: "Zara Brain",
    subtitle: "Yapay Zekâ · 03",
    description:
      "Mağazanın kendi sonuçlarından öğrenen zekâ katmanı — sabah brifingi, performans ikizi, kapalı döngü. Tahmin et, optimize et, öğren.",
    href: "/brain",
    accent: "#B8935A",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "YENİ",
    index: 2,
  },
];

const EDUCATION: Project[] = [
  {
    id: "fitting-room",
    title: "Fitting Room",
    subtitle: "Eğitim · 01",
    description:
      "4 senaryo. 3 kabin. Müşterinin gününü kuran ya da kaybettiren karar — doğru kabini seç. Teatral perde açılışıyla grup sonuç modu.",
    href: "/fitting-room",
    accent: "#B8935A",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "AÇIK",
    index: 0,
  },
];

const STEPS = [
  { icon: Upload, t: "Yükle & Tanımla", d: "Kadronu, yetkinlikleri ve Orquest vardiyasını sisteme tanıt." },
  { icon: Cpu, t: "Üret & Optimize Et", d: "CP-SAT solver günlük chart'ı üretir; Brain sonuçtan öğrenir." },
  { icon: Sparkles, t: "Dağıt & Ölç", d: "PDF/Excel çıktısını paylaş, KPI'lar geri akar, döngü kapanır." },
];

export default function Home() {
  const root = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const ease = "power3.out";
      // prefers-reduced-motion → animasyon yok
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      // Hero intro — logo fade-in, wordmark, başlık slide-up
      gsap.from(".hero-logo", { opacity: 0, scale: 0.85, filter: "blur(8px)", duration: 1.3, ease });
      gsap.from(".hero-wordmark", { opacity: 0, y: 8, duration: 0.9, delay: 0.5, ease });
      gsap.from(".hero-eyebrow", { opacity: 0, y: 12, duration: 0.8, delay: 0.25, ease });
      gsap.from(".hero-title", { opacity: 0, y: 32, duration: 1.1, delay: 0.35, ease });
      gsap.from(".hero-sub", { opacity: 0, y: 18, duration: 0.9, delay: 0.6, ease });
      gsap.from(".hero-cue", { opacity: 0, duration: 1, delay: 1 });

      // Scroll-triggered: her section başlığı + kartları staggered
      const sections = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      sections.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.querySelectorAll("[data-card]"), {
          opacity: 0,
          y: 60,
          duration: 0.9,
          ease,
          stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 80%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="min-h-screen bg-zara text-ink overflow-x-hidden">
      {/* Header — non-italic elegant serif */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-12 py-5 flex justify-between items-center backdrop-blur-sm bg-zara/80 border-b"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div
            className="font-serif font-semibold text-[20px] sm:text-[24px] leading-none tracking-[-0.01em] text-ink pr-3 border-r"
            style={{ borderColor: "var(--zara-line-strong)" }}
          >
            ZARA Training
          </div>
          <div className="hidden md:block text-[10px] tracking-[0.32em] font-mono uppercase text-ink/55">
            The Atelier
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">LIVE</span>
        </div>
      </header>

      {/* ─────────── HERO ─────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-12 pt-24">
        {/* warm radial glow */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,147,90,0.10) 0%, transparent 60%)" }}
        />
        <div className="absolute inset-6 sm:inset-12 pointer-events-none">
          <CornerVignette color="var(--zara-ink)" opacity={0.45} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="hero-logo flex flex-col items-center mb-8 gap-3">
            <ZMark size={170} variant="gold" className="select-none" style={{ filter: "drop-shadow(0 18px 30px rgba(184,147,90,0.18))" }} />
            <div className="hero-wordmark flex items-center gap-3">
              <span className="w-6 h-px" style={{ background: "var(--zara-line-strong)" }} />
              <span className="font-mono tracking-[0.42em] uppercase text-[11px] sm:text-[12px] text-ink/70">ZARA Training</span>
              <span className="w-6 h-px" style={{ background: "var(--zara-line-strong)" }} />
            </div>
          </div>

          <div className="hero-eyebrow flex items-center justify-center gap-3 mb-8">
            <span className="hidden sm:block w-12 h-px" style={{ background: "var(--zara-line-strong)" }} />
            <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-ink/50">ZARA · Atelier · MMXXVI</span>
            <span className="hidden sm:block w-12 h-px" style={{ background: "var(--zara-line-strong)" }} />
          </div>

          {/* Başlık — İTALİK YOK, elegant bold serif */}
          <h1 className="hero-title font-serif font-semibold text-[13vw] sm:text-[9vw] md:text-[7.5vw] lg:text-[6.5vw] leading-[0.95] tracking-[-0.03em] text-ink">
            Atelye, in residence.
          </h1>

          <p className="hero-sub mt-8 max-w-xl mx-auto text-[15px] sm:text-base leading-[1.6] text-ink/65 font-sans px-4">
            Mağaza içi eğitim ve operasyon araçlarının ev sahibi. Bir koleksiyondaki parçalar gibi düşünülmüş — her biri bağımsız, beraber bir bütün.
          </p>

          <div className="hero-cue mt-14 flex flex-col items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">Aşağı</span>
            <ArrowDown size={16} strokeWidth={1.5} className="text-ink/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─────────── ARAÇLAR (işlevsel — aktif) ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 01</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">OPERASYON</div>
            </div>
            <h2 className="font-serif font-semibold text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink">
              Araçlar.
            </h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">
              Günlük operasyonu çeviren üç araç. Tıkla, çalışmaya git.
            </p>
          </div>

          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {TOOLS.map((p, i) => (
              <div data-card key={p.id}>
                <ProjectCard project={p} idx={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── ATELYE EĞİTİM (ayrı section) ─────────── */}
      <section
        className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28 border-y"
        style={{ background: "var(--zara-bg-alt)", borderColor: "var(--zara-line-strong)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 02</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">EĞİTİM</div>
            </div>
            <h2 className="font-serif font-semibold text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink">
              Atelye Eğitim.
            </h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">
              Sahaya çıkmadan önce — senaryolarla öğren, kabinini bul.
            </p>
          </div>

          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {EDUCATION.map((p, i) => (
              <div data-card key={p.id}>
                <ProjectCard project={p} idx={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── NASIL ÇALIŞIR ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 03</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">AKIŞ</div>
            </div>
            <h2 className="font-serif font-semibold text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink">
              Nasıl çalışır?
            </h2>
          </div>

          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--zara-line-strong)" }}>
            {STEPS.map((s, i) => (
              <div data-card key={s.t} className="bg-zara p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[11px] tracking-[0.28em] text-ink/45">0{i + 1}</span>
                  <span className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
                  <s.icon size={18} strokeWidth={1.5} style={{ color: "var(--zara-gold)" }} />
                </div>
                <h3 className="font-serif font-medium text-2xl text-ink mb-3">{s.t}</h3>
                <p className="text-sm text-ink/60 font-sans leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-24 md:py-32 text-center overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[60vw] max-w-[900px] pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,147,90,0.12) 0%, transparent 65%)" }}
        />
        <div data-reveal className="relative max-w-2xl mx-auto">
          <h2 className="font-serif font-semibold text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] text-ink">
            Hazır olduğunda, başla.
          </h2>
          <p className="mt-5 text-sm sm:text-base text-ink/60 font-sans">Operasyonun ev sahibi seni bekliyor.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/shift-organizer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-zara font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px] hover:opacity-90 transition-opacity"
            >
              Hemen Başla <ArrowRight size={14} strokeWidth={1.8} />
            </Link>
            <Link
              to="/brain"
              className="inline-flex items-center gap-2 px-7 py-3.5 border font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px] text-ink hover:bg-ink hover:text-zara transition-colors"
              style={{ borderColor: "var(--zara-line-strong)" }}
            >
              Zara Brain'i Keşfet <Sparkles size={14} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="relative z-10 border-t px-4 sm:px-6 md:px-12 py-8" style={{ borderColor: "var(--zara-line)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-serif font-semibold text-lg leading-none text-ink">ZARA Training</div>
            <div className="w-px h-4" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/50">© 2026 · ZARA</div>
          </div>
          <div className="flex items-center gap-4 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40">
            <Link to="/admin" className="hover:text-ink transition-colors">Admin</Link>
            <span>·</span>
            <Link to="/show" className="hover:text-ink transition-colors">Show</Link>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline tracking-[0.3em]">İstanbul · MMXXVI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
