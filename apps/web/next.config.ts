import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ideah/types", "@ideah/utils"],
};

export default nextConfig;
