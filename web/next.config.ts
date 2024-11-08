import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  }
};

export default nextConfig;
