const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@paideia/types", "@paideia/utils"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@napi-rs/canvas", "pdfjs-dist", "tesseract.js"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "namydxlnlvdsmuxhuveu.supabase.co" },
    ],
  },
};

// Sem SENTRY_DSN/SENTRY_AUTH_TOKEN configurados, o wrapper apenas passa o config adiante
// (nenhum dado é enviado, nenhum build extra é feito) — ativa quando as env vars existirem.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: false,
  webpack: { treeshake: { removeDebugLogging: true } },
});
