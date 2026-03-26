import type { Config } from "tailwindcss";

const config: Config = {
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
      },
      fontFamily: {
        sans: ['"Geist"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"JetBrains Mono"', "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
