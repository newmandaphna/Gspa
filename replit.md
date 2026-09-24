# The Gun Spa — project notes for Replit

Luxury indoor shooting range + private members club in Jamaica, Queens.
Marketing site, real-time reservations, members portal, and a front-desk admin.

## Run

- Install: `npm ci` (Node.js 22; required by the project's test runner).
- Dev: `npm run dev` (port 5000, bound to 0.0.0.0). The Run button does this.
- Build: `npm run build` · Start: `npm run start` (Autoscale deployment uses these).
- Tests: `npm test` (Vitest, in-memory Postgres) · `npm run e2e` (Playwright; run `npm run e2e:setup` once to install Chromium, then either build the app or leave the dev server running on port 5000).

## Data

- With no `DATABASE_URL`, the app uses **PGlite** (embedded Postgres) stored in `./.data/pglite`.
  Fine for development. **Not for production** — Autoscale deployments have an ephemeral filesystem,
  so a published deployment without `DATABASE_URL` refuses to start (set `ALLOW_PGLITE=1` only to
  knowingly accept a per-instance, wiped-on-redeploy store).
- For production: open the **Database** tool in Replit and create a PostgreSQL database. Replit
  sets `DATABASE_URL` automatically; the app creates its tables on first request (`src/lib/db/migrate.ts`).

## Secrets (Tools → Secrets)

| Name | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes (6+ chars) | Front desk at `/admin` |
| `SESSION_SECRET` | yes (production) | Signs member and admin session cookies. A long random value (`openssl rand -base64 32`); member sign-in is disabled in production without it |
| `NEXT_PUBLIC_SITE_URL` | no | Overrides the public origin. Production builds default to `https://gunspa.com` (`canonicalUrl` in `src/lib/config/site.ts`); set this only for a staging address. Replit's deployment builder does not pass secrets to `next build`, so a value set here reaches the runtime but not the prerendered sitemap and share tags |
| `DATABASE_URL` | yes (production) | Postgres connection string; a deployment without it refuses to start |
| `TRUSTED_PROXY_HOPS` | optional | Which `X-Forwarded-For` entry (from the right) is the real client for rate limiting. Default 1 |
| `STRIPE_SECRET_KEY` | optional | Turns on card payment at reservation time |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Webhook endpoint `/api/stripe/webhook` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_BCC` | optional | Confirmation, cancellation and reminder emails via Resend. Reply-To is `SITE.email` (`src/lib/config/site.ts`), so the sending domain needs SPF and DKIM verified in Resend and someone reading the desk inbox |
| `CRON_SECRET` | with reminders | Bearer token for `GET /api/cron/reminders`, the day-before reminder run. Without it the route answers 401 to every caller (the missing secret is logged, not disclosed) and no reminder is sent. Without `RESEND_API_KEY` it answers 503 and stamps nothing, so the guests stay due |

## Scheduled Deployment (day-before reminders)

Reminders go out from a Replit **Scheduled Deployment**, not from the web server. Create one that runs
once a day at 10:00 America/New_York with the command

```
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/reminders
```

and give it the same `CRON_SECRET` secret as the Autoscale deployment. The route mails every confirmed
reservation that starts the next day in New York time and stamps `bookings.reminder_sent_at` before
each email goes out, so a second run the same day, or one that overlaps a slow first run, sends
nothing twice. Sends are spaced half a second apart for Resend's rate limit and a refused one is
left unstamped for a retry. The response lists the codes sent, any Resend refused, and any skipped.

## Where things live

- Copy, prices, catalog, tiers, FAQ, hours: `src/lib/content/*` and `src/lib/config/site.ts`.
- Legally sensitive statements: `src/lib/content/requirements.ts` (one place, reviewed by counsel).
- Booking engine: `src/lib/availability.ts` (pure), `src/lib/booking.ts` (DB + locking).
- Members: `src/lib/members/*`, pages under `src/app/members/*`.
- Admin: `src/app/admin/*`.
- Photo slots: see `MEDIA.md`.
