import type { NextConfig } from "next";

const liveLocal = process.env.AZZAM_LIVE === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(liveLocal
    ? {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-store, no-cache, must-revalidate, max-age=0",
                },
                { key: "Pragma", value: "no-cache" },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
