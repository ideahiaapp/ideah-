import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iniciação e Qualificação em Terapêutica Tântrica — Método Daricha Sundari",
  description:
    "Você viveu a experiência. Agora pode descobrir o que existe por trás dela. Iniciação e Qualificação em Terapêutica Tântrica — Método Daricha Sundari.",
  icons: {
    icon: "/daricha-logo.png",
  },
  openGraph: {
    title: "Iniciação e Qualificação em Terapêutica Tântrica — Método Daricha Sundari",
    description: "Você viveu a experiência. Agora pode descobrir o que existe por trás dela.",
    images: ["/daricha-logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2A0D16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
