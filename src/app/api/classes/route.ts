import { listClassSessions } from "@/lib/classes";
import { documentUploadsEnabled } from "@/lib/class-documents";
import { stripeEnabled } from "@/lib/stripe";
import { isIsoDate } from "@/lib/time";
import { errorResponse, guard, json, RequestError } from "./_shared";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await guard(req);
    const date = new URL(req.url).searchParams.get("date") || undefined;
    if (date && !isIsoDate(date)) throw new RequestError("Invalid date.");
    const sessions = (await listClassSessions({ date })).map(session => {
      const publicSession: Partial<typeof session> = { ...session };
      delete publicSession.staffNotes;
      return publicSession;
    });
    return json({ sessions, paymentsEnabled: stripeEnabled(), documentsEnabled: documentUploadsEnabled() });
  } catch (error) { return errorResponse(error); }
}