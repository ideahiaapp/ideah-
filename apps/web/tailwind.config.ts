import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#F9F0F9",
          100: "#F1DDF1",
          200: "#E0BDE0",
          300: "#C98DC9",
          400: "#B065B0",
          500: "#924B92",
          600: "#7A3C7A",
          700: "#622F62",
          800: "#4A234A",
          900: "#321632",
        },
        ink: "#2D2D2D",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "auth-gradient": "linear-gradient(135deg, #F9F0F9 0%, #F1DDF1 50%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
