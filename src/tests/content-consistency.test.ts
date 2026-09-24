import { describe, expect, it } from "vitest";
import { BOOKING } from "@/lib/config/site";
import { itemBySlug } from "@/lib/content/catalog";
import { FAQ } from "@/lib/content/faq";
import { CLUB_DECISIONS, DECISIONS } from "@/lib/content/pages/club";
import { LADDER } from "@/lib/content/pages/training";
import { CANCELLATION_POLICY, COURSE_CANCEL_DAYS, COURSE_CANCEL_WINDOW, HOUSE_RULES, REQUIREMENTS } from "@/lib/content/requirements";

/**
 * Copy that restates a number or a rule from somewhere else has to agree
 * with its source. These tests pin the places that drifted once already.
 */

describe("cancellation copy follows the catalog and BOOKING", () => {
  const course = itemBySlug("nys-ccw-course");
  const faqAnswer = FAQ.find((f) => f.id === "cancellation")?.a ?? "";

  it("derives the course window from the catalog's cancelHours", () => {
    expect(course?.cancelHours).toBeDefined();
    expect(COURSE_CANCEL_DAYS).toBe(Math.round((course?.cancelHours ?? 0) / 24));
    expect(COURSE_CANCEL_WINDOW).toBe("seven days");
  });

  it("names the course exception in the policy and in the FAQ", () => {
    for (const text of [CANCELLATION_POLICY, faqAnswer]) {
      expect(text).toContain(`${BOOKING.freeCancelHours} hours`);
      expect(text).toContain(`${BOOKING.suiteFreeCancelHours} hours`);
      expect(text).toContain(COURSE_CANCEL_WINDOW);
      expect(text).toContain(course?.name ?? "");
    }
  });
});

describe("house rules agree with the requirements card", () => {
  it("bans brimmed hats only, in both places", () => {
    const hatRule = HOUSE_RULES.find((r) => /\bhats?\b/i.test(r.decision));
    const hatRequirement = REQUIREMENTS.find((r) => /\bhats?\b/i.test(r.text));
    expect(hatRule?.decision).toMatch(/brimmed hats/i);
    expect(hatRequirement?.text).toMatch(/brimmed hats/i);
    expect(hatRule?.decision).not.toMatch(/especially/);
  });
});

describe("the training ladder describes its own rungs", () => {
  it("ends where the subhead says it ends", () => {
    const last = LADDER.rungs[LADDER.rungs.length - 1];
    expect(LADDER.subhead.toLowerCase()).toContain(last.label.toLowerCase());
  });
});

describe("the club page counts the house rules honestly", () => {
  it("does not call the linked page 'the rest' when two decisions repeat house rules", () => {
    // Decision 1 restates the age rule; decision 2 restates the impairment rule.
    const ageRepeated = DECISIONS.some((d) => d.decision.startsWith("Live fire is")) && HOUSE_RULES.some((h) => h.decision.startsWith("Live fire is"));
    const impairmentRepeated = DECISIONS.some((d) => d.decision.startsWith("No alcohol")) && HOUSE_RULES.some((h) => h.decision.startsWith("Nothing impairing"));
    expect(ageRepeated && impairmentRepeated).toBe(true);
    expect(HOUSE_RULES).toHaveLength(10);
    expect(CLUB_DECISIONS.body).not.toMatch(/the rest of/i);
    expect(CLUB_DECISIONS.body).toContain("All ten house rules, two of them repeated above");
  });
});
