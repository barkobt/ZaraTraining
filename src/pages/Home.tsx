import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowDown, ArrowRight, Upload, Sparkles, Cpu,
  Sunrise, MessageSquare, Activity, Sprout, TrendingUp, BookOpen,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProjectCard, type Project } from "@/components/ProjectCard";
import { ZMark } from "@/components/ZMark";
import { CornerVignette } from "@/components/CornerVignette";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * ZaraTraining landing — tek sayfa, scroll-triggered (GSAP).
 * Round 2: sade serif (Newsreader, italik YOK), "Atelye" wordmark, çarpıcı
 * animasyonlu hero, Brain özellik pinned scroll anlatımı, düzeltilmiş CTA.
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
    id: "pusula",
    title: "Pusula",
    subtitle: "İnsan · 03",
    description:
      "Yaşayan uzman — kişinin gerçek yetkinlik ve sonucundan profil çıkarır; gelişim planı ve vardiya yerleşimine çevirir. Akşam cebini rahatlatan, insan-onaylı motor.",
    href: "/pusula",
    accent: "#B8935A",
    image:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
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

const PUSULA_FEATURES = [
  { n: "01", icon: Sunrise, t: "Günün Kuyruğu", d: "Koç güne tek ekranda başlar: onaylar, keşifler, eşleşmeler — karar her zaman insanda." },
  { n: "02", icon: Activity, t: "Kanıt Motoru", d: "Skor yok, sıralama yok. Her öneri sinyal, kanal, çıkarım ve güven zinciriyle hesap verir." },
  { n: "03", icon: BookOpen, t: "Gelişim Defteri", d: "120 konuluk kitapçık dijital hafızada: her tik tarihiyle, her statü kendi notuyla kalıcı." },
  { n: "04", icon: MessageSquare, t: "Öğrenen Hafıza", d: "Gözlemler temalara, temalar müfredata dönüşür. Eğitim planı sahadan beslenir." },
  { n: "05", icon: Sprout, t: "Usta Yolu", d: "Usta ayrılsa da yöntemi kurumda kalır — bilgi kurumsal hafızaya kodlanır." },
  { n: "06", icon: TrendingUp, t: "Etki", d: "Soğuk başlar, her kapanan döngüyle keskinleşir: öneri isabeti 62'den 86'ya." },
];

const KICKERS = ["EĞİTİM", "OPERASYON", "ZEKÂ"];

export default function Home() {
  const root = useRef<HTMLDivElement | null>(null);
  const [kicker, setKicker] = useState(0);

  // Dönen kicker kelimesi (animated text)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setKicker((k) => (k + 1) % KICKERS.length), 2200);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      const ease = "power3.out";
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      // ── HERO İNTRO — set+to deseni: `from` geç yüklemede/StrictMode'da
      // içeriği görünmez bırakabiliyordu ("hero kayıp" hissinin kökü).
      // set+to ile başlangıç hâli net, autoAlpha visibility'yi de yönetir.
      gsap.set(".hero-logo", { autoAlpha: 0, y: 26, scale: 0.92, filter: "blur(10px)" });
      gsap.set(".hero-eyebrow, .hero-sub, .hero-cue", { autoAlpha: 0, y: 14 });
      gsap.set(".hero-word", { yPercent: 115 });
      gsap.set(".hero-rule", { scaleX: 0, transformOrigin: "center" });
      gsap
        .timeline({ defaults: { ease } })
        .to(".hero-logo", { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.2 })
        .to(".hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.7")
        .to(".hero-word", { yPercent: 0, duration: 1.0, stagger: 0.12, ease: "power4.out" }, "-=0.45")
        .to(".hero-rule", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, "-=0.5")
        .to(".hero-sub", { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.55")
        .to(".hero-cue", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.4");
      // Monogram nazik salınımda yaşar (atelier vitrini hissi)
      gsap.to(".hero-logo", { y: -8, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.6 });

      // Hero scroll-out — pin YOK (eski pin bug'ına dönüş yok), saf scrub:
      // kaydırdıkça sahne yukarı süzülüp soluklaşır, dönünce geri gelir.
      gsap.to(".hero-inner", {
        yPercent: -14,
        autoAlpha: 0.12,
        scale: 0.97,
        ease: "none",
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom 30%", scrub: true },
      });

      // ── BÖLÜM REVEAL'LERİ — once:true: hızlı scroll'da tetik kaçsa bile
      // içerik asla görünmez kalmaz (alt bölümlerin "boş gri blok" kalması bitti).
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 40 });
        gsap.to(el, {
          autoAlpha: 1, y: 0, duration: 0.9, ease,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>("[data-card]");
        gsap.set(cards, { autoAlpha: 0, yPercent: 9 });
        gsap.to(cards, {
          autoAlpha: 1, yPercent: 0, duration: 0.9, ease, stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 82%", once: true },
        });
        // Derinlik: kartlar scroll'la hafif farklı hızda süzülür.
        // (reveal yPercent'i, parallax y pikselini sürer — çakışmazlar)
        cards.forEach((card, i) => {
          const drift = ((i % 3) - 1) * 18;
          if (drift === 0) return;
          gsap.fromTo(card, { y: drift }, {
            y: -drift, ease: "none",
            scrollTrigger: { trigger: group, start: "top bottom", end: "bottom top", scrub: 1.2 },
          });
        });
      });

      // Adım kartlarının iç çizgileri görününce çizilir
      gsap.utils.toArray<HTMLElement>(".step-rule").forEach((el) => {
        gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(el, {
          scaleX: 1, duration: 0.9, ease: "power2.inOut",
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        });
      });

      // ── PUSULA VİTRİNİ — kart reveal + arka plan süzülmesi + sayaç ──
      const showcase = root.current?.querySelector<HTMLElement>(".brain-showcase");
      if (showcase) {
        const cards = showcase.querySelectorAll<HTMLElement>(".bf-card");
        gsap.set(cards, { autoAlpha: 0, yPercent: 16, scale: 0.96 });
        gsap.to(cards, {
          autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.8, ease, stagger: 0.14,
          scrollTrigger: { trigger: showcase, start: "top 72%", once: true },
        });
        const bg = showcase.querySelector<HTMLElement>(".bf-bg");
        if (bg) {
          gsap.fromTo(bg, { xPercent: -6 }, {
            xPercent: 6, ease: "none",
            scrollTrigger: { trigger: showcase, start: "top bottom", end: "bottom top", scrub: 1.5 },
          });
        }
        // Sayaç MONOTONİK: ileri sayar, scroll geri gelince GERİLEMEZ
        // ("1/6'da takılı / geri sayıyor" kırığı bitti). Dolum çizgisi de aynı.
        const fill = showcase.querySelector<HTMLElement>(".bf-progress-fill");
        const count = showcase.querySelector<HTMLElement>(".bf-count");
        let maxP = 0;
        ScrollTrigger.create({
          trigger: showcase,
          start: "top 75%",
          end: "bottom 70%",
          scrub: true,
          onUpdate: (self) => {
            maxP = Math.max(maxP, self.progress);
            if (fill) fill.style.transform = `scaleX(${maxP})`;
            if (count) count.textContent = String(Math.round(maxP * 6)).padStart(2, "0");
          },
        });
      }

      // CTA yaklaşırken yumuşakça odağa gelir
      const cta = root.current?.querySelector<HTMLElement>(".cta-section");
      if (cta) {
        gsap.fromTo(cta, { scale: 0.985, autoAlpha: 0.65 }, {
          scale: 1, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: cta, start: "top 92%", end: "top 48%", scrub: true },
        });
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} className="min-h-screen bg-zara text-ink overflow-x-hidden">
      {/* Header — "Atelye" wordmark (italik DEĞİL) */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-12 py-5 flex justify-between items-center backdrop-blur-sm bg-zara/80 border-b"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div
            className="font-serif text-[22px] sm:text-[26px] leading-none tracking-[-0.01em] text-ink pr-3 border-r"
            style={{ borderColor: "var(--zara-line-strong)", fontWeight: 500 }}
          >
            Atelye
          </div>
          <div className="hidden md:block text-[10px] tracking-[0.34em] font-mono uppercase text-ink/55">
            The Atelier
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">LIVE</span>
        </div>
      </header>

      {/* ─────────── HERO ─────────── */}
      <section className="hero-section relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-12 pt-24">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,147,90,0.10) 0%, transparent 60%)" }}
        />
        <div className="absolute inset-6 sm:inset-12 pointer-events-none">
          <CornerVignette color="var(--zara-ink)" opacity={0.45} />
        </div>

        <div className="hero-inner relative z-10 max-w-5xl mx-auto text-center">
          <div className="hero-logo flex flex-col items-center mb-7 gap-3">
            <ZMark size={150} variant="gold" className="select-none" style={{ filter: "drop-shadow(0 18px 30px rgba(184,147,90,0.18))" }} />
            <div className="hero-wordmark flex items-center gap-3">
              <span className="w-6 h-px" style={{ background: "var(--zara-line-strong)" }} />
              <span className="font-mono tracking-[0.42em] uppercase text-[11px] sm:text-[12px] text-ink/70">ZARA Training</span>
              <span className="w-6 h-px" style={{ background: "var(--zara-line-strong)" }} />
            </div>
          </div>

          {/* dönen kicker + sabit etiket (animated text) */}
          <div className="hero-eyebrow flex items-center justify-center gap-3 mb-7">
            <span className="hidden sm:block w-10 h-px" style={{ background: "var(--zara-line-strong)" }} />
            <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-ink/45">ZARA · ATELIER ·</span>
            <span className="relative inline-block min-w-[90px] text-left">
              {KICKERS.map((w, i) => (
                <span
                  key={w}
                  className="text-[10px] font-mono tracking-[0.32em] uppercase"
                  style={{
                    color: "var(--zara-gold)",
                    position: i === kicker ? "relative" : "absolute",
                    left: 0,
                    opacity: i === kicker ? 1 : 0,
                    transform: i === kicker ? "translateY(0)" : "translateY(6px)",
                    transition: "opacity 500ms var(--ease-atelier), transform 500ms var(--ease-atelier)",
                  }}
                >
                  {w}
                </span>
              ))}
            </span>
            <span className="hidden sm:block w-10 h-px" style={{ background: "var(--zara-line-strong)" }} />
          </div>

          {/* Başlık — İTALİK YOK, sade serif, kelime-maske reveal */}
          <h1 className="font-serif text-[15vw] sm:text-[11vw] md:text-[9vw] lg:text-[8vw] leading-[0.92] tracking-[-0.035em] text-ink" style={{ fontWeight: 600 }}>
            <span className="block overflow-hidden">
              <span className="hero-word inline-block">Atelye,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-word inline-block">in&nbsp;</span>
              <span className="hero-word inline-block">residence.</span>
            </span>
          </h1>

          <div className="hero-rule mx-auto mt-6 h-px w-40" style={{ background: "linear-gradient(90deg, transparent, var(--zara-gold), transparent)" }} />

          <p className="hero-sub mt-7 max-w-xl mx-auto text-[15px] sm:text-base leading-[1.6] text-ink/65 font-sans px-4">
            Mağaza içi eğitim ve operasyon araçlarının ev sahibi. Bir koleksiyondaki parçalar gibi düşünülmüş — her biri bağımsız, beraber bir bütün.
          </p>

          <div className="hero-cue mt-12 flex flex-col items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">Aşağı</span>
            <ArrowDown size={16} strokeWidth={1.5} className="text-ink/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─────────── ARAÇLAR ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 01</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">OPERASYON</div>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 600 }}>Araçlar.</h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">Günlük operasyonu çeviren üç araç. Tıkla, çalışmaya git.</p>
          </div>
          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {TOOLS.map((p, i) => (
              <div data-card key={p.id}><ProjectCard project={p} idx={i} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PUSULA · İÇERİDEN ─────────── */}
      <section className="brain-showcase relative z-10 overflow-hidden" style={{ background: "var(--zara-ink)", color: "var(--zara-bg)" }}>
        <div aria-hidden className="bf-bg absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 80% at 80% 0%, rgba(184,147,90,0.18), transparent 60%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 md:py-24">
          <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
            <div>
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: "var(--zara-gold-soft)" }}>BÖLÜM 02 · İNSAN</div>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] mt-3" style={{ fontWeight: 600 }}>Pusula, içeriden.</h2>
              <p className="mt-4 max-w-lg text-sm sm:text-base font-sans leading-relaxed" style={{ color: "rgba(245,241,234,0.72)" }}>
                İnsan ana sahnedir; performans onun sonucudur. Altı yetenek, tek öğrenen döngüde.
              </p>
            </div>
            <div className="text-right">
              <div className="font-serif leading-none" style={{ fontSize: 56, fontWeight: 600 }}>
                <span className="bf-count">00</span><span style={{ color: "var(--zara-gold-soft)" }}>/06</span>
              </div>
              <div className="mt-3 h-[3px] w-40 ml-auto" style={{ background: "rgba(245,241,234,0.15)" }}>
                <div className="bf-progress-fill h-full" style={{ background: "var(--zara-gold)", transformOrigin: "left center", transform: "scaleX(0)" }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PUSULA_FEATURES.map((f) => (
              <div
                key={f.n}
                className="bf-card relative p-6 md:p-7"
                style={{ background: "rgba(245,241,234,0.04)", border: "1px solid rgba(184,147,90,0.25)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[11px] tracking-[0.24em]" style={{ color: "var(--zara-gold-soft)" }}>{f.n}</span>
                  <f.icon size={18} strokeWidth={1.5} style={{ color: "var(--zara-gold)" }} />
                </div>
                <h3 className="font-serif text-2xl mb-2" style={{ fontWeight: 500 }}>{f.t}</h3>
                <p className="text-sm font-sans leading-relaxed" style={{ color: "rgba(245,241,234,0.7)" }}>{f.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/pusula"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px]"
              style={{ background: "var(--zara-gold)", color: "var(--zara-ink)" }}
            >
              Pusula'yı Keşfet <ArrowRight size={14} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── ATELYE EĞİTİM ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28 border-y" style={{ background: "var(--zara-bg-alt)", borderColor: "var(--zara-line-strong)" }}>
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 03</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">EĞİTİM</div>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 600 }}>Atelye Eğitim.</h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">Sahaya çıkmadan önce — senaryolarla öğren, kabinini bul.</p>
          </div>
          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {EDUCATION.map((p, i) => (
              <div data-card key={p.id}><ProjectCard project={p} idx={i} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── NASIL ÇALIŞIR ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 04</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">AKIŞ</div>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 600 }}>Nasıl çalışır?</h2>
          </div>
          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--zara-line-strong)" }}>
            {STEPS.map((s, i) => (
              <div data-card key={s.t} className="bg-zara p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[11px] tracking-[0.28em] text-ink/45">0{i + 1}</span>
                  <span className="step-rule flex-1 h-px" style={{ background: "var(--zara-line)" }} />
                  <s.icon size={18} strokeWidth={1.5} style={{ color: "var(--zara-gold)" }} />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-3" style={{ fontWeight: 500 }}>{s.t}</h3>
                <p className="text-sm text-ink/60 font-sans leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="cta-section relative z-10 px-4 sm:px-6 md:px-12 py-24 md:py-32 text-center overflow-hidden">
        <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[60vw] max-w-[900px] pointer-events-none rounded-full" style={{ background: "radial-gradient(circle, rgba(184,147,90,0.12) 0%, transparent 65%)" }} />
        <div data-reveal className="relative max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] text-ink" style={{ fontWeight: 600 }}>Hazır olduğunda, başla.</h2>
          <p className="mt-5 text-sm sm:text-base text-ink/60 font-sans">Operasyonun ev sahibi seni bekliyor.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/shift-organizer"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px] hover:opacity-90 transition-opacity"
              style={{ background: "var(--zara-ink)", color: "var(--zara-bg)" }}
            >
              Hemen Başla <ArrowRight size={14} strokeWidth={1.8} />
            </Link>
            <Link
              to="/pusula"
              className="inline-flex items-center gap-2 px-7 py-3.5 border font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px] text-ink hover:bg-ink transition-colors"
              style={{ borderColor: "var(--zara-line-strong)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--zara-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--zara-ink)")}
            >
              Pusula'yı Keşfet <Sparkles size={14} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="relative z-10 border-t px-4 sm:px-6 md:px-12 py-8" style={{ borderColor: "var(--zara-line)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-serif text-lg leading-none text-ink" style={{ fontWeight: 500 }}>Atelye</div>
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
