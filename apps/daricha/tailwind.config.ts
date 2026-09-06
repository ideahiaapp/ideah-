import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vinho — fundo profundo, a base da experiência
        wine: {
          950: "#2A0D16",
          900: "#3A1220",
          800: "#491524",
          700: "#5A1A2C",
          600: "#6B1F34",
          500: "#7E2A40",
        },
        // Coral — extraído diretamente do logo Daricha
        coral: {
          200: "#FBD9C7",
          300: "#F6BFA1",
          400: "#F39873",
          500: "#EA7E52",
          600: "#D4653A",
          700: "#B04F2C",
        },
        // Dourado — ornamentos, linhas, destaques
        gold: {
          200: "#EADFC0",
          300: "#D4BA80",
          400: "#C3A359",
          500: "#AD8A44",
        },
        // Creme / areia — texto claro e respiros
        cream: {
          50: "#FBF8F3",
          100: "#F7F2EB",
          200: "#EDE4D4",
          300: "#DDD0C0",
        },
        ink: "#1E100B",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "wine-gradient":
          "radial-gradient(120% 120% at 50% 0%, #5A1A2C 0%, #3A1220 45%, #2A0D16 100%)",
        "coral-glow":
          "radial-gradient(60% 60% at 50% 40%, rgba(243,152,115,0.35) 0%, rgba(243,152,115,0) 70%)",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
