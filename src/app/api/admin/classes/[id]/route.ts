import { eq } from "drizzle-orm";
import { getClassSession, listClassRoster, saveClassSession } from "@/lib/classes";
import { documentUploadsEnabled, purgeExpiredClassDocuments } from "@/lib/class-documents";
import { getDb } from "@/lib/db";
import { classDocuments } from "@/lib/db/schema";
import { errorResponse, guard, json, positiveId, readJson, RequestError } from "../../../classes/_shared";

type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Context) {
  try {
    await guard(req, true);
    const id = positiveId((await ctx.params).id);
    const session = await getClassSession(id);
    if (!session) throw new RequestError("Class not found.", 404);
    await purgeExpiredClassDocuments();
    const db = await getDb();
    const roster = await Promise.all((await listClassRoster(id)).map(async row => ({
      ...row, documents: await db.select({ id: classDocuments.id, attendeeIndex: classDocuments.attendeeIndex,
        createdAt: classDocuments.createdAt, expiresAt: classDocuments.expiresAt }).from(classDocuments).where(eq(classDocuments.bookingId, row.booking.id)),
    })));
    return json({ session, roster, documentsEnabled: documentUploadsEnabled(), emailEnabled: Boolean(process.env.RESEND_API_KEY) });
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    await guard(req, true);
    const result = await saveClassSession(await readJson(req), positiveId((await ctx.params).id));
    return json(result, result.ok ? 200 : 400);
  } catch (error) { return errorResponse(error); }
}