/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        surface: "#ffffff",
        canvas: "#f4f6f9",
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
        },
        accent: {
          DEFAULT: "#2563eb",   // bleu foncé de base
          hover: "#1e3a8a",     // bleu foncé plus profond (hover)
          soft: "#eff6ff",
        },
        brown: {
          DEFAULT: "#78350f",   // marron principal (remplace le jaune/ambre)
          dark: "#5c2a0c",
          soft: "#fdf3e7",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 2px 8px -2px rgb(15 23 42 / 0.06)",
      },
    },
  },
  plugins: [],
};