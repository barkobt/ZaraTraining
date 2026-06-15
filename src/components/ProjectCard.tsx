import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowUpRight, Lock } from "lucide-react";
import type { ReactNode } from "react";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accent: string;   // ana renk (CSS color)
  image?: string;   // opsiyonel background image url
  visual?: ReactNode; // opsiyonel custom görsel (img yerine — örn. Pusula compass)
  available: boolean;
  status: string;   // örn "AÇIK", "YAKINDA"
  index: number;    // "FIG. 01" gibi
}

export function ProjectCard({ project, idx }: { project: Project; idx: number }) {
  const cardInner = (
    <motion.div
      whileHover={project.available ? { y: -8 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="group relative overflow-hidden border border-zara bg-zara-alt"
      style={{ minHeight: 460 }}
    >
      {/* Custom görsel (compass gibi) — diğer kartların gri-stiliyle aynı:
          tam ortalı, grayscale, hover'da renge + hafif büyür. */}
      {project.visual && (
        <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none grayscale transition-all duration-[1500ms] ${
            project.available ? "group-hover:grayscale-0 group-hover:scale-105" : ""
          }`}
          style={{ opacity: project.available ? 0.6 : 0.25 }}
        >
          {project.visual}
        </div>
      )}

      {/* Background image with parallax-ish overlay */}
      {!project.visual && project.image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          whileHover={project.available ? { scale: 1.12 } : {}}
          transition={{ duration: 1.8, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <img
            src={project.image}
            alt=""
            className={`w-full h-full object-cover grayscale ${
              project.available ? "group-hover:grayscale-0 transition-all duration-[1500ms]" : ""
            }`}
            style={{ opacity: project.available ? 0.55 : 0.25 }}
          />
        </motion.div>
      )}

      {/* Accent gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, transparent 40%, ${project.accent}22 100%)`,
        }}
      />

      {/* Index label */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-auto">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/45">
            FIG. {String(idx + 1).padStart(2, "0")} — {project.status}
          </span>
          {project.available ? (
            <motion.div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: project.accent, color: "white" }}
              whileHover={{ scale: 1.1, rotate: 45 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ArrowUpRight size={16} strokeWidth={1.5} />
            </motion.div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-ink/10 text-ink/30 flex items-center justify-center">
              <Lock size={14} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-[140px]" />

        {/* Title block */}
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-ink/50 mb-3">
            {project.subtitle}
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[0.95] tracking-[-0.02em] text-ink mb-4">
            <span className="italic font-light">{project.title.split(" ")[0]}</span>{" "}
            {project.title.split(" ").slice(1).join(" ")}
          </h3>
          <p className="text-sm text-ink/60 leading-relaxed max-w-md">
            {project.description}
          </p>
        </div>

        {/* Hover indicator */}
        {project.available && (
          <div className="mt-6 flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-ink/40 group-hover:text-ink transition-colors duration-500">
            <span>Aç</span>
            <div className="flex-1 h-px bg-ink/20 group-hover:bg-ink transition-colors duration-500" />
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!project.available) {
    return <div aria-disabled className="cursor-not-allowed opacity-90">{cardInner}</div>;
  }

  return (
    <Link to={project.href} aria-label={project.title}>
      {cardInner}
    </Link>
  );
}
