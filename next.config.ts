import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (WASM Postgres for local dev) and pg must be loaded by Node, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Replit preview hosts may have multiple subdomain levels.
  allowedDevOrigins: ["127.0.0.1", "**.replit.dev", "**.repl.co", "**.replit.app"],
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
