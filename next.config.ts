import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const emptyPolyfill = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "lib/empty-polyfill.js"
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next/dist/build/polyfills/polyfill-module": emptyPolyfill,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "next/dist/build/polyfills/polyfill-module": emptyPolyfill,
    },
  },
};

export default nextConfig;
