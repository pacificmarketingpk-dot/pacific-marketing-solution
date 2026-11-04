import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site (no Node server on Hostinger shared hosting) — every
  // route is pre-rendered to its own index.html at build time, matching the
  // current site's folder-per-page URL structure exactly.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
