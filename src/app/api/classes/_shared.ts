import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { SITE } from "@/lib/config/site";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function errorResponse(error: unknown) {
  return json({ error: error instanceof RequestError ? error.message : "The request could not be completed. Please try again." }, error instanceof RequestError ? error.status : 500);
}
export async function guard(req: Request, admin = false) {
  if (admin && !(await isAdmin())) throw new RequestError("Unauthorized.", 401);
  if (!rateLimit(`classes:${admin ? "admin" : "public"}:${clientKey(req)}`, { limit: admin ? 120 : 20, windowMs: 600_000 })) throw new RequestError("Too many requests. Try again later.", 429);
  if (!["GET", "HEAD"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowed = new Set([new URL(req.url).origin, new URL(SITE.url).origin]);
    // Next's standalone server URL may use its bind address (0.0.0.0)
    // rather than the public request host. The browser Origin must also be
    // accepted when it matches the actual Host, without trusting forwarded hosts.
    const host = req.headers.get("host");
    if (host && origin) {
      try {
        const parsedOrigin = new URL(origin);
        if (parsedOrigin.host === host && ["http:", "https:"].includes(parsedOrigin.protocol)) allowed.add(parsedOrigin.origin);
      } catch { /* malformed origins remain rejected */ }
    }
    if (!origin || !allowed.has(origin) || req.headers.get("sec-fetch-site") === "cross-site") throw new RequestError("Same-origin request required.", 403);
  }
}
export async function boundedBody(req: Request, max = 64 * 1024) {
  const length = Number(req.headers.get("content-length"));
  if (length > max) throw new RequestError("Request is too large.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError("Request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw new RequestError("Request is too large.", 413); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function readJson(req: Request) {
  if (!/^application\/json\b/i.test(req.headers.get("content-type") ?? "")) throw new RequestError("Send application/json.", 415);
  const body = await boundedBody(req);
  try { return JSON.parse(body.toString()); } catch { throw new RequestError("Invalid JSON."); }
}
export function positiveId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new RequestError("Invalid ID.");
  return id;
}