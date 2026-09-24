import { getBookingByCode } from "@/lib/booking";
import { icsFor } from "@/lib/email";

export const dynamic = "force-dynamic";

/** The reservation as a downloadable .ics, the same file the confirmation email attaches. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const found = await getBookingByCode(code);
  if (!found || found.booking.status === "cancelled") return new Response("Not found", { status: 404 });
  const { booking, experience } = found;
  return new Response(icsFor(booking, experience), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="gun-spa-${booking.code}.ics"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
