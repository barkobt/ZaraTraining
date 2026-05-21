import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import { ProjectCard, type Project } from "@/components/ProjectCard";
import { ZMark } from "@/components/ZMark";
import { CornerVignette } from "@/components/CornerVignette";

/**
 * Atelye Hub — ana sayfa.
 *
 * Yapı (sadeleştirildi):
 *   1. Header: küçük serif italic "Atelye" + sağ üst LIVE pulse
 *   2. Hero: büyük ZMark monogramı + "Atelye, in residence." şiirsel başlık
 *   3. Project cards
 *   4. Footer
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
      {/* Header — sade: serif italic Atelye + LIVE */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-12 py-5 flex justify-between items-center backdrop-blur-sm bg-zara/80 border-b"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="font-instrument italic text-[22px] sm:text-[26px] leading-none tracking-[-0.01em] text-ink pr-3 border-r"
               style={{ borderColor: "var(--zara-line-strong)" }}>
            Atelye
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

      {/* ─────────── HERO — büyük ZMark logo + şiirsel başlık ─────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 pt-24"
      >
        {/* Atelier-tarzı köşe çentikleri */}
        <div className="absolute inset-6 sm:inset-12 pointer-events-none">
          <CornerVignette color="var(--zara-ink)" opacity={0.45} />
        </div>

        {/* Parallax aksesuarı (sıcak tonlu yumuşak ışık) */}
        <motion.div
          aria-hidden
          style={{ y: ornamentY }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] pointer-events-none"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(184, 147, 90, 0.07) 0%, transparent 60%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          {/* Büyük merkezi ZMark — ana ekran logosu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex justify-center mb-10"
          >
            <ZMark size={86} className="text-ink/90" />
          </motion.div>

          {/* Eyebrow ince mono */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <span className="hidden sm:block w-12 h-px" style={{ background: "var(--zara-line-strong)" }} />
            <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-ink/50">
              ZARA · Atelier · MMXXVI
            </span>
            <span className="hidden sm:block w-12 h-px" style={{ background: "var(--zara-line-strong)" }} />
          </motion.div>

          {/* Şiirsel başlık — italic + roman, atelier kalıbı */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1], delay: 0.3 }}
            className="font-instrument text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] xl:text-[6.5vw] leading-[0.92] tracking-[-0.03em] text-ink"
          >
            <span className="italic block">Atelye,</span>
            <span className="block">in residence.</span>
          </motion.h1>

          {/* Atelier-stili sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.55 }}
            className="mt-8 max-w-xl mx-auto text-[15px] sm:text-base leading-[1.6] text-ink/65 font-sans px-4"
          >
            Mağaza içi eğitim ve operasyon araçlarının ev sahibi.<br className="hidden sm:block" />
            Bir koleksiyondaki parçalar gibi düşünülmüş —<br className="hidden sm:block" />
            <em className="font-instrument italic">her biri bağımsız, beraber bir bütün.</em>
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 flex flex-col items-center gap-3"
          >
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40">
              Aşağı
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-ink/40"
            >
              <ArrowDown size={16} strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </motion.div>
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
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">
                BÖLÜM 01
              </div>
              <div className="flex-1 h-px" style={{ background: "var(--zara-line)" }} />
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">
                {PROJECTS.length.toString().padStart(2, "0")} PARÇA
              </div>
            </div>
            <h2 className="font-instrument text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-0.02em] text-ink max-w-3xl">
              Bir <em className="italic font-light">koleksiyon</em>,
              <br />
              {PROJECTS.length} parça.
            </h2>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-ink/60 font-sans leading-relaxed">
              Her kart bir parça. Tıkla, çalışmaya git. Geri dönmek için sol üst köşedeki <em className="font-instrument italic">Atelye</em>.
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

      {/* ─────────── FOOTER — minimal ─────────── */}
      <footer
        className="relative z-10 border-t px-4 sm:px-6 md:px-12 py-8"
        style={{ borderColor: "var(--zara-line)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-instrument italic text-lg leading-none text-ink">Atelye</div>
            <div className="w-px h-4" style={{ background: "var(--zara-line-strong)" }} />
            <div className="text-[10px] tracking-[0.3em] font-mono uppercase text-ink/50">
              © 2026 · ZARA
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
