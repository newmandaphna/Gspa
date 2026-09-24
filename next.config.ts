import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (WASM Postgres for local dev) and pg must be loaded by Node, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Replit preview hosts may have multiple subdomain levels.
  allowedDevOrigins: ["127.0.0.1", "**.replit.dev", "**.repl.co", "**.replit.app"],
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // AVIF first, WebP for the rest. Breakpoints follow the phones and desktops the
    // shoot is exported for (see MEDIA.md); 2560 covers a full-bleed hero on a 5K display.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 430, 768, 1024, 1440, 1920, 2560],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
