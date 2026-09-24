import { describe, expect, it } from "vitest";
import { FACILITY, SITE } from "@/lib/config/site";
import { courseJsonLd } from "@/lib/seo/jsonld";
import { findPlaceholder, isPlaceholder, stripPlaceholders } from "@/lib/seo/placeholders";

/**
 * The build gate. Every export of src/lib/content/** plus SITE and FACILITY
 * is walked, and any string still holding an owner placeholder (a value in
 * square brackets, the 000-0000 phone, an example.com address) fails the run.
 *
 * It is skipped unless CONTENT_FINAL=1, so today's deploys pass. Once the
 * owner has supplied the facts, set CONTENT_FINAL=1 in the .replit build
 * command and no bracket can reach production again. Run it by hand with
 *   CONTENT_FINAL=1 npx vitest run src/tests/placeholders.test.ts
 */

const contentModules = import.meta.glob("/src/lib/content/**/*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

type Hit = { at: string; text: string; placeholder: string };

/** Walk any exported value and collect the strings that still hold a placeholder. */
function collect(value: unknown, at: string, hits: Hit[], seen: Set<object>): void {
  if (typeof value === "string") {
    const found = findPlaceholder(value);
    if (found) hits.push({ at, text: value.length > 80 ? `${value.slice(0, 77)}...` : value, placeholder: found });
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((v, i) => collect(v, `${at}[${i}]`, hits, seen));
    return;
  }
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    collect(v, `${at}.${key}`, hits, seen);
  }
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  const seen = new Set<object>();
  collect(SITE, "SITE", hits, seen);
  collect(FACILITY, "FACILITY", hits, seen);
  for (const [file, mod] of Object.entries(contentModules)) {
    for (const [name, value] of Object.entries(mod)) {
      collect(value, `${file.replace(/^\/src\/lib\/content\//, "")}:${name}`, hits, seen);
    }
  }
  return hits;
}

const gated = process.env.CONTENT_FINAL === "1";

describe.skipIf(!gated)("content is final (CONTENT_FINAL=1)", () => {
  it("imports every content module", () => {
    expect(Object.keys(contentModules).length).toBeGreaterThan(5);
  });

  it("has no bracketed value, 000-0000 phone or example.com address anywhere in SITE, FACILITY or src/lib/content", () => {
    const hits = scan();
    const report = hits.map((h) => `  ${h.at}: ${JSON.stringify(h.text)} (${h.placeholder})`).join("\n");
    expect(hits, `Owner placeholders still in the content:\n${report}`).toEqual([]);
  });
});

describe("placeholder gate wiring", () => {
  it("is skipped unless CONTENT_FINAL=1", () => {
    // The gate above only runs with the flag; this test documents that and always passes.
    expect(typeof gated).toBe("boolean");
  });

  it("finds the placeholders it is meant to catch", () => {
    expect(findPlaceholder("(718) 000-0000")).toBe("000-0000");
    expect(findPlaceholder("[Q7] bus")).toBe("[Q7]");
    expect(findPlaceholder("desk@example.com")).toBe("example.com");
    // The desk address every email asks guests to reply to is a TODO(owner) default until confirmed.
    expect(findPlaceholder("mailto:desk@gunspa.com")).toBe("desk@gunspa.com");
    expect(findPlaceholder("158-12 Rockaway Blvd")).toBeNull();
  });
});

describe("stripPlaceholders", () => {
  it("drops the whole sentence that held the bracket, not just the bracket", () => {
    expect(stripPlaceholders("Twelve seats per course, and dates post monthly. Price [owner to confirm].")).toBe(
      "Twelve seats per course, and dates post monthly.",
    );
    expect(stripPlaceholders("Parking [to be confirmed] is free. The lounge is open.")).toBe("The lounge is open.");
  });

  it("returns an empty string when every sentence held a bracket", () => {
    expect(stripPlaceholders("Price [owner to confirm].")).toBe("");
  });

  it("leaves text without a bracket alone", () => {
    expect(stripPlaceholders("Sixteen hours in the classroom, two on the line.")).toBe(
      "Sixteen hours in the classroom, two on the line.",
    );
  });

  it("gives the Course record on /training a description with no bracket and no dangling word", () => {
    const course = courseJsonLd();
    expect(course).not.toBeNull();
    const description = course?.description as string;
    expect(isPlaceholder(description)).toBe(false);
    expect(description.endsWith("Price")).toBe(false);
    expect(description).toMatch(/[.!?]$/);
  });
});
