import { listClassSessions, saveClassSession } from "@/lib/classes";
import { listExperiences } from "@/lib/booking";
import { documentUploadsEnabled } from "@/lib/class-documents";
import { stripeEnabled } from "@/lib/stripe";
import { isIsoDate } from "@/lib/time";
import { errorResponse, guard, json, readJson, RequestError } from "../../classes/_shared";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await guard(req, true);
    const date = new URL(req.url).searchParams.get("date") || undefined;
    if (date && !isIsoDate(date)) throw new RequestError("Invalid date.");
    return json({ sessions: await listClassSessions({ date, includeUnpublished: true }),
      experiences: (await listExperiences()).filter(e => e.category === "training").map(({ slug, name }) => ({ slug, name })),
      paymentsEnabled: stripeEnabled(), documentsEnabled: documentUploadsEnabled(), emailEnabled: Boolean(process.env.RESEND_API_KEY) });
  } catch (error) { return errorResponse(error); }
}
export async function POST(req: Request) {
  try {
    await guard(req, true);
    const result = await saveClassSession(await readJson(req));
    return json(result, result.ok ? 201 : 400);
  } catch (error) { return errorResponse(error); }
}