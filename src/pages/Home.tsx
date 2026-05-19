import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import { ProjectCard, type Project } from "@/components/ProjectCard";

/**
 * Atelye Hub — ZARA · The Academy ana sayfa.
 *
 * Yapı:
 *   1. Tam ekran sinematik intro (parallax scroll, serif başlık)
 *   2. Proje kartları (Fitting Room + Shift Organizer + placeholder)
 *   3. Footer
 *
 * Gelecekteki projeler PROJECTS array'ine eklenir — kart otomatik gelir.
 */

const PROJECTS: Project[] = [
  {
    id: "fitting-room",
    title: "Fitting Room",
    subtitle: "Issue 01 · Eğitim",
    description:
      "4 senaryo. 3 kabin. Müşterinin gününü kuran ya da kaybettiren karar — doğru kabini seç.",
    href: "/fitting-room",
    accent: "#B8935A",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "AÇIK",
    index: 0,
  },
  {
    id: "shift-organizer",
    title: "Shift Organizer",
    subtitle: "Issue 02 · Operasyon",
    description:
      "Yetkinlik tablonu yönet, Orquest vardiyasını yükle, CP-SAT solver ile günlük chart üret.",
    href: "/shift-organizer",
    accent: "#1A1614",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&h=1200&fit=crop&q=85&auto=format&sat=-100",
    available: true,
    status: "AÇIK",
    index: 1,
  },
  {
    id: "next",
    title: "Yakında",
    subtitle: "Issue 03 · ?",
    description:
      "Yeni bir fikir mi var? Atelye'ye eklensin — bu kart için hazır boşluk.",
    href: "#",
    accent: "#9CA3AF",
    available: false,
    status: "YAKINDA",
    index: 2,
  },
];

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const ornamentY = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="min-h-screen bg-zara text-ink overflow-x-hidden">
      {/* Header — sabit, minimalist */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-12 py-5 flex justify-between items-center backdrop-blur-sm bg-zara/80 border-b"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="font-serif font-semibold text-xl sm:text-2xl tracking-[-0.02em] text-ink">
            ZARA
          </div>
          <div className="hidden md:block w-px h-5" style={{ background: "var(--zara-line-strong)" }} />
          <div className="hidden md:block text-[10px] tracking-[0.32em] font-sans uppercase text-ink/50">
            The Academy · Atelye
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
          <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">LIVE</span>
        </div>
      </header>

      {/* ─────────── HERO (tam ekran, sinematik) ─────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 pt-24"
      >
        {/* Parallax ornament */}
        <motion.div
          aria-hidden
          style={{ y: ornamentY }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] pointer-events-none"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(184, 147, 90, 0.06) 0%, transparent 60%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-10"
          >
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
              VOL · 2026
            </div>
            <div className="w-12 h-px" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
              ATELYE
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
            className="font-serif text-[14vw] sm:text-[11vw] md:text-[8.5vw] lg:text-[7.5vw] xl:text-[6.5vw] leading-[0.92] tracking-[-0.035em] text-ink"
          >
            <span className="italic font-light">Atelye</span>
            <br />
            ZARA Academy.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="mt-7 max-w-lg mx-auto text-sm sm:text-base text-ink/55 font-sans leading-relaxed px-4"
          >
            Mağaza içi eğitim ve operasyon araçlarının atelyesi.
            Bir koleksiyondaki parçalar gibi: her biri farklı, hep birlikte ZARA.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
              Aşağı
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-ink/40"
            >
              <ArrowDown size={16} strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Ornamental edge marks */}
        <span className="absolute top-24 left-4 sm:left-12 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: "var(--zara-line-strong)" }} aria-hidden />
        <span className="absolute top-24 right-4 sm:right-12 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: "var(--zara-line-strong)" }} aria-hidden />
        <span className="absolute bottom-8 left-4 sm:left-12 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: "var(--zara-line-strong)" }} aria-hidden />
        <span className="absolute bottom-8 right-4 sm:right-12 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: "var(--zara-line-strong)" }} aria-hidden />
      </section>

      {/* ─────────── PROJECTS ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
                BÖLÜM 01
              </div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
                {PROJECTS.length.toString().padStart(2, "0")} PARÇA
              </div>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-0.02em] text-ink max-w-3xl">
              Bir <span className="italic font-light">koleksiyon</span>,
              <br />
              {PROJECTS.length} parça.
            </h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/55 font-sans leading-relaxed">
              Her kart bir parça. Tıkla, çalışmaya git. Geri dönmek için sol üst köşedeki ZARA.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {PROJECTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 0.61, 0.36, 1],
                  delay: i * 0.15,
                }}
              >
                <ProjectCard project={p} idx={i} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer
        className="relative z-10 border-t px-4 sm:px-6 md:px-12 py-10"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-serif text-lg tracking-[-0.02em] text-ink">ZARA</div>
            <div className="w-px h-4" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/50">
              © 2026 · Atelye
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] tracking-[0.25em] font-mono uppercase text-ink/40">
            <Link to="/admin" className="hover:text-ink transition-colors">Admin</Link>
            <span>·</span>
            <Link to="/show" className="hover:text-ink transition-colors">Show</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
