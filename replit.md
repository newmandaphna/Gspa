# The Gun Spa — project notes for Replit

Luxury indoor shooting range + private members club in Jamaica, Queens.
Marketing site, real-time reservations, members portal, and a front-desk admin.

## Run

- Dev: `npm run dev` (port 5000, bound to 0.0.0.0). The Run button does this.
- Build: `npm run build` · Start: `npm run start` (Autoscale deployment uses these).
- Tests: `npm test` (Vitest, in-memory Postgres) · `npm run e2e` (Playwright, needs a built app).

## Data

- With no `DATABASE_URL`, the app uses **PGlite** (embedded Postgres) stored in `./.data/pglite`.
  Fine for development. **Not for production** — Autoscale deployments have an ephemeral filesystem.
- For production: open the **Database** tool in Replit and create a PostgreSQL database. Replit
  sets `DATABASE_URL` automatically; the app creates its tables on first request (`src/lib/db/migrate.ts`).

## Secrets (Tools → Secrets)

| Name | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes (6+ chars) | Front desk at `/admin` |
| `SESSION_SECRET` | recommended | Signs member session cookies (falls back to ADMIN_PASSWORD) |
| `NEXT_PUBLIC_SITE_URL` | for Stripe/email | Public URL, e.g. `https://thegunspa.com` |
| `DATABASE_URL` | production | Postgres connection string |
| `STRIPE_SECRET_KEY` | optional | Turns on card payment at reservation time |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Webhook endpoint `/api/stripe/webhook` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_BCC` | optional | Confirmation emails via Resend |

## Where things live

- Copy, prices, catalog, tiers, FAQ, hours: `src/lib/content/*` and `src/lib/config/site.ts`.
- Legally sensitive statements: `src/lib/content/requirements.ts` (one place, reviewed by counsel).
- Booking engine: `src/lib/availability.ts` (pure), `src/lib/booking.ts` (DB + locking).
- Members: `src/lib/members/*`, pages under `src/app/members/*`.
- Admin: `src/app/admin/*`.
- Photo slots: see `MEDIA.md`.
