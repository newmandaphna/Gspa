import { defineConfig } from "drizzle-kit";

// Only used for `drizzle-kit studio` / generating migrations against a real
// Postgres. Runtime schema creation is handled by src/lib/db/migrate.ts.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://localhost:5432/thegunspa" },
});
