import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;