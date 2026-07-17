import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FDF1ED",
          100: "#FBE0D6",
          200: "#F5C0AC",
          300: "#ED9777",
          400: "#DB6F49",
          500: "#C2542F",
          600: "#A8451F",
          700: "#87371A",
          800: "#642814",
          900: "#41190D",
        },
        ink: "#2D2D2D",
        sand: {
          50:  "#FBF8F3",
          100: "#F5EEE0",
          200: "#EADFC7",
          300: "#DCC8A0",
        },
        deep: {
          600: "#1E3A5C",
          700: "#16304C",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "auth-gradient": "linear-gradient(135deg, #FDF1ED 0%, #FBE0D6 50%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
