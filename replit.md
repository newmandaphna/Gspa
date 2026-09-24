# The Gun Spa — project notes for Replit

Luxury indoor shooting range + private members club in Jamaica, Queens.
Marketing site, real-time reservations, members portal, and a front-desk admin.

## Run

- Install: `npm ci` (Node.js 22; required by the project's test runner).
- Dev: `npm run dev` (port 5000, bound to 0.0.0.0). The Run button does this.
- Build: `npm run build` · Start: `npm run start` (Autoscale deployment uses these).
- Tests: `npm test` (Vitest, in-memory Postgres) · `npm run e2e` (Playwright; run `npm run e2e:setup` once, then either build the app or leave the dev server running on port 5000).
- Navigation-only browser checks (read-only): with the dev workflow running, run `npm run e2e:setup`, then `E2E_BASE_URL="https://$REPLIT_DEV_DOMAIN" npm run e2e:navigation`. Covers tablet/desktop layout and mobile keyboard, Escape, focus, and scroll restoration. Do not run the full `e2e` suite against shared data: it includes booking mutations.
- Browser runtime: Replit/Nix uses the `chromium` system package in `.replit`, resolved through PATH rather than a machine-specific store path. Its wrapper isolates browser libraries; do not export bundled application's libraries via `LD_LIBRARY_PATH`. Outside Nix, setup installs Playwright's pinned Chromium and OS dependencies (may require administrator privileges). `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects another compatible executable. Setup verifies an actual headless launch and reports browser/Node versions.

## Data

- With no `DATABASE_URL`, the app uses **PGlite** (embedded Postgres) stored in `./.data/pglite`.
  Fine for development. **Not for production** — Autoscale deployments have an ephemeral filesystem,
  so a published deployment without `DATABASE_URL` refuses to start (set `ALLOW_PGLITE=1` only to
  knowingly accept a per-instance, wiped-on-redeploy store).
- Replit provides PostgreSQL and sets `DATABASE_URL`. Apply scheduled-class schema changes to
  development using the database tool, then Publish syncs the development schema to managed production.
  The new class tables, booking columns, and `class_mail_outbox` are **not** created at production
  startup. Local PGlite initializes them automatically. `src/lib/db/migrate.ts` retains legacy
  startup schema initialization for older features only; do not add new production DDL there.

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
| `CRON_SECRET` | with reminders | Bearer token for `GET /api/cron/run`, the hourly scheduled run (reminders, class mail retries, document purge). Without it the route answers 401 to every caller (the missing secret is logged, not disclosed) and nothing is sent. Without `RESEND_API_KEY` it answers 503 and stamps nothing, so the guests stay due |

## Scheduled Deployment (hourly run)

Reminders and class mail retries go out from one Replit **Scheduled Deployment**, not from the web
server. Create one that runs every hour with the command

```
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/run
```

and give it the same `CRON_SECRET` secret as the Autoscale deployment. Each run does three things
in order: it purges expired class ID documents, it reconciles and drains the `class_mail_outbox`
(class confirmations are sent at enrollment; the outbox only holds retries), and it mails the
day-before reminders. A reservation is due for its reminder from 25 hours before it starts down to
12 hours before, provided it was made a day or more ahead, so the first hourly run inside that span
mails it 24 to 25 hours ahead and a run that was missed, even for half a day, still catches it on
the next one. `bookings.reminder_sent_at` is stamped before each email goes out, so a second run,
or one that overlaps a slow first run, sends nothing twice. Sends are spaced half a second apart
for Resend's rate limit and a refused one is left unstamped for the next run. The response is one
JSON summary: the purge, the outbox reconcile and delivery counts, and the reminder codes sent,
refused, and skipped.

`/api/cron/reminders` and `/api/cron/class-mail` still answer, as aliases of the same run, so an
older schedule keeps working; new schedules should call `/api/cron/run`. Between runs, an
enrollment or a hit on `/api/health` retries up to five pending outbox rows on the side (at most
once a minute per process), so a refused send does not wait a full hour.

## Where things live

- Copy, prices, catalog, tiers, FAQ, hours: `src/lib/content/*` and `src/lib/config/site.ts`.
- Legally sensitive statements: `src/lib/content/requirements.ts` (one place, reviewed by counsel).
- Booking engine: `src/lib/availability.ts` (pure), `src/lib/booking.ts` (DB + locking).
- Members: `src/lib/members/*`, pages under `src/app/members/*`.
- Admin: `src/app/admin/*`.
- Photo slots: see `MEDIA.md`.
