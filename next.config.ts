import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "react-hot-toast"],
  },
};

export default nextConfig;
