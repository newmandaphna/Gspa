import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.SESSION_SECRET = "test-secret";
delete process.env.DATABASE_URL;

import { getDb } from "@/lib/db";
import { createMember, foundersCount, updateMember } from "@/lib/members/service";
import { inquiryInputSchema } from "@/lib/validation";

describe("founders count", () => {
  beforeAll(async () => {
    await getDb();
  });

  it("counts founders who are active or pending and nobody else", async () => {
    const before = await foundersCount();
    const a = await createMember({ firstName: "Founder", lastName: "Active", email: "founder-active@example.com", tier: "founders", billing: "lifetime", status: "active" });
    const p = await createMember({ firstName: "Founder", lastName: "Pending", email: "founder-pending@example.com", tier: "founders", billing: "annual", status: "pending" });
    const c = await createMember({ firstName: "Club", lastName: "Active", email: "club-active@example.com", tier: "club", billing: "annual", status: "active" });
    expect(a.ok && p.ok && c.ok).toBe(true);
    expect(await foundersCount()).toBe(before + 2);

    if (a.ok) await updateMember(a.value.member.id, { status: "suspended" });
    expect(await foundersCount()).toBe(before + 1);

    if (p.ok) await updateMember(p.value.member.id, { status: "expired" });
    expect(await foundersCount()).toBe(before);
  });
});

describe("founders inquiry", () => {
  it("accepts kind founders with the wall opt-in in the message", () => {
    const parsed = inquiryInputSchema.safeParse({
      kind: "founders",
      name: "Ana Reyes",
      email: "ana@example.com",
      phone: "(718) 555-0100",
      message: "Request: Founders conversation, call back within one business day\nBest time: Evenings\nReferred by: not said\nWall listing: yes, first name and last initial",
    });
    expect(parsed.success).toBe(true);
    expect(inquiryInputSchema.safeParse({ kind: "wall", name: "x", email: "x@example.com" }).success).toBe(false);
  });

  it("needs a number the desk can dial for kind founders and only that kind", () => {
    const base = { kind: "founders" as const, name: "Ana Reyes", email: "ana@example.com", message: "Request: Founders conversation" };
    for (const phone of [undefined, "", "555", "call me"]) {
      const r = inquiryInputSchema.safeParse({ ...base, phone });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.path).toEqual(["phone"]);
    }
    expect(inquiryInputSchema.safeParse({ ...base, phone: "+1 718.555.0100" }).success).toBe(true);
    expect(inquiryInputSchema.safeParse({ ...base, kind: "general" }).success).toBe(true);
    expect(inquiryInputSchema.safeParse({ ...base, kind: "membership", phone: "" }).success).toBe(true);
  });
});
