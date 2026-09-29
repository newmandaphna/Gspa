import { describe, expect, it, vi } from "vitest";
const proxy = vi.hoisted(() => vi.fn());
vi.mock("@replit/connectors-sdk", () => ({ ReplitConnectors: class { proxy = proxy; } }));
import { sendSignupToSheet, signupRow } from "@/lib/signup-sheet";
import type { Inquiry } from "@/lib/db/schema";

const inquiry: Inquiry = {
  id: 123, kind: "membership", name: "=not-a-formula", email: "test@example.invalid",
  phone: "0123456789", company: null, guests: null, preferredDate: null,
  message: "Membership list (pre-opening)\nZIP: 01234\nNYC pistol license: Pending\nHeard via: Search",
  createdAt: new Date("2026-09-28T12:00:00Z"),
};
describe("signup spreadsheet", () => {
  it("preserves literal text and leading zeros", () => {
    expect(signupRow(inquiry)).toEqual(["123", "2026-09-28T12:00:00.000Z", "=not-a-formula", "test@example.invalid", "0123456789", "01234", "Pending", "Search"]);
  });
  it("appends using RAW instead of formula interpretation", async () => {
    proxy.mockResolvedValueOnce({ ok: true });
    await sendSignupToSheet(inquiry);
    expect(proxy).toHaveBeenCalledWith("google-sheet", expect.stringContaining("valueInputOption=RAW"), expect.objectContaining({ method: "POST" }));
  });
  it("does not send other inquiries", async () => {
    proxy.mockClear();
    await sendSignupToSheet({ ...inquiry, kind: "event" });
    expect(proxy).not.toHaveBeenCalled();
  });
  it("reports a failed write", async () => {
    proxy.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(sendSignupToSheet(inquiry)).rejects.toThrow("403");
  });
});