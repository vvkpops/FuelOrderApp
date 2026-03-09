import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Minify and remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // Empty turbopack config to allow build
  turbopack: {},
};

export default nextConfig;
