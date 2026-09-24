import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import sharp from "sharp";
import { eq, inArray, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, classDocuments } from "@/lib/db/schema";

export const DOCUMENT_MAX_BYTES = 2 * 1024 * 1024;
export const DOCUMENT_TOTAL_BYTES = 8 * 1024 * 1024;
export function documentUploadsEnabled() {
  return (process.env.SESSION_SECRET?.trim().length ?? 0) >= 32;
}
function key() {
  if (!documentUploadsEnabled()) throw new Error("Identity document storage is not configured.");
  return Buffer.from(hkdfSync("sha256", process.env.SESSION_SECRET!.trim(), "gunspa", "class-document-v1", 32));
}
export async function normalizeClassDocument(input: Buffer): Promise<Buffer> {
  if (!input.length || input.length > DOCUMENT_MAX_BYTES) throw new Error("Each ID image must be at most 2 MiB.");
  const jpeg = input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
  const png = input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!jpeg && !png) throw new Error("ID images must be JPEG or PNG.");
  try {
    return await sharp(input, { limitInputPixels: 20_000_000, failOn: "warning" })
      .rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#fff" }).jpeg({ quality: 85 }).toBuffer();
  } catch { throw new Error("ID image could not be decoded safely."); }
}
export function encryptClassDocument(image: Buffer, bookingId: number, attendeeIndex: number) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`${bookingId}:${attendeeIndex}`));
  return { ciphertext: Buffer.concat([cipher.update(image), cipher.final()]).toString("base64"),
    iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}
export function decryptClassDocument(row: typeof classDocuments.$inferSelect): Buffer {
  const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(row.iv, "base64"));
  cipher.setAAD(Buffer.from(`${row.bookingId}:${row.attendeeIndex}`));
  cipher.setAuthTag(Buffer.from(row.authTag, "base64"));
  return Buffer.concat([cipher.update(Buffer.from(row.ciphertext, "base64")), cipher.final()]);
}
export async function storeClassDocuments(bookingId: number, endsAt: Date, images: Buffer[]) {
  if (!images.length) return;
  const db = await getDb();
  await db.insert(classDocuments).values(images.map((image, attendeeIndex) => ({
    bookingId, attendeeIndex, ...encryptClassDocument(image, bookingId, attendeeIndex),
    expiresAt: new Date(endsAt.getTime() + 30 * 86400_000),
  })));
}
/** Retain IDs only until 30 days after class; cancellations are deleted sooner. */
export async function purgeExpiredClassDocuments() {
  const db = await getDb();
  await db.delete(classDocuments).where(or(lte(classDocuments.expiresAt, new Date()),
    inArray(classDocuments.bookingId, db.select({ id: bookings.id }).from(bookings).where(eq(bookings.status, "cancelled")))));
}