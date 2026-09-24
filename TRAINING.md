# Scheduled training operations

Staff create dated sessions under Admin → Classes. Public paid enrollment requires Stripe; unlike general reservations it never silently becomes pay-on-arrival. Free enrollment confirms immediately. Staff can record payment or pay-on-arrival after verifying identity in person when required. Stripe-backed enrollments cannot be marked paid manually; reconcile Checkout first.

## Identity documents

Set a dedicated, high-entropy `SESSION_SECRET` of at least 32 characters to enable collection. The AES-256-GCM key is derived with HKDF-SHA256 and the domain-separated context `class-document-v1`. Changing this secret makes existing documents unreadable; plan deletion or controlled key migration before rotation. Never log the secret or decrypted images.

Uploads are accepted only with initial enrollment, not through arbitrary booking-code upload endpoints. JPEG/PNG files are limited to 2 MiB each and 8 MiB combined, decoded with a pixel limit, re-encoded as JPEG without EXIF, and encrypted in the database. There are no plaintext disk files. Downloads/deletion require an authenticated administrator. Roster responses include document metadata, never ciphertext.

IDs expire **30 days after the purchased class ends**. Cancelled enrollment documents are also purged. `purgeExpiredClassDocuments()` runs during enrollment and administrative document/roster access, and on every hourly scheduled run (`GET /api/cron/run`, see below), so deletion is timely even when there is no traffic. Expired IDs cannot be downloaded. Database backups must follow the operator's corresponding retention/deletion policy.

Configure Stripe and Resend before selling paid sessions and sending receipts. When email is unconfigured the admin UI reports it explicitly. Do not treat successful enrollment as proof of email delivery. Admin cancellations refund Stripe-paid enrollments before cancellation; refund errors leave the booking active. Public endpoints never return roster details or staff notes.

## Class email delivery

Class confirmations, cancellations, and reminders are written to `class_mail_outbox` before an immediate, awaited Resend attempt. Refused or unconfigured deliveries remain pending with an expiring delivery lease and stable Resend idempotency key. One Replit Scheduled Deployment, running once an hour, retries them:

```sh
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/run
```

That run first purges expired identity documents, then reconciles confirmed/cancelled class bookings whose transaction committed before an outbox insert succeeded, then drains a bounded retry batch, and finally sends the day-before reservation reminders. It is the only schedule the deployment needs. Between runs, the next enrollment request or health check retries up to five pending rows on the side, throttled to once a minute per process, so a refused send does not wait a full hour. A missing `RESEND_API_KEY` returns 503 and never records pending mail as sent. `/api/cron/class-mail` and `/api/cron/reminders` remain as aliases of the same run for any schedule that still calls them.

No production migration is performed by this feature's implementation process. Apply the reviewed class session, enrollment fields, and encrypted document schema through the normal deployment procedure.