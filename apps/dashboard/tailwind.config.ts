import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#07070d",
        surface: "#0f0f1a",
        "surface-elevated": "#161625",
        "surface-hover": "#1c1c32",
        border: "rgba(99, 102, 241, 0.08)",
        "border-subtle": "rgba(255, 255, 255, 0.04)",
        foreground: "#eeeef0",
        "foreground-secondary": "#c4c4cc",
        muted: "#6b6b80",
        accent: "#6366f1",
        "accent-light": "#818cf8",
        "accent-dim": "rgba(99, 102, 241, 0.12)",
        positive: "#10b981",
        "positive-dim": "rgba(16, 185, 129, 0.12)",
        negative: "#ef4444",
        "negative-dim": "rgba(239, 68, 68, 0.12)",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ['"Geist"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.25)",
        "glow-sm": "0 0 20px -5px rgba(99, 102, 241, 0.15)",
        "card": "0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.06)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.12)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-shine": "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
