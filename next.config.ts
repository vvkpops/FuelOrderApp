import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Minify and remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // Webpack config for additional minification
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
};

export default nextConfig;
