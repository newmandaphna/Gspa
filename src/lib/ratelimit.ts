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

/**
 * The client address as seen by the trusted edge. Proxies append the address
 * they observed to X-Forwarded-For, so the left-most entry is whatever the
 * client typed; the trustworthy one sits TRUSTED_PROXY_HOPS from the right
 * (default 1: the entry the last proxy added). x-real-ip is client-settable
 * without a proxy and is never used. Fails closed: with no header, every
 * request shares one bucket.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const fwd = headers.get("x-forwarded-for");
  if (!fwd) return "anon";
  const parts = fwd
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);
  return parts[Math.max(0, parts.length - hops)] || "anon";
}

export function clientKey(req: Request): string {
  return clientIp(req.headers);
}
