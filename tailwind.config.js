/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          // DS: shadcn accent HSL kanalı colors.css'te --accent-hsl olarak ayrıldı
          // (--accent artık semantic = var(--zara-gold)). Çakışma fix.
          DEFAULT: "hsl(var(--accent-hsl))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        // Tailwind font-* utility'lerini DS stack'lerine bağla (var(--ff-*)).
        display: ["var(--ff-display)"],
        serif: ["var(--ff-serif)"],
        sans: ["var(--ff-sans)"],
        mono: ["var(--ff-mono)"],
        editorial: ["var(--ff-editorial)"],
      },
      fontSize: {
        // DS ölçeği → text-* utility'leri. [size, {lineHeight, letterSpacing}].
        "display-2xl": ["var(--fs-display-2xl)", { lineHeight: "var(--lh-display)", letterSpacing: "var(--tr-display)" }],
        "display-xl": ["var(--fs-display-xl)", { lineHeight: "var(--lh-display)", letterSpacing: "var(--tr-display)" }],
        "display-lg": ["var(--fs-display-lg)", { lineHeight: "var(--lh-display)", letterSpacing: "var(--tr-display)" }],
        h1: ["var(--fs-h1)", { lineHeight: "var(--lh-h1)", letterSpacing: "var(--tr-h1)" }],
        h2: ["var(--fs-h2)", { lineHeight: "var(--lh-h2)", letterSpacing: "var(--tr-h2)" }],
        h3: ["var(--fs-h3)", { lineHeight: "var(--lh-h3)", letterSpacing: "var(--tr-h3)" }],
        h4: ["var(--fs-h4)", { lineHeight: "var(--lh-h4)", letterSpacing: "var(--tr-h4)" }],
        "body-lg": ["var(--fs-body-lg)", { lineHeight: "var(--lh-body-lg)" }],
        body: ["var(--fs-body)", { lineHeight: "var(--lh-body)" }],
        "body-sm": ["var(--fs-body-sm)", { lineHeight: "var(--lh-body-sm)" }],
        caption: ["var(--fs-caption)", { lineHeight: "var(--lh-caption)" }],
        eyebrow: ["var(--fs-eyebrow)", { lineHeight: "var(--lh-eyebrow)" }],
        meta: ["var(--fs-meta)", { lineHeight: "var(--lh-meta)" }],
        "mono-code": ["var(--fs-mono)", { lineHeight: "var(--lh-mono)" }],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}