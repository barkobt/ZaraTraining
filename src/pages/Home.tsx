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
// iOS adres çubuğu gizlenirken tetiklenen resize fırtınası scrub trigger'ları
// yeniden hesaplatıp kaydırmayı tutuk hissettirebiliyor — mobil resize yok sayılır.
ScrollTrigger.config({ ignoreMobileResize: true });

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
    accent: "#8B6F47",
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
    // Komedi pusula-iğnesi yerine handoff'tan gerçek mağaza krokisi (Pusula
    // "sahayı tanır" — grayscale, hover'da renge/büyür ProjectCard deseni).
    image: "/pusula-plan.png",
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
  {
    id: "kasa-provasi",
    title: "Kasa Provası",
    subtitle: "Eğitim · 02",
    description:
      "Karma ödemeler, cüzdansız iadeler, kuyruk baskısı. Gerçek kasanın stresi olmadan, senaryolarla kasa refleksi kazan.",
    href: "#",
    accent: "#8B6F47",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: false,
    status: "YAKINDA",
    index: 1,
  },
  {
    id: "saha-dili",
    title: "Saha Dili",
    subtitle: "Eğitim · 03",
    description:
      "Karşılamadan kabin yönetimine, sahanın konuşulmayan kuralları. Usta gözlemlerinden derlenen mikro senaryolar.",
    href: "#",
    accent: "#9B8F80",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: false,
    status: "YAKINDA",
    index: 2,
  },
];

const STEPS = [
  { icon: Upload, t: "Yükle & Tanımla", d: "Kadronu, yetkinlikleri ve Orquest vardiyasını sisteme tanıt." },
  { icon: Cpu, t: "Üret & Optimize Et", d: "CP-SAT solver günlük chart'ı üretir; Brain sonuçtan öğrenir." },
  { icon: Sparkles, t: "Dağıt & Ölç", d: "PDF/Excel çıktısını paylaş, KPI'lar geri akar, döngü kapanır." },
];

const PF_IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=80&auto=format&sat=-100`;
const PUSULA_FEATURES = [
  { n: "01", icon: Sunrise, t: "Günün Kuyruğu", d: "Koç güne tek ekranda başlar: onaylar, keşifler, eşleşmeler — karar her zaman insanda.", img: PF_IMG("1441986300917-64674bd600d8") },
  { n: "02", icon: Activity, t: "Kanıt Motoru", d: "Skor yok, sıralama yok. Her öneri sinyal, kanal, çıkarım ve güven zinciriyle hesap verir.", img: PF_IMG("1454165804606-c3d57bc86b40") },
  { n: "03", icon: BookOpen, t: "Gelişim Defteri", d: "120 konuluk kitapçık dijital hafızada: her tik tarihiyle, her statü kendi notuyla kalıcı.", img: PF_IMG("1450101499163-c8848c66ca85") },
  { n: "04", icon: MessageSquare, t: "Öğrenen Hafıza", d: "Gözlemler temalara, temalar müfredata dönüşür. Eğitim planı sahadan beslenir.", img: PF_IMG("1481627834876-b7833e8f5570") },
  { n: "05", icon: Sprout, t: "Usta Yolu", d: "Usta ayrılsa da yöntemi kurumda kalır — bilgi kurumsal hafızaya kodlanır.", img: PF_IMG("1524758631624-e2822e304c36") },
  { n: "06", icon: TrendingUp, t: "Etki", d: "Soğuk başlar, her kapanan döngüyle keskinleşir: öneri isabeti 62'den 86'ya.", img: PF_IMG("1460925895917-afdab827c52f") },
];

const KICKERS = ["EĞİTİM", "OPERASYON", "ZEKÂ"];

export default function Home() {
  const root = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [kicker, setKicker] = useState(0);

  // Dönen kicker kelimesi (animated text)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setKicker((k) => (k + 1) % KICKERS.length), 2200);
    return () => clearInterval(id);
  }, []);

  // ── HERO VİDEO autoplay garantisi ──
  // KÖK NEDEN (canlıda kanıtlı): React `muted` prop'unu DOM ATTRIBUTE'una
  // yazmıyor (bilinen React bug'ı). Chrome property'ye bakıp oynatıyor;
  // Safari/iOS attribute'a bakıp REDDEDİYOR → büyük play tuşu + "bazen
  // başlamıyor". Çözüm: attribute'u elle yaz + programatik play; reddedilirse
  // ilk dokunuş/kaydırmada sessizce yeniden dene. Video zaten yalnız
  // `playing` olayından sonra görünür kılındığından play tuşu hiç görünmez.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("webkit-playsinline", "");
    const tryPlay = () => {
      v.play().catch(() => {
        /* autoplay reddi — kullanıcı etkileşiminde tekrar denenecek */
      });
    };
    tryPlay();
    const onInteract = () => {
      if (v.paused) tryPlay();
    };
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("scroll", onInteract, { passive: true });
    window.addEventListener("click", onInteract);
    return () => {
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("scroll", onInteract);
      window.removeEventListener("click", onInteract);
    };
  }, []);

  useGSAP(
    () => {
      const ease = "power3.out";
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      // ── HERO İNTRO — set+to deseni: `from` geç yüklemede/StrictMode'da
      // içeriği görünmez bırakabiliyordu ("hero kayıp" hissinin kökü).
      // set+to ile başlangıç hâli net, autoAlpha visibility'yi de yönetir.
      // Atelier filmi: GÖRÜNÜRLÜK yalnız `playing` olayına bağlı — film
      // gerçekten oynamadan element görünmez kalır (iOS'un play tuşu overlay'i
      // dahil hiçbir kare ekrana çıkamaz). Oynayınca yavaşça belirir;
      // kaydırınca hafifçe büyümeye devam eder (sinema derinliği).
      gsap.set(".hero-video", { autoAlpha: 0, scale: 1.08 });
      const heroVideo = root.current?.querySelector<HTMLVideoElement>(".hero-video");
      if (heroVideo) {
        const revealFilm = () => {
          gsap.to(".hero-video", { autoAlpha: 0.42, scale: 1, duration: 2.4, ease: "power2.out" });
        };
        if (!heroVideo.paused && heroVideo.readyState >= 2) revealFilm();
        else heroVideo.addEventListener("playing", revealFilm, { once: true });
      }
      gsap.to(".hero-video", {
        scale: 1.1,
        ease: "none",
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
      });
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
        // Hairline grid'lerde (gap-px + dolu zemin) drift YOK — dikey kayma
        // kartların altındaki çizgi-zeminini gri bant olarak açığa çıkarıyordu.
        if (group.hasAttribute("data-flat")) return;
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

      // ── PUSULA VİTRİNİ — YATAY pinned kart akışı (brandonbartram tarzı) ──
      // Sayaç + progress bar TEK kaynaktan (scroll ilerlemesi) sürülür → eski
      // "üç ayrı mekanizma senkronsuz" bozukluğu biter. gsap.matchMedia ile
      // iki kol: masaüstü-hareketli = pin+yatay track; mobil/azaltılmış = dikey.
      const showcase = root.current?.querySelector<HTMLElement>(".brain-showcase");
      if (showcase) {
        const fill = showcase.querySelector<HTMLElement>(".bf-progress-fill");
        const count = showcase.querySelector<HTMLElement>(".bf-count");
        const N = 6;
        const setReadout = (p: number) => {
          if (count) count.textContent = String(Math.round(p * N)).padStart(2, "0");
          if (fill) fill.style.transform = `scaleX(${p})`;
        };

        const mm = gsap.matchMedia();

        // Masaüstü + hareket serbest: pin'le, dikey scroll'u track'in X'ine bağla.
        mm.add("(min-width: 768px)", () => {
          showcase.classList.remove("bf-fallback");
          const track = showcase.querySelector<HTMLElement>(".bf-track");
          if (!track) return;
          const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
          setReadout(0);
          // ease:"none" ŞART — yoksa scroll ile yatay konum 1:1 hizalanmaz.
          gsap.to(track, {
            x: () => -dist(),
            ease: "none",
            scrollTrigger: {
              trigger: showcase,
              start: "top top",
              end: () => "+=" + dist(),
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => setReadout(self.progress),
            },
          });
          return () => {
            showcase.classList.add("bf-fallback");
            gsap.set(track, { clearProps: "transform" });
          };
        });

        // Mobil / dar ekran: pin yok. Dikey akışta kartlar belirir, sayaç
        // bölüm görünür oldukça scrub ile dolar.
        mm.add("(max-width: 767px)", () => {
          const cards = showcase.querySelectorAll<HTMLElement>(".bf-card");
          gsap.set(cards, { autoAlpha: 0, y: 40 });
          gsap.to(cards, {
            autoAlpha: 1, y: 0, duration: 0.7, ease, stagger: 0.1,
            scrollTrigger: { trigger: showcase, start: "top 78%", once: true },
          });
          setReadout(0);
          const proxy = { p: 0 };
          gsap.to(proxy, {
            p: 1, ease: "none",
            onUpdate: () => setReadout(proxy.p),
            scrollTrigger: { trigger: showcase, start: "top 80%", end: "bottom 65%", scrub: true },
          });
          return () => gsap.set(cards, { clearProps: "all" });
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

      {/* ─────────── HERO — atelier filmi + altın ZT ─────────── */}
      <section className="hero-section relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-12 pt-24">
        {/* Atelier video — en arka katman. Grayscale, paper tonuna yumuşatılmış;
            ZT monogram film noktası üstünde "altın yaprak" gibi durur.
            poster YOK: yüklenene dek krem zemin kalır, flicker olmaz. */}
        <video
          ref={videoRef}
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          className="hero-video absolute inset-0 w-full h-full object-cover pointer-events-none motion-reduce:hidden"
          style={{ filter: "grayscale(0.85) contrast(1.05) brightness(0.95)", zIndex: 0, opacity: 0, visibility: "hidden" }}
        >
          <source src="/hero-atelier.mp4" type="video/mp4" />
        </video>
        {/* Krem kâğıt örtüsü — filmi atelier tonuna bağlar, metin hep okunur */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, var(--zara-bg) 0%, rgba(245,241,234,0.55) 35%, rgba(245,241,234,0.70) 65%, var(--zara-bg) 100%)",
            zIndex: 1,
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, var(--zara-glow) 0%, transparent 60%)", zIndex: 2 }}
        />
        <div className="absolute inset-6 sm:inset-12 pointer-events-none z-[5]">
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
          <h1 className="font-serif text-[15vw] sm:text-[11vw] md:text-[9vw] lg:text-[8vw] leading-[0.92] tracking-[-0.035em] text-ink" style={{ fontWeight: 500 }}>
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

      {/* ─────────── EDİTORYAL MARQUEE — atelier kimlik şeridi ─────────── */}
      <div className="atelye-marquee relative z-10" aria-hidden>
        <div className="atelye-marquee-in">
          {[0, 1].map((rep) => (
            <span key={rep} className="atelye-marquee-seg">
              {["ZARA", "ATELYE", "BORNOVA 3643", "OPERASYON", "İNSAN", "EĞİTİM", "IN RESIDENCE"].map((w) => (
                <span key={w} className="font-mono text-[11px] tracking-[0.34em] uppercase text-ink/45">
                  {w}
                  <i className="not-italic mx-7" style={{ color: "var(--zara-gold)" }}>·</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ─────────── ARAÇLAR ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div data-reveal className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">BÖLÜM 01</div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">OPERASYON</div>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 500 }}>Araçlar.</h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">Günlük operasyonu çeviren üç araç. Tıkla, çalışmaya git.</p>
          </div>
          <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {TOOLS.map((p, i) => (
              <div data-card key={p.id}><ProjectCard project={p} idx={i} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PUSULA · İÇERİDEN (yatay pinned vitrin) ───────────
          Varsayılan DOM dikey 'bf-fallback' (JS yoksa / reduced-motion'da
          güvenli). Masaüstü-hareketli kolda useGSAP fallback sınıfını söküp
          pin + yatay track kurar; sayaç & progress TEK scroll kaynağından
          sürülür (senkronsuzluk = eski 'bozuk' his biter). */}
      <section
        className="brain-showcase bf-fallback relative z-10"
        style={{ background: "var(--zara-ink)", color: "var(--zara-bg)" }}
      >
        <div className="bf-viewport">
          {/* tech katman: blueprint mono-grid + TEK altın hâle standardı */}
          <div aria-hidden className="bf-grid" />
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 80% at 82% 0%, var(--zara-glow-strong), transparent 60%)" }} />

          {/* canlı HUD — pin boyunca okunur readout */}
          <div className="bf-hud">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: "var(--zara-gold-soft)" }}>BÖLÜM 02 · İNSAN</span>
              <span className="hidden sm:inline text-[10px] font-mono tracking-[0.24em]" style={{ color: "rgba(245,241,234,0.32)" }}>// PUSULA.CORE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums tracking-[0.1em]">
                <span className="bf-count" style={{ color: "var(--zara-gold)" }}>06</span>
                <span style={{ color: "rgba(245,241,234,0.4)" }}> / 06</span>
              </span>
              <span className="block h-[2px] w-24 sm:w-36" style={{ background: "rgba(245,241,234,0.14)" }}>
                <span className="bf-progress-fill block h-full" style={{ background: "var(--zara-gold)", transformOrigin: "left center", transform: "scaleX(1)" }} />
              </span>
            </div>
          </div>

          <div className="bf-track">
            {/* intro paneli — marka compass'ı watermark */}
            <div className="bf-panel relative px-6 sm:px-10 md:px-16" style={{ width: "min(92vw, 640px)" }}>
              {/* komedi compass yerine ters-çevrilmiş kroki blueprint'i — koyu
                  zeminde açık mimari çizgiler ("Pusula sahayı tanır"). */}
              <img src="/pusula-plan.png" alt="" aria-hidden className="absolute right-[-90px] top-1/2 -translate-y-1/2 w-[420px] opacity-[0.12] pointer-events-none hidden lg:block" style={{ filter: "invert(1) grayscale(1)" }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4 text-[10px] font-mono tracking-[0.28em] uppercase" style={{ color: "rgba(245,241,234,0.45)" }}>
                  <span>38.45° N · 27.21° E</span>
                  <span style={{ color: "var(--zara-gold-soft)" }}>BORNOVA</span>
                </div>
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em]" style={{ fontWeight: 500 }}>Pusula,<br />içeriden.</h2>
                <p className="mt-5 max-w-md text-sm sm:text-base font-sans leading-relaxed" style={{ color: "rgba(245,241,234,0.72)" }}>
                  İnsan ana sahnedir; performans onun sonucudur. Altı yetenek, tek öğrenen döngüde.
                </p>
                <Link
                  to="/pusula"
                  className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase rounded-[5px]"
                  style={{ background: "var(--zara-gold)", color: "var(--zara-ink)" }}
                >
                  Pusula'yı Keşfet <ArrowRight size={14} strokeWidth={1.8} />
                </Link>
                <div className="mt-10 hidden md:flex items-center gap-3 text-[10px] font-mono tracking-[0.28em] uppercase" style={{ color: "rgba(245,241,234,0.4)" }}>
                  Kaydır <ArrowRight size={13} strokeWidth={1.6} />
                </div>
              </div>
            </div>

            {/* 6 yetenek paneli */}
            {PUSULA_FEATURES.map((f) => (
              <div key={f.n} className="bf-panel px-3 sm:px-4" style={{ width: "min(82vw, 400px)" }}>
                <div
                  className="bf-card relative overflow-hidden h-[min(62vh,460px)] flex flex-col p-7 md:p-8"
                  style={{ background: "rgba(245,241,234,0.04)", border: "1px solid rgba(184,147,90,0.25)" }}
                >
                  {/* temalı grayscale görsel + karartma — metin okunur kalır */}
                  <div aria-hidden className="absolute inset-0 pointer-events-none">
                    <img src={f.img} alt="" loading="lazy" className="w-full h-full object-cover grayscale" style={{ opacity: 0.18 }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,22,20,0.25) 0%, rgba(26,22,20,0.78) 100%)" }} />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.24em]" style={{ color: "var(--zara-gold-soft)" }}>{f.n} / 06</span>
                    <f.icon size={20} strokeWidth={1.5} style={{ color: "var(--zara-gold)" }} />
                  </div>
                  <div className="relative z-10 mt-auto">
                    <h3 className="font-serif text-3xl mb-3" style={{ fontWeight: 500 }}>{f.t}</h3>
                    <p className="text-sm font-sans leading-relaxed" style={{ color: "rgba(245,241,234,0.78)" }}>{f.d}</p>
                  </div>
                  <div className="relative z-10 mt-6 pt-4 flex items-center justify-between text-[10px] font-mono tracking-[0.22em]" style={{ borderTop: "1px solid rgba(184,147,90,0.18)", color: "rgba(245,241,234,0.4)" }}>
                    <span>// SIGNAL</span>
                    <span>0{f.n}·ZT</span>
                  </div>
                </div>
              </div>
            ))}
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
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 500 }}>Atelye Eğitim.</h2>
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
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-[-0.02em] text-ink" style={{ fontWeight: 500 }}>Nasıl çalışır?</h2>
          </div>
          <div data-stagger data-flat className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--zara-line-strong)" }}>
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
        <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[60vw] max-w-[900px] pointer-events-none rounded-full" style={{ background: "radial-gradient(circle, var(--zara-glow) 0%, transparent 65%)" }} />
        <div data-reveal className="relative max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] text-ink" style={{ fontWeight: 500 }}>Hazır olduğunda, başla.</h2>
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
