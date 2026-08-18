import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006e2f",
          container: "#22c55e",
          fixed: "#6bff8f",
          "fixed-dim": "#4ae176",
          dark: "#004b1e",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#004b1e",
        "on-primary-fixed": "#002109",
        "on-primary-fixed-variant": "#005321",
        "inverse-primary": "#4ae176",

        secondary: {
          DEFAULT: "#565e74",
          container: "#dae2fd",
          fixed: "#dae2fd",
          "fixed-dim": "#bec6e0",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5c647a",
        "on-secondary-fixed": "#131b2e",
        "on-secondary-fixed-variant": "#3f465c",

        tertiary: {
          DEFAULT: "#005ac2",
          container: "#82abff",
          fixed: "#d8e2ff",
          "fixed-dim": "#adc6ff",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#003d88",
        "on-tertiary-fixed": "#001a42",
        "on-tertiary-fixed-variant": "#004395",

        background: "#f7f9fb",
        "on-background": "#191c1e",

        surface: {
          DEFAULT: "#f7f9fb",
          bright: "#f7f9fb",
          dim: "#d8dadc",
          tint: "#006e2f",
          variant: "#e0e3e5",
          "container-lowest": "#ffffff",
          "container-low": "#f2f4f6",
          container: "#eceef0",
          "container-high": "#e6e8ea",
          "container-highest": "#e0e3e5",
        },
        "on-surface": "#191c1e",
        "on-surface-variant": "#3d4a3d",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",

        outline: {
          DEFAULT: "#6d7b6c",
          variant: "#bccbb9",
        },

        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft: "0px 4px 20px rgba(15, 23, 42, 0.05)",
        floating: "0px 10px 30px rgba(15, 23, 42, 0.1)",
        glow: "0 0 20px rgba(34, 197, 94, 0.35)",
        lift: "0px 8px 24px rgba(0, 110, 47, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-up": "scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulseSoft 2s infinite ease-in-out",
        shimmer: "shimmer 2.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
