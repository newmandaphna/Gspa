/**
 * Only same-origin paths may be used as a post-login destination. Rejects
 * protocol-relative ("//evil"), backslash ("/\evil", which browsers read as
 * "//evil") and absolute URLs, and returns a normalised path plus query so
 * nothing else in the value (a fragment, odd encoding) reaches redirect().
 */
export function safeNext(value: unknown, fallback = "/members"): string {
  const s = typeof value === "string" ? value : "";
  if (!/^\/(?![/\\])/.test(s)) return fallback;
  try {
    const base = "http://gunspa.invalid";
    const u = new URL(s, base);
    if (u.origin !== base) return fallback;
    return `${u.pathname}${u.search}`;
  } catch {
    return fallback;
  }
}
