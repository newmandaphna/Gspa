import { handleCronRequest } from "../_shared";

export const dynamic = "force-dynamic";

/**
 * Alias kept so an existing schedule keeps working. It runs the same jobs as
 * GET /api/cron/run and answers with the same summary; new schedules should
 * point at /api/cron/run.
 */
export async function GET(req: Request) {
  return handleCronRequest(req);
}
