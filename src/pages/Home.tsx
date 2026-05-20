import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import { ProjectCard, type Project } from "@/components/ProjectCard";
import { ZMark } from "@/components/ZMark";
import { CornerVignette } from "@/components/CornerVignette";
import { LiveClock } from "@/components/LiveClock";

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
          <ZMark size={26} className="text-ink" />
          <div className="font-instrument italic text-[22px] sm:text-[24px] leading-none tracking-[-0.01em] text-ink pr-3 border-r" style={{ borderColor: "var(--zara-line-strong)" }}>
            Atelye
          </div>
          <div className="hidden md:block text-[10px] tracking-[0.32em] font-mono uppercase text-ink/50">
            The Academy · ZARA
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:block"><LiveClock /></div>
          <div className="hidden md:inline-flex items-center gap-1 border px-2 py-1 rounded-md font-mono text-[10px] tracking-[0.08em] text-ink/55"
               style={{ borderColor: "var(--zara-line-strong)" }}
               title="Yakında — komut paleti">
            <span>⌘</span><span>K</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-glow" />
            <span className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/60">LIVE</span>
          </div>
        </div>
      </header>

      {/* ─────────── HERO (tam ekran, sinematik) ─────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 pt-24"
      >
        {/* Atelier-tarzı köşe işaretleri */}
        <div className="absolute inset-6 sm:inset-12 pointer-events-none">
          <CornerVignette color="var(--zara-ink)" opacity={0.5} />
        </div>

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
          {/* Eyebrow — atelier kuralla eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-10"
          >
            <div className="hidden sm:block w-16 h-px" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">
              VOL · 2026 — № 01
            </div>
            <span className="text-ink/30">·</span>
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">
              ATELYE
            </div>
            <div className="hidden sm:block w-16 h-px" style={{ background: "var(--zara-line-strong)" }} />
          </motion.div>

          {/* Headline — Instrument Serif italic + roman */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
            className="font-instrument text-[15vw] sm:text-[11vw] md:text-[9vw] lg:text-[8vw] xl:text-[7vw] leading-[0.9] tracking-[-0.035em] text-ink"
          >
            <span className="italic block">Atelye,</span>
            <span className="block">ZARA Academy.</span>
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

        {/* Hero-meta — 4 sütun monospace (Edition · Bugün · Mağaza · Personel) */}
        <HeroMeta />
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

      {/* ─────────── PAGEMARK — dev italic Z + açıklama ─────────── */}
      <section className="relative z-10 px-4 sm:px-6 md:px-12 pb-12">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
          <ZMark size={120} className="text-ink/85 hidden sm:block" />
          <ZMark size={72} className="text-ink/85 block sm:hidden" />
          <div className="max-w-xs text-right">
            <div className="font-instrument italic text-3xl sm:text-5xl leading-none text-ink/85">
              Maison
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.28em] uppercase text-ink/45 leading-relaxed">
              Bir koleksiyondaki parçalar gibi —<br />
              her biri farklı, hep birlikte ZARA.
            </p>
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
            <ZMark size={18} className="text-ink/80" />
            <div className="font-instrument italic text-lg leading-none text-ink">Atelye</div>
            <div className="w-px h-4" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/50">
              © 2026 · ZARA Academy
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

/** CountUp — atelier-tarzı hero metric animation. */
function CountUp({ to, duration = 1400, format }: { to: number; duration?: number; format?: (v: number) => string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{format ? format(v) : v}</>;
}

/** Atelier-style 4-cell hero meta: Edition · Bugün · Mağaza · Personel. */
function HeroMeta() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const cells = [
    { label: "Edition", val: <><span className="font-instrument italic text-lg leading-none">N°</span> 026 · MMXXVI</> },
    { label: "Bugün", val: dateStr },
    { label: "Aktif mağaza", val: <><CountUp to={1} /> &nbsp;<span style={{ color: "var(--zara-gold)" }}>●</span></> },
    { label: "Personel", val: <CountUp to={30} format={(v) => v.toLocaleString("tr-TR")} /> },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
      className="absolute bottom-12 left-6 right-6 sm:left-12 sm:right-12 grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 border-t"
      style={{ borderColor: "var(--zara-line-strong)" }}
    >
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">{c.label}</span>
          <span className="text-sm sm:text-[15px] text-ink">{c.val}</span>
        </div>
      ))}
    </motion.div>
  );
}
