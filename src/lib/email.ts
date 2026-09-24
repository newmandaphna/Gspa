import type { Booking, Experience } from "@/lib/db/schema";
import { SITE } from "@/lib/config/site";
import { formatInstant, formatMoney } from "@/lib/time";

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function confirmationText(booking: Booking, experience: Experience): { subject: string; text: string; html: string } {
  const when = formatInstant(booking.startsAt);
  const paid = booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus === "pay_on_arrival" ? "Due on arrival" : "Pending";
  const url = `${SITE.url.replace(/\/$/, "")}/reserve/confirmation/${booking.code}`;
  const subject = `Your reservation at ${SITE.name}: ${booking.code}`;
  const lines = [
    `${SITE.name}`,
    ``,
    `You're booked, ${booking.firstName}.`,
    ``,
    `${experience.name}`,
    `${when}`,
    `${booking.guests} guest${booking.guests === 1 ? "" : "s"}`,
    `Total: ${formatMoney(booking.amountCents)} (${paid})`,
    `Confirmation code: ${booking.code}`,
    ``,
    `Bring a valid government photo ID. Arrive 15 minutes early for check-in and the safety briefing.`,
    ``,
    `Manage this reservation: ${url}`,
    ``,
    `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`,
    `${SITE.phone} · ${SITE.email}`,
  ];
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,Helvetica,Arial,sans-serif;color:#1d1d1f">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6e6e73;margin:0 0 24px">${escape(SITE.name)}</p>
    <h1 style="font-size:32px;line-height:1.1;letter-spacing:-.02em;margin:0 0 24px">You're booked, ${escape(booking.firstName)}.</h1>
    <div style="background:#fff;border-radius:18px;padding:24px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:600">${escape(experience.name)}</p>
      <p style="margin:0 0 16px;color:#6e6e73">${escape(when)} · ${booking.guests} guest${booking.guests === 1 ? "" : "s"}</p>
      <p style="margin:0;font-size:15px">Total <strong>${formatMoney(booking.amountCents)}</strong> <span style="color:#6e6e73">(${paid})</span></p>
      <p style="margin:16px 0 0;font-size:15px">Confirmation code <strong style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${booking.code}</strong></p>
    </div>
    <p style="font-size:15px;line-height:1.5;margin:24px 0">Bring a valid government photo ID. Arrive 15 minutes early for check-in and the safety briefing.</p>
    <p style="margin:0 0 32px"><a href="${url}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">Manage reservation</a></p>
    <p style="font-size:12px;color:#6e6e73;line-height:1.6;margin:0">${escape(SITE.address.line1)}, ${escape(SITE.address.city)}, ${SITE.address.state} ${SITE.address.zip}<br>${escape(SITE.phone)} · ${escape(SITE.email)}</p>
  </div></body></html>`;
  return { subject, text: lines.join("\n"), html };
}

/** Never throws; email failures must not break a reservation. */
export async function sendBookingConfirmation(booking: Booking, experience: Experience): Promise<void> {
  const msg = confirmationText(booking, experience);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "test") console.info(`[email] RESEND_API_KEY not set — would send "${msg.subject}" to ${booking.email}`);
    return;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const bcc = process.env.EMAIL_BCC;
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? `${SITE.name} <reservations@${SITE.domain}>`,
      to: booking.email,
      ...(bcc ? { bcc } : {}),
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  } catch (err) {
    console.error("[email] failed to send confirmation", err);
  }
}
