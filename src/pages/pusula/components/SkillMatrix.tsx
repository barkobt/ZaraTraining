import { SkillStatus, type Skill } from "../types";

/** Beceri durumu → renk tonu (nitel, rakam yok). Teorik → Öğretebilir. */
const STATUS: Record<SkillStatus, { bg: string; fg: string }> = {
  [SkillStatus.Theory]: { bg: "var(--zara-bg-alt)", fg: "var(--zara-ink-40)" },
  [SkillStatus.CanDo]: { bg: "var(--zara-bg-warm)", fg: "var(--zara-ink-2)" },
  [SkillStatus.NeedImprovement]: { bg: "var(--zara-gold-tint)", fg: "var(--zara-gold-deep)" },
  [SkillStatus.CanTeach]: { bg: "var(--zara-ink)", fg: "var(--zara-bg)" },
};

export function SkillMatrix({ skills }: { skills: Skill[] }) {
  return (
    <div className="pusula-skills">
      {skills.map((s) => {
        const tone = STATUS[s.status];
        return (
          <div key={s.topic} className="pusula-skill-row">
            <span className="pusula-skill-role">{s.topic}</span>
            <span className="pusula-skill-chip" style={{ background: tone.bg, color: tone.fg }}>
              {s.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
