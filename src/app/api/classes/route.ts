import { listClassSessions } from "@/lib/classes";
import { documentUploadsEnabled } from "@/lib/class-documents";
import { stripeEnabled } from "@/lib/stripe";
import { isIsoDate } from "@/lib/time";
import { upcomingClasses, type PublicClassSession } from "@/lib/public-classes";
import { errorResponse, guard, json, RequestError } from "./_shared";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await guard(req);
    const date = new URL(req.url).searchParams.get("date") || undefined;
    if (date && !isIsoDate(date)) throw new RequestError("Invalid date.");
    const sessions: PublicClassSession[] = upcomingClasses(await listClassSessions({ date })).map(s => ({
      id: s.id, title: s.title, experienceName: s.experienceName,
      startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(),
      priceCents: s.priceCents, maxPerBooking: s.maxPerBooking, status: s.status,
      instructor: s.instructor, requirements: s.requirements, collectId: s.collectId,
      seatsRemaining: s.seatsRemaining,
    }));
    return json({ sessions, paymentsEnabled: stripeEnabled(), documentsEnabled: documentUploadsEnabled() });
  } catch (error) { return errorResponse(error); }
}