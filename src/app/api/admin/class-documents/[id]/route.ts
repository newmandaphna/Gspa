import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { classDocuments } from "@/lib/db/schema";
import { decryptClassDocument, purgeExpiredClassDocuments } from "@/lib/class-documents";
import { errorResponse, guard, json, positiveId, RequestError } from "../../../classes/_shared";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Context) {
  try {
    await guard(req, true);
    await purgeExpiredClassDocuments();
    const db = await getDb();
    const [row] = await db.select().from(classDocuments).where(eq(classDocuments.id, positiveId((await ctx.params).id)));
    if (!row || row.expiresAt <= new Date()) throw new RequestError("Document not found or expired.", 404);
    return new Response(new Uint8Array(decryptClassDocument(row)), { headers: {
      "Content-Type": "image/jpeg", "Content-Disposition": `attachment; filename="attendee-${row.attendeeIndex + 1}-id.jpg"`,
      "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    await guard(req, true);
    const db = await getDb();
    await db.delete(classDocuments).where(eq(classDocuments.id, positiveId((await ctx.params).id)));
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}