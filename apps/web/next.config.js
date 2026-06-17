/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ideah/types", "@ideah/utils"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "namydxlnlvdsmuxhuveu.supabase.co" },
    ],
  },
};

module.exports = nextConfig;
