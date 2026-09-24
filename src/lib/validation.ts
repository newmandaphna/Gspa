import { z } from "zod";
import { BOOKING } from "@/lib/config/site";

/** Digits with the usual separators. Shared by bookings and any inquiry the desk has promised to call back. */
const PHONE_RE = /^[+()\-.\s\d]+$/;

export const bookingInputSchema = z.object({
  experienceSlug: z.string().trim().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  guests: z.number().int().min(BOOKING.minGuests).max(BOOKING.maxGuests),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.email("Enter a valid email").trim().max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(30)
    .regex(PHONE_RE, "Enter a valid phone number"),
  memberNumber: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  ackRequirements: z.literal(true, "You must acknowledge the range requirements"),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

/** Every inquiry kind the site writes. "founders" is a call-back request from /membership and gets a badge on the admin Today screen. */
export const INQUIRY_KINDS = ["event", "membership", "general", "founders"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const inquiryInputSchema = z.object({
  kind: z.enum(INQUIRY_KINDS),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email").trim().max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  guests: z.number().int().min(1).max(500).optional(),
  preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
    // Honeypot: real users leave it empty.
    website: z.string().max(0).optional().or(z.literal("")),
  })
  // A founders request is a promise to call within one business day, so it
  // needs a number the desk can dial. The other kinds are answered by email.
  .superRefine((d, ctx) => {
    if (d.kind !== "founders") return;
    const phone = d.phone ?? "";
    if (phone.length < 7 || !PHONE_RE.test(phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "We call you back, so we need a number." });
    }
  });
export type InquiryInput = z.infer<typeof inquiryInputSchema>;

/** First human-readable message from a zod error. */
export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Invalid input";
  const path = i.path.length ? `${i.path.join(".")}: ` : "";
  return `${path}${i.message}`;
}
