import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (WASM Postgres for local dev) and pg must be loaded by Node, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Replit's dev preview proxies the app through *.replit.dev / *.repl.co.
  allowedDevOrigins: ["*.replit.dev", "*.repl.co", "*.replit.app", "*.riker.replit.dev"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
