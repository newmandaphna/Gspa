/**
 * Placeholder detection, shared by the <Owner> component, the JSON-LD builder
 * and the CONTENT_FINAL build gate (src/tests/placeholders.test.ts).
 *
 * A placeholder is anything the owner has not confirmed yet: a value in square
 * brackets ("[Q7]", "[On-site parking to be confirmed]"), the 000-0000 phone,
 * an example.com address, or a default the site was written with and the
 * owner has not signed off on (see UNCONFIRMED_DEFAULTS).
 */

/**
 * Values that look real but are still marked TODO(owner) in site.ts. Every
 * email says "reply to this email and a person at the desk answers" and
 * Reply-To is this address, so it must exist before the gate passes. Remove
 * an entry once the owner has confirmed it (or replaced it).
 */
export const UNCONFIRMED_DEFAULTS: readonly string[] = ["desk@gunspa.com"];

export const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /\[[^\]]*\]/,
  /000-0000/,
  /example\.com/i,
  ...UNCONFIRMED_DEFAULTS.map((v) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")),
];

export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

/** The first placeholder found in a string, for error messages. */
export function findPlaceholder(value: string): string | null {
  for (const re of PLACEHOLDER_PATTERNS) {
    const m = value.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * The same text with every sentence that holds a bracket removed, for
 * structured data that search engines will index. Removing only the bracket
 * would leave a stub ("... dates post monthly. Price"), so the whole sentence
 * goes: "Dates post monthly. Price [owner to confirm]." becomes "Dates post
 * monthly." A one-sentence value that holds a bracket becomes "". Callers
 * should still prefer a field that never had a placeholder; this is a last
 * resort for long descriptions.
 */
export function stripPlaceholders(value: string): string {
  return value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\[[^\]]*\]/.test(sentence))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
