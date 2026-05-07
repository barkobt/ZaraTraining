import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Tone = "ink" | "gold" | "bronze" | "stone";

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const TONE_COLORS: Record<Tone, { bg: string; sweep: string; text: string }> = {
  ink:    { bg: "var(--zara-ink-soft)", sweep: "var(--zara-gold)",      text: "var(--zara-bg)"   },
  gold:   { bg: "var(--zara-gold)",      sweep: "var(--zara-ink-soft)", text: "#FFFFFF"          },
  bronze: { bg: "var(--zara-bronze)",    sweep: "var(--zara-ink-soft)", text: "#FFFFFF"          },
  stone:  { bg: "var(--zara-stone)",     sweep: "var(--zara-ink-soft)", text: "#FFFFFF"          },
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "px-6 py-2.5 text-[10px] tracking-[0.25em] gap-2",
  md: "px-8 py-3.5 text-[11px] tracking-[0.25em] gap-2.5",
  lg: "px-10 py-4 text-[11px] tracking-[0.28em] gap-3",
};

export const SoftButton = forwardRef<HTMLButtonElement, SoftButtonProps>(function SoftButton(
  {
    variant = "primary",
    tone = "ink",
    size = "md",
    iconLeft,
    iconRight,
    children,
    className = "",
    fullWidth,
    disabled,
    ...rest
  },
  ref
) {
  const colors = TONE_COLORS[tone];
  const sizeCls = SIZE_CLASSES[size];

  if (variant === "outline") {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`group relative inline-flex items-center justify-center ${sizeCls} font-sans uppercase font-medium overflow-hidden border-2 transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${className}`}
        style={{ borderColor: colors.bg, color: colors.bg }}
        {...rest}
      >
        <span className="relative z-10 inline-flex items-center gap-2 transition-colors duration-300 group-hover:text-white group-disabled:!text-current">
          {iconLeft}
          {children}
          {iconRight}
        </span>
        <span
          className="absolute inset-0 translate-y-full group-hover:translate-y-0 group-disabled:!translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ background: colors.bg }}
        />
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center ${sizeCls} font-sans uppercase font-medium text-ink/55 hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {iconLeft}
        {children}
        {iconRight}
      </button>
    );
  }

  // primary
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center ${sizeCls} font-sans uppercase font-medium overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${fullWidth ? "w-full" : ""} ${className}`}
      style={{ background: colors.bg, color: colors.text }}
      {...rest}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {iconLeft}
        {children}
        {iconRight}
      </span>
      <span
        className="absolute inset-0 translate-y-full group-hover:translate-y-0 group-disabled:!translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{ background: colors.sweep }}
      />
    </button>
  );
});
