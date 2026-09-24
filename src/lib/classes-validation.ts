import { z } from "zod";
import { isHHMM, isIsoDate, toHHMMInTz, toIsoDateInTz, zonedToUtc } from "@/lib/time";

const name = z.string().trim().min(1).max(100);
const date = z.string().refine(isIsoDate, "Enter a valid date.");
const time = z.string().refine(isHHMM, "Enter a valid time.");

export const classSessionInputSchema = z.object({
  experienceSlug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  date, startTime: time, endDate: date, endTime: time,
  priceCents: z.number().int().min(0).max(1_000_000),
  capacity: z.number().int().min(1).max(200),
  maxPerBooking: z.number().int().min(1).max(20),
  status: z.enum(["draft", "open", "closed", "cancelled"]),
  instructor: z.string().trim().max(200).nullable().optional(),
  requirements: z.string().trim().max(10000).optional(),
  staffNotes: z.string().trim().max(10000).nullable().optional(),
  collectId: z.boolean().default(false),
}).superRefine((v, ctx) => {
  if (!isIsoDate(v.date) || !isIsoDate(v.endDate) || !isHHMM(v.startTime) || !isHHMM(v.endTime)) return;
  const start = zonedToUtc(v.date, v.startTime);
  const end = zonedToUtc(v.endDate, v.endTime);
  if (end <= start) ctx.addIssue({ code: "custom", path: ["endTime"], message: "End must be after start." });
  if (toIsoDateInTz(start) !== v.date || toHHMMInTz(start) !== v.startTime ||
      toIsoDateInTz(end) !== v.endDate || toHHMMInTz(end) !== v.endTime) {
    ctx.addIssue({ code: "custom", path: ["startTime"], message: "This local time does not exist due to daylight saving time." });
  }
  if (v.maxPerBooking > v.capacity) ctx.addIssue({ code: "custom", path: ["maxPerBooking"], message: "Booking limit cannot exceed capacity." });
});

export const classEnrollmentSchema = z.object({
  sessionId: z.number().int().positive(),
  firstName: name, lastName: name,
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(7).max(40),
  mailingAddress: z.object({
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().min(2).max(100),
  }),
  attendees: z.array(z.object({ firstName: name, lastName: name })).min(1).max(20),
  ackRequirements: z.literal(true),
});

export type ClassSessionInput = z.input<typeof classSessionInputSchema>;
export type ClassEnrollmentInput = z.input<typeof classEnrollmentSchema>;