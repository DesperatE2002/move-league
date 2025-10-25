import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Production build sırasında ESLint hatalarını yoksay
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Production build sırasında TypeScript hatalarını yoksay
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
