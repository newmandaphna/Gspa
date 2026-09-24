import { handleCronRequest } from "../_shared";

export const dynamic = "force-dynamic";

/**
 * The hourly scheduled run: class document purge, class mail outbox, then
 * day-before reminders. See ../_shared.ts for the contract.
 */
export async function GET(req: Request) {
  return handleCronRequest(req);
}
