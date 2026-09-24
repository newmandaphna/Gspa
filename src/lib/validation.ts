import { z } from "zod";
import { BOOKING } from "@/lib/config/site";

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
    .regex(/^[+()\-.\s\d]+$/, "Enter a valid phone number"),
  memberNumber: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  ackRequirements: z.literal(true, "You must acknowledge the range requirements"),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

export const inquiryInputSchema = z.object({
  kind: z.enum(["event", "membership", "general"]),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email").trim().max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  guests: z.number().int().min(1).max(500).optional(),
  preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot: real users leave it empty.
  website: z.string().max(0).optional().or(z.literal("")),
});
export type InquiryInput = z.infer<typeof inquiryInputSchema>;

/** First human-readable message from a zod error. */
export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Invalid input";
  const path = i.path.length ? `${i.path.join(".")}: ` : "";
  return `${path}${i.message}`;
}
