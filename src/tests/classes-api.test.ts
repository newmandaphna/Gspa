import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", () => ({ isAdmin: vi.fn(async () => false) }));
vi.mock("@/lib/classes", () => ({ listClassSessions: vi.fn(async () => [{ id: 1, title: "Safety", status: "open", staffNotes: "private note", roster: ["private"], paidSeats: 2, startsAt: new Date("2099-01-01T12:00:00Z"), endsAt: new Date("2099-01-01T14:00:00Z") }]) }));
import { isAdmin } from "@/lib/auth";
import { listClassSessions } from "@/lib/classes";
import { boundedBody, guard, readJson } from "@/app/api/classes/_shared";
import { GET } from "@/app/api/classes/route";

describe("class API boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects unauthenticated administrators", async () => {
    await expect(guard(new Request("https://example.com/api/admin/classes"), true)).rejects.toMatchObject({ status: 401 });
    expect(isAdmin).toHaveBeenCalled();
  });
  it("rejects cross-origin mutations and missing origins", async () => {
    await expect(guard(new Request("https://example.com/api/classes/enroll", { method: "POST", headers: { origin: "https://evil.invalid" } }))).rejects.toMatchObject({ status: 403 });
    await expect(guard(new Request("https://example.com/api/classes/enroll", { method: "POST" }))).rejects.toMatchObject({ status: 403 });
  });
  it("accepts the browser request host when Next uses its internal bind address", async () => {
    await expect(guard(new Request("http://0.0.0.0:5001/api/classes/enroll", {
      method: "POST", headers: { host: "127.0.0.1:5001", origin: "http://127.0.0.1:5001" },
    }))).resolves.toBeUndefined();
    await expect(guard(new Request("http://0.0.0.0:5001/api/classes/enroll", {
      method: "POST", headers: { host: "127.0.0.1:5001", origin: "https://evil.invalid" },
    }))).rejects.toMatchObject({ status: 403 });
    await expect(guard(new Request("http://0.0.0.0:5001/api/classes/enroll", {
      method: "POST", headers: { host: "127.0.0.1:5001", origin: "http://127.0.0.1:5001", "sec-fetch-site": "cross-site" },
    }))).rejects.toMatchObject({ status: 403 });
  });
  it("bounds streamed bytes before JSON or multipart parsing", async () => {
    await expect(boundedBody(new Request("https://example.com", { method: "POST", body: "123456" }), 5)).rejects.toMatchObject({ status: 413 });
    await expect(readJson(new Request("https://example.com", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" }))).rejects.toMatchObject({ status: 415 });
  });
  it("does not expose staff notes and serializes timestamps", async () => {
    const response = await GET(new Request("https://example.com/api/classes"));
    const body = await response.json();
    expect(body.sessions[0].staffNotes).toBeUndefined();
    expect(body.sessions[0].startsAt).toBe("2099-01-01T12:00:00.000Z");
    expect(body.sessions[0].roster).toBeUndefined();
    expect(body.sessions[0].paidSeats).toBeUndefined();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects malformed dates before querying", async () => {
    const response = await GET(new Request("https://example.com/api/classes?date=garbage"));
    expect(response.status).toBe(400);
    expect(listClassSessions).not.toHaveBeenCalled();
  });
});