/**
 * Best-effort in-memory rate limiter (per process). Good enough to blunt
 * form spam on a single Replit instance; swap for Redis if you scale out.
 */
const buckets = new Map<string, { tokens: number; updated: number }>();

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): boolean {
  const now = Date.now();
  const refillPerMs = opts.limit / opts.windowMs;
  const b = buckets.get(key) ?? { tokens: opts.limit, updated: now };
  b.tokens = Math.min(opts.limit, b.tokens + (now - b.updated) * refillPerMs);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now - v.updated > opts.windowMs) buckets.delete(k);
  }
  return true;
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) ?? "anon";
}
