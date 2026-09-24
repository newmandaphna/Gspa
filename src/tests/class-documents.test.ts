import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { decryptClassDocument, documentUploadsEnabled, encryptClassDocument, normalizeClassDocument } from "@/lib/class-documents";

afterEach(() => vi.unstubAllEnvs());
describe("class identity documents", () => {
  it("fails closed without a strong configured secret", () => {
    vi.stubEnv("SESSION_SECRET", "short");
    expect(documentUploadsEnabled()).toBe(false);
    expect(() => encryptClassDocument(Buffer.from("id"), 1, 0)).toThrow("not configured");
  });
  it("authenticates ciphertext and attendee association", () => {
    vi.stubEnv("SESSION_SECRET", "a".repeat(40));
    const encrypted = encryptClassDocument(Buffer.from("private"), 5, 0);
    const row = { ...encrypted, id: 1, bookingId: 5, attendeeIndex: 0, createdAt: new Date(), expiresAt: new Date() };
    expect(decryptClassDocument(row).toString()).toBe("private");
    expect(encrypted.ciphertext).not.toContain("private");
    expect(() => decryptClassDocument({ ...row, attendeeIndex: 1 })).toThrow();
    expect(() => decryptClassDocument({ ...row, ciphertext: Buffer.from("tampered").toString("base64") })).toThrow();
    expect(encryptClassDocument(Buffer.from("private"), 5, 0).iv).not.toBe(row.iv);
  });
  it("validates magic, size and decoder input", async () => {
    await expect(normalizeClassDocument(Buffer.from("<svg/>"))).rejects.toThrow("JPEG or PNG");
    await expect(normalizeClassDocument(Buffer.alloc(2 * 1024 * 1024 + 1))).rejects.toThrow("2 MiB");
    await expect(normalizeClassDocument(Buffer.from([255, 216, 255, 0]))).rejects.toThrow("decoded safely");
  });
  it("re-encodes PNG as metadata-free JPEG", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "red" } }).png().withMetadata().toBuffer();
    const output = await normalizeClassDocument(png);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  });
});