import { NextResponse } from "next/server";

/**
 * JSON route handlers only accept bodies declared as application/json.
 * A cross-site <form> can post urlencoded, multipart or text/plain, never
 * JSON, so this one header check keeps a third-party page from submitting
 * reservations, inquiries or cancellations with a visitor's cookies.
 */
export function isJsonRequest(req: Request): boolean {
  const type = (req.headers.get("content-type") ?? "").trim();
  return /^application\/json\b/i.test(type);
}

export function expectedJson(): NextResponse {
  return NextResponse.json({ error: "Send the request as application/json." }, { status: 415 });
}
